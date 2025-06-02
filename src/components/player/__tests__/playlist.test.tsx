import { render, screen, within } from '@testing-library/react';
import { Playlist } from '../playlist'; // Adjust path as needed
import { usePlayerStore, PlayerState, MusicMetadata } from '../../../store/player-store'; // Adjust path

// Minimal initial state for tests
const initialPlayerState: PlayerState = {
  audioContext: null,
  currentSource: null,
  currentSong: null,
  isPlaying: false,
  isLooping: false,
  isShuffling: false,
  playbackSpeed: 1,
  volume: 1,
  currentTime: 0,
  duration: 0,
  playlist: [], // This is the actual playlist of IDs used for playback sequence
  originalPlaylist: [],
  currentSongIndex: -1,
  playHistory: [],
  metadata: {}, // Store song metadata objects by ID
  selectedFolderNames: [],
  triggerScan: 0,
  triggerRefresh: 0,
  isLoading: false,
  // --- Sorting & Filtering related ---
  sortField: 'title', // Default sort field
  sortOrder: 'asc',   // Default sort order
  searchTerm: '',
  // --- Store methods ---
  // Most methods are not directly called by Playlist, but are part of PlayerState
  // So, providing them as jest.fn() or simple implementations if needed by underlying hooks.
  setCurrentSong: jest.fn(),
  togglePlayPause: jest.fn(),
  playNextSong: jest.fn(),
  playPreviousSong: jest.fn(),
  updateVolume: jest.fn(),
  seek: jest.fn(),
  toggleLoop: jest.fn(),
  toggleShuffle: jest.fn(),
  setPlaybackSpeed: jest.fn(),
  addToPlaylist: jest.fn(),
  removeFromPlaylist: jest.fn(),
  clearPlaylist: jest.fn(),
  addSelectedFolder: jest.fn(),
  removeSelectedFolder: jest.fn(),
  setMetadata: jest.fn(),
  getMetadata: jest.fn((id: string) => initialPlayerState.metadata[id]),
  refreshSongList: jest.fn(),
  setAudioContext: jest.fn(),
  setIsLoading: jest.fn(),
  setSortField: jest.fn((field) => usePlayerStore.setState({ sortField: field })),
  setSortOrder: jest.fn((order) => usePlayerStore.setState({ sortOrder: order })),
  setSearchTerm: jest.fn((term) => usePlayerStore.setState({ searchTerm: term })),
};

// Mock TrackItem to focus on Playlist logic
jest.mock('@/components/player/track-item', () => ({
  TrackItem: jest.fn(({ track, onTrackSelect, isActive, isPlaying }) => (
    <div data-testid="track-item" onClick={onTrackSelect}>
      <span data-testid="track-title">{track.title}</span>
      <span data-testid="track-artist">{track.artist}</span>
      <span data-testid="track-album">{track.album}</span>
      {isActive && <span data-testid="active-track-indicator">Active</span>}
      {isPlaying && isActive && <span data-testid="playing-track-indicator">Playing</span>}
    </div>
  )),
}));

// Mock useTrackList hook as it's central to Playlist's behavior
// This allows us to directly control the tracks Playlist receives
const mockUseTrackList = jest.fn();
jest.mock('../use-track-list', () => ({
  useTrackList: () => mockUseTrackList(),
}));

// Mock usePlaylistActions to spy on handleDelete
const mockHandleDelete = jest.fn();
const actualUsePlaylistActions = jest.requireActual('../use-playlist-actions');
jest.mock('../use-playlist-actions', () => ({
  usePlaylistActions: jest.fn().mockImplementation((ref) => {
    const originalActions = actualUsePlaylistActions.usePlaylistActions(ref);
    return {
      ...originalActions,
      handleDelete: mockHandleDelete, // Spy on handleDelete
    };
  }),
}));

// Mock DB operations that will be called by usePlaylistActions
import { deleteAudioFile, getAllMetadata } from '../../../db/audio-operations';
jest.mock('../../../db/audio-operations');


