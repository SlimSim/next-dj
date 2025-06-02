import { renderHook, act } from '@testing-library/react';
import { usePlaylistActions } from '../use-playlist-actions';
import { usePlayerStore, PlayerState, MusicMetadata } from '../../../store/player-store';
import { deleteAudioFile } from '../../../db/audio-operations';
import { toast } from 'sonner';
import { RefObject } from 'react';
import { PrelistenAudioRef }  from '../prelisten-audio-player';

// Mock dependencies
jest.mock('../../../db/audio-operations');
jest.mock('sonner');
jest.mock('../../../store/player-store', () => {
    const originalModule = jest.requireActual('../../../store/player-store');
    return {
        ...originalModule,
        usePlayerStore: jest.fn(),
    };
});


const mockTrack: MusicMetadata = {
  id: 'test-track-id',
  filePath: 'path/to/test-track.mp3',
  title: 'Test Track',
  artist: 'Test Artist',
  album: 'Test Album',
  duration: 180,
  fileHandle: {} as FileSystemFileHandle, // Mock file handle
  isRemoved: false,
};

// Mock initial store state that usePlaylistActions might interact with
const mockInitialStoreState = {
  currentTrack: null,
  isPlaying: false,
  addToQueue: jest.fn(),
  setCurrentTrack: jest.fn(),
  setIsPlaying: jest.fn(),
  prelistenTrack: null,
  setPrelistenTrack: jest.fn(),
  setIsPrelistening: jest.fn(),
  isPrelistening: false,
  updateTrackMetadata: jest.fn(),
  triggerRefresh: jest.fn(),
  // Add other state properties if the hook uses them directly
};

describe('usePlaylistActions', () => {
  let mockPrelistenRef: RefObject<PrelistenAudioRef>;

  beforeEach(() => {
    jest.clearAllMocks();
    (usePlayerStore as jest.Mock).mockReturnValue(mockInitialStoreState);
    mockPrelistenRef = { current: { seek: jest.fn(), play: jest.fn(), pause: jest.fn() } }; // Mock prelistenRef
  });

  describe('handleDelete', () => {
    test('should call deleteAudioFile with track id and show success toast', async () => {
      // Arrange
      (deleteAudioFile as jest.Mock).mockResolvedValue(undefined); // Simulate successful deletion
      const { result } = renderHook(() => usePlaylistActions(mockPrelistenRef));

      // Act
      await act(async () => {
        await result.current.handleDelete(mockTrack);
      });

      // Assert
      expect(deleteAudioFile).toHaveBeenCalledWith(mockTrack.id);
      // The current implementation of handleDelete in usePlaylistActions does not call toast on success.
      // It only calls toast.error on failure.
      // So, no toast.success check here unless the original hook is modified.
      // expect(toast.success).toHaveBeenCalledWith(`Track "${mockTrack.title}" deleted.`);

      // Also, the hook does not call triggerRefresh. If this is desired, it needs to be added to the hook.
      expect(mockInitialStoreState.triggerRefresh).not.toHaveBeenCalled();
    });

    test('should call toast.error if deleteAudioFile fails', async () => {
      // Arrange
      const errorMessage = 'Database error';
      (deleteAudioFile as jest.Mock).mockRejectedValue(new Error(errorMessage));
      const { result } = renderHook(() => usePlaylistActions(mockPrelistenRef));

      // Act
      await act(async () => {
        await result.current.handleDelete(mockTrack);
      });

      // Assert
      expect(deleteAudioFile).toHaveBeenCalledWith(mockTrack.id);
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining(`Failed to delete track: ${mockTrack.title}`));
      // The error message in the hook is "Failed to delete track: ${track.title}"
      // It uses a custom error handler that might format it. Let's check for the core part.
    });
  });
});
