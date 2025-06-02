import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TrackItem } from '../track-item';
import { MusicMetadata } from '../../../lib/types/types';
import { usePlayerStore } from '../../../lib/store'; // Required for initial state setup for context if any part of TrackItem uses it indirectly

// Mock child components if they are complex or have side effects not relevant to TrackItem's own logic.
// SongInfoCard is a major part of TrackItem's rendering.
// For this test, we want to ensure TrackItem passes the right props to SongInfoCard,
// especially the onRemove callback.
jest.mock('../song-info-card', () => ({
  SongInfoCard: jest.fn((props) => (
    <div data-testid="song-info-card">
      <span>{props.track.title}</span>
      <button onClick={() => props.onRemove(props.track)} data-testid="remove-button-mock">Remove</button>
      {/* Mock other props as needed for rendering */}
    </div>
  )),
}));

// Mock store state for context if needed, though TrackItem primarily receives props
jest.mock('../../../lib/store', () => ({
  usePlayerStore: jest.fn(),
}));


const mockTrack: MusicMetadata = {
  id: 'track1',
  filePath: 'path/to/track1.mp3',
  title: 'Test Song Title',
  artist: 'Test Artist',
  album: 'Test Album',
  duration: 180,
  fileHandle: {} as FileSystemFileHandle,
  isRemoved: false,
};

describe('TrackItem Component', () => {
  let mockOnDeleteTrack: jest.Mock;
  let mockOnEditTrack: jest.Mock;
  let mockOnAddToQueue: jest.Mock;
  let mockOnPrelistenToggle: jest.Mock;
  let mockOnSelect: jest.Mock;
  let mockOnPrelistenTimelineClick: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnDeleteTrack = jest.fn();
    mockOnEditTrack = jest.fn();
    mockOnAddToQueue = jest.fn();
    mockOnPrelistenToggle = jest.fn();
    mockOnSelect = jest.fn();
    mockOnPrelistenTimelineClick = jest.fn();

    // Setup default store mock state if any part of TrackItem or its minimal children uses it
    (usePlayerStore as jest.Mock).mockReturnValue({
        selectedDeviceId: 'default',
        prelistenDeviceId: 'default',
        setShowPreListenButtons: jest.fn(),
        hasShownPreListenWarning: false,
        setHasShownPreListenWarning: jest.fn(),
        isPlaying: false,
    });
  });

  test('calls onDeleteTrack with the track when remove button is clicked', () => {
    // Arrange
    render(
      <TrackItem
        track={mockTrack}
        currentTrack={null}
        prelistenTrack={null}
        isPrelistening={false}
        prelistenCurrentTime={0}
        showPreListenButtons={false}
        onDeleteTrack={mockOnDeleteTrack}
        onEditTrack={mockOnEditTrack}
        onAddToQueue={mockOnAddToQueue}
        onPrelistenToggle={mockOnPrelistenToggle}
        onSelect={mockOnSelect}
        onPrelistenTimelineClick={mockOnPrelistenTimelineClick}
      />
    );

    // Act
    // The actual remove button is inside SongInfoCard, which we've mocked.
    // Our mock SongInfoCard renders a button with data-testid="remove-button-mock".
    const removeButton = screen.getByTestId('remove-button-mock');
    fireEvent.click(removeButton);

    // Assert
    expect(mockOnDeleteTrack).toHaveBeenCalledTimes(1);
    expect(mockOnDeleteTrack).toHaveBeenCalledWith(mockTrack);
  });

  // Add other tests for TrackItem:
  // - selecting a track (onSelect)
  // - prelistening (onPrelistenToggle)
  // - adding to queue (onAddToQueue)
  // - editing track (onEditTrack)
  // - UI changes based on props (isSelected, currentTrack, etc.)
});