describe('Playlist Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to a defined initial state for each test
    usePlayerStore.setState(initialPlayerState);
    // Reset the mock hook's return value for each test
    mockUseTrackList.mockReturnValue({
      tracks: [],
      isLoading: false,
      totalDuration: '00:00',
    });
  });

  test('renders empty state when no songs are available', () => {
    // Arrange: mockUseTrackList already returns empty tracks by default from beforeEach

    // Act
    render(<Playlist />);

    // Assert
    expect(screen.getByText(/No songs in library/i)).toBeInTheDocument();
    expect(screen.queryAllByTestId('track-item')).toHaveLength(0);
  });

  test('renders a list of songs when songs are available', () => {
    // Arrange
    const song1: MusicMetadata = {
      id: 'path/to/song1.mp3', filePath: 'path/to/song1.mp3', title: 'Song One', artist: 'Artist A', album: 'Album X',
      duration: 180, fileHandle: {} as FileSystemFileHandle, artwork: 'artwork1_url', isRemoved: false,
    };
    const song2: MusicMetadata = {
      id: 'path/to/song2.ogg', filePath: 'path/to/song2.ogg', title: 'Song Two', artist: 'Artist B', album: 'Album Y',
      duration: 240, fileHandle: {} as FileSystemFileHandle, artwork: 'artwork2_url', isRemoved: false,
    };
    mockUseTrackList.mockReturnValue({
      tracks: [song1, song2],
      isLoading: false,
      totalDuration: '07:00', // 180s + 240s = 420s = 7 minutes
    });

    // Act
    render(<Playlist />);

    // Assert
    const trackItems = screen.getAllByTestId('track-item');
    expect(trackItems).toHaveLength(2);

    // Check data passed to the first TrackItem mock
    const firstTrackItem = trackItems[0];
    expect(within(firstTrackItem).getByText('Song One')).toBeInTheDocument();
    expect(within(firstTrackItem).getByText('Artist A')).toBeInTheDocument();
    expect(within(firstTrackItem).getByText('Album X')).toBeInTheDocument();

    // Check data passed to the second TrackItem mock
    const secondTrackItem = trackItems[1];
    expect(within(secondTrackItem).getByText('Song Two')).toBeInTheDocument();
    expect(within(secondTrackItem).getByText('Artist B')).toBeInTheDocument();
    expect(within(secondTrackItem).getByText('Album Y')).toBeInTheDocument();

    // Also check that the TrackItem mock constructor was called with the correct props
    const TrackItemMock = require('@/components/player/track-item').TrackItem;
    expect(TrackItemMock).toHaveBeenCalledWith(expect.objectContaining({ track: song1 }), {});
    expect(TrackItemMock).toHaveBeenCalledWith(expect.objectContaining({ track: song2 }), {});

    // Check for total duration display (if Playlist shows it)
    // This depends on Playlist's actual rendering. Assuming it might show total duration.
    // If not, this assertion can be removed.
    // For now, let's assume there's an element with this text.
    // This might be better in a separate test for the summary/footer of the playlist.
    // expect(screen.getByText(/Total duration: 07:00/i)).toBeInTheDocument();
  });

  test('renders songs in the order provided by useTrackList (simulating sorting)', () => {
    // Arrange
    const TrackItemMockComponent = require('@/components/player/track-item').TrackItem;
    TrackItemMockComponent.mockClear(); // Clear calls from previous tests

    const songA: MusicMetadata = {
      id: 'path/to/songA.mp3', filePath: 'path/to/songA.mp3', title: 'A Title', artist: 'Artist Z', album: 'Album M',
      duration: 180, fileHandle: {} as FileSystemFileHandle, isRemoved: false,
    };
    const songB: MusicMetadata = {
      id: 'path/to/songB.ogg', filePath: 'path/to/songB.ogg', title: 'B Title', artist: 'Artist Y', album: 'Album N',
      duration: 240, fileHandle: {} as FileSystemFileHandle, isRemoved: false,
    };
    const songC: MusicMetadata = {
      id: 'path/to/songC.flac', filePath: 'path/to/songC.flac', title: 'C Title', artist: 'Artist X', album: 'Album O',
      duration: 200, fileHandle: {} as FileSystemFileHandle, isRemoved: false,
    };

    // Simulate that useTrackList returns tracks already sorted by title ascending
    mockUseTrackList.mockReturnValue({
      tracks: [songA, songB, songC], // Pre-sorted
      isLoading: false,
      totalDuration: '10:20', // 180 + 240 + 200 = 620s
    });

    // Act
    render(<Playlist />);

    // Assert
    const trackItems = screen.getAllByTestId('track-item');
    expect(trackItems).toHaveLength(3);

    // Verify the order of rendered items based on their titles
    expect(within(trackItems[0]).getByText('A Title')).toBeInTheDocument();
    expect(within(trackItems[1]).getByText('B Title')).toBeInTheDocument();
    expect(within(trackItems[2]).getByText('C Title')).toBeInTheDocument();

    // Verify TrackItem mock calls reflect the sorted order
    const TrackItemMock = require('@/components/player/track-item').TrackItem;
    expect(TrackItemMockComponent.mock.calls[0][0].track.title).toBe('A Title');
    expect(TrackItemMockComponent.mock.calls[1][0].track.title).toBe('B Title');
    expect(TrackItemMockComponent.mock.calls[2][0].track.title).toBe('C Title');
  });

  test('removes a song when its remove button is clicked (integration through mocked TrackItem)', async () => {
    // Arrange
    const songToKeep: MusicMetadata = {
      id: 'keep_this_song.mp3', filePath: 'path/to/keep_this_song.mp3', title: 'Keep This Song',
      artist: 'Artist Keep', album: 'Album Keep', duration: 180, fileHandle: {} as FileSystemFileHandle, isRemoved: false,
    };
    const songToRemove: MusicMetadata = {
      id: 'remove_this_song.mp3', filePath: 'path/to/remove_this_song.mp3', title: 'Remove This Song',
      artist: 'Artist Remove', album: 'Album Remove', duration: 200, fileHandle: {} as FileSystemFileHandle, isRemoved: false,
    };

    // Setup useTrackList to provide these songs to Playlist
    mockUseTrackList.mockReturnValue({
      tracks: [songToKeep, songToRemove],
      isLoading: false,
      totalDuration: '06:20', // 180 + 200 = 380s
    });

    // Mock the actual handleDelete from usePlaylistActions to simulate its DB call & success
    // And to allow us to verify it was called.
    // The mock setup for usePlaylistActions already makes mockHandleDelete a jest.fn()
    // We need to simulate the actual DB call and subsequent refresh that Playlist should trigger.
    mockHandleDelete.mockImplementation(async (track: MusicMetadata) => {
      // Simulate the DB call that would happen in the real handleDelete
      await (deleteAudioFile as jest.Mock).mockResolvedValue(undefined)(track.id);
      // IMPORTANT: The real handleDelete in usePlaylistActions does NOT refresh the store.
      // The Playlist component (or its parent context) is expected to do this.
      // We will simulate this refresh by directly calling the store's refresh method
      // or by mocking getAllMetadata to return the new state and having the store refresh.
      (getAllMetadata as jest.Mock).mockResolvedValue({ [songToKeep.id]: songToKeep });
      // Simulate the component triggering a refresh
      await usePlayerStore.getState().refreshSongList();
      toast.success(`Song "${track.title}" removed.`); // Simulate toast from component layer
      return Promise.resolve();
    });

    const TrackItemMockComponent = require('@/components/player/track-item').TrackItem;
    TrackItemMockComponent.mockClear();


    render(<Playlist />);

    // Find the mocked TrackItem for "Remove This Song"
    // Our TrackItem mock renders track title in a span with data-testid="track-title"
    const allTrackItems = screen.getAllByTestId('track-item');
    let removeTargetItem: HTMLElement | null = null;
    for (const item of allTrackItems) {
      const titleElement = within(item).queryByText('Remove This Song');
      if (titleElement) {
        removeTargetItem = item;
        break;
      }
    }
    expect(removeTargetItem).toBeInTheDocument();

    // The TrackItem mock itself is passed an `onDeleteTrack` prop.
    // We need to simulate this being called. The mock TrackItem calls `props.onDeleteTrack(props.track)`
    // when its "Remove" button (from SongInfoCard mock) is clicked.
    // In a real scenario, Playlist passes usePlaylistActions.handleDelete as onDeleteTrack to TrackItem.

    // Find the remove button within the specific TrackItem.
    // Our TrackItem mock (via SongInfoCard mock) has a button with text "Remove"
    // Let's assume SongInfoCard mock's remove button calls the onRemove prop.
    // TrackItem's onRemove prop is onDeleteTrack.
    // Playlist's onDeleteTrack prop for TrackItem is actions.handleDelete.

    // Get the props of the TrackItem for songToRemove to call its onDeleteTrack
    // This is a bit indirect due to the mocks.
    const trackItemInstances = TrackItemMockComponent.mock.instances;
    // Find the instance corresponding to songToRemove
    const targetTrackItemInstance = TrackItemMockComponent.mock.calls.find(call => call[0].track.id === songToRemove.id);
    expect(targetTrackItemInstance).toBeDefined();

    // Act: Simulate clicking the remove button by calling the onDeleteTrack prop passed to the TrackItem mock
    // The Playlist component wires `actions.handleDelete` to `TrackItem`'s `onDeleteTrack` prop.
    // Our TrackItem mock calls its `onDeleteTrack` prop when its "Remove" button is clicked.
    await act(async () => {
       // Directly call the onDeleteTrack prop that Playlist would pass to the specific TrackItem
       // This prop is effectively `actions.handleDelete` from `usePlaylistActions`
       const onDeleteTrackProp = targetTrackItemInstance[0].onDeleteTrack;
       await onDeleteTrackProp(songToRemove);
    });

    // Assert
    // 1. Verify usePlaylistActions.handleDelete was called (which we mocked as mockHandleDelete)
    expect(mockHandleDelete).toHaveBeenCalledWith(songToRemove);

    // 2. Verify deleteAudioFile was called (done inside mockHandleDelete's new implementation)
    expect(deleteAudioFile).toHaveBeenCalledWith(songToRemove.id);

    // 3. Verify store refresh was simulated (getAllMetadata called, then store updated)
    expect(getAllMetadata).toHaveBeenCalled();

    await waitFor(() => {
      const storeState = usePlayerStore.getState();
      expect(storeState.metadata[songToKeep.id]).toEqual(songToKeep);
      expect(storeState.metadata[songToRemove.id]).toBeUndefined(); // Song is removed
    });

    // 4. Verify UI updates - the removed song should no longer be rendered.
    // Re-check rendered items.
    // We need to wait for the re-render after state update.
    await waitFor(() => {
        const updatedTrackItems = screen.queryAllByTestId('track-item');
        expect(updatedTrackItems).toHaveLength(1);
        expect(within(updatedTrackItems[0]).getByText('Keep This Song')).toBeInTheDocument();
        expect(screen.queryByText('Remove This Song')).not.toBeInTheDocument();
    });

    // 5. Verify toast success
    expect(toast.success).toHaveBeenCalledWith(`Song "Remove This Song" removed.`);
  });
});
