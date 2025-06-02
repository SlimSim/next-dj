import { render, act, waitFor } from '@testing-library/react';
import { FolderScanner } from '../folder-scanner'; // Assuming path
import { usePlayerStore, PlayerState } from '../../../store/player-store'; // Assuming path
import { MockFileSystemDirectoryHandle, MockFileSystemFileHandle, MockFile } from '../../../../__mocks__/file-system.mocks';
import { addAudioFile, getAllMetadata } from '../../../db/audio-operations'; // Path to mocked DB functions
import { getHandle } from '../../../db/handle-operations'; // Path to mocked DB functions
import { toast } from 'sonner'; // Mocked sonner

// Mock the modules that are globally mocked in jest.setup.ts
// This is good practice to make it explicit in tests, though jest.setup.ts should handle it.
jest.mock('../../../db/audio-operations');
jest.mock('../../../db/handle-operations');
jest.mock('../../../db/metadata-operations');
jest.mock('../../../db/schema');
jest.mock('../../../features/audio/utils/file-utils');
jest.mock('sonner');

// Define a minimal initial state for the player store for testing
import { removeHandle } from '../../../db/handle-operations';
import { markFileAsRemoved } from '../../../db/metadata-operations';

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
  playlist: [],
  originalPlaylist: [], // For shuffle functionality
  currentSongIndex: -1,
  playHistory: [], // Stores indices of played songs
  metadata: {}, // Store song metadata
  selectedFolderNames: [], // Names of selected folders
  triggerScan: 0, // Trigger for rescanning folders
  triggerRefresh: 0, // Trigger for refreshing song list
  isLoading: false, // Loading state for async operations
  setCurrentSong: () => {},
  togglePlayPause: () => {},
  playNextSong: () => {},
  playPreviousSong: () => {},
  updateVolume: () => {},
  seek: () => {},
  toggleLoop: () => {},
  toggleShuffle: () => {},
  setPlaybackSpeed: () => {},
  addToPlaylist: () => {},
  removeFromPlaylist: () => {},
  clearPlaylist: () => {},
  addSelectedFolder: () => {},
  removeSelectedFolder: () => {},
  setMetadata: () => {},
  getMetadata: () => (undefined),
  refreshSongList: () => {},
  setAudioContext: () => {},
  setIsLoading: () => {},
};


describe('FolderScanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the player store to its initial state before each test
    usePlayerStore.setState(initialPlayerState);

    // Default mock for getHandle to return null (no handle found)
    (getHandle as jest.Mock).mockResolvedValue(null);
    // Default mock for getAllMetadata to return empty
    (getAllMetadata as jest.Mock).mockResolvedValue({});
    // Default mock for addAudioFile
    (addAudioFile as jest.Mock).mockResolvedValue({ success: true, metadata: {} });
    // Default mock for toast
    (toast.error as jest.Mock).mockImplementation(() => {});
    (toast.success as jest.Mock).mockImplementation(() => {});
  });

  test('should be creatable (dummy test to ensure setup works)', () => {
    render(<FolderScanner />);
    expect(true).toBe(true); // Basic check to ensure component renders without crashing
  });

  test('scans a folder with audio files and updates the store', async () => {
    // Arrange
    const mockSong1 = new MockFile('song1.mp3', 'audio/mpeg', 1024 * 1024);
    const mockSong2 = new MockFile('song2.ogg', 'audio/ogg', 2048 * 1024);
    const mockTextFile = new MockFile('notes.txt', 'text/plain', 500);

    const mockSong1Handle = new MockFileSystemFileHandle('song1.mp3', mockSong1);
    const mockSong2Handle = new MockFileSystemFileHandle('song2.ogg', mockSong2);
    const mockTextFileHandle = new MockFileSystemFileHandle('notes.txt', mockTextFile);

    const mockMusicFolderHandle = new MockFileSystemDirectoryHandle('MusicFolder', [
      mockSong1Handle,
      mockTextFileHandle, // Non-audio file
      mockSong2Handle,
    ]);

    (getHandle as jest.Mock).mockResolvedValue(mockMusicFolderHandle);

    const expectedMetadataSong1 = {
      id: 'MusicFolder/song1.mp3',
      title: 'song1',
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      filePath: 'MusicFolder/song1.mp3',
      fileHandle: mockSong1Handle,
      duration: 0, // Assuming duration is extracted later or default
      artwork: undefined,
    };
    const expectedMetadataSong2 = {
      id: 'MusicFolder/song2.ogg',
      title: 'song2',
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      filePath: 'MusicFolder/song2.ogg',
      fileHandle: mockSong2Handle,
      duration: 0,
      artwork: undefined,
    };

    (addAudioFile as jest.Mock)
      .mockImplementation(async (filePath, handle, metadata) => {
        if (filePath === 'MusicFolder/song1.mp3') return { success: true, metadata: expectedMetadataSong1 };
        if (filePath === 'MusicFolder/song2.ogg') return { success: true, metadata: expectedMetadataSong2 };
        return { success: false };
      });

    // Mock getAllMetadata to reflect changes after adding files
    // It's called once at the beginning, then potentially after scanning.
    const initialGetAllMetadataMock = jest.fn().mockResolvedValue({});
    const afterScanGetAllMetadataMock = jest.fn().mockResolvedValue({
      [expectedMetadataSong1.id]: expectedMetadataSong1,
      [expectedMetadataSong2.id]: expectedMetadataSong2,
    });
    (getAllMetadata as jest.Mock)
        .mockImplementationOnce(initialGetAllMetadataMock) // Before scan
        .mockImplementation(afterScanGetAllMetadataMock); // After scan actions triggered by FolderScanner

    // Act
    // Initial render, FolderScanner might run once if selectedFolderNames is already populated
    render(<FolderScanner />);

    // Simulate selecting a folder and triggering a scan
    // Wrapping state updates and effects in act()
    await act(async () => {
      usePlayerStore.setState({ selectedFolderNames: ['MusicFolder'], triggerScan: 1 });
    });

    // Assert
    // Wait for all async operations within FolderScanner to complete
    await waitFor(() => {
      expect(getHandle).toHaveBeenCalledWith('MusicFolder');
    });

    // Check addAudioFile calls
    // Order might not be guaranteed, so check for specific calls
    await waitFor(() => {
      expect(addAudioFile).toHaveBeenCalledWith(
        'MusicFolder/song1.mp3',
        mockSong1Handle,
        expect.objectContaining({ title: 'song1' }) // Basic metadata check
      );
      expect(addAudioFile).toHaveBeenCalledWith(
        'MusicFolder/song2.ogg',
        mockSong2Handle,
        expect.objectContaining({ title: 'song2' })
      );
      expect(addAudioFile).not.toHaveBeenCalledWith(
        'MusicFolder/notes.txt',
        mockTextFileHandle,
        expect.any(Object)
      );
    });

    // Check if getAllMetadata was called (e.g. to refresh the store)
    // It's called once initially by the store setup, then by FolderScanner
    await waitFor(() => {
       // The mockImplementationOnce and subsequent default mock handles this.
       // We expect the second implementation (afterScanGetAllMetadataMock) to have been called by FolderScanner logic.
      expect(afterScanGetAllMetadataMock).toHaveBeenCalled();
    });

    // Verify store state after scan
    // The FolderScanner is expected to call refreshSongList, which updates metadata and triggerRefresh
    // We are checking the outcome: metadata in store and triggerRefresh incremented.
    await waitFor(() => {
      const storeState = usePlayerStore.getState();
      expect(storeState.metadata[expectedMetadataSong1.id]).toEqual(expectedMetadataSong1);
      expect(storeState.metadata[expectedMetadataSong2.id]).toEqual(expectedMetadataSong2);
      expect(storeState.triggerRefresh).toBeGreaterThanOrEqual(1); // Assuming initial is 0
    });

    // Verify toast messages for success (optional, but good for UX)
    expect(toast.success).toHaveBeenCalledWith("Scan complete. Added 2 new audio files.");
    expect(toast.error).not.toHaveBeenCalled();

  });

  test('scans an empty folder and does not add any files', async () => {
    // Arrange
    const mockEmptyFolderHandle = new MockFileSystemDirectoryHandle('EmptyFolder', []);
    (getHandle as jest.Mock).mockResolvedValue(mockEmptyFolderHandle);
    (getAllMetadata as jest.Mock).mockResolvedValue({}); // No existing metadata

    // Act
    render(<FolderScanner />);
    await act(async () => {
      usePlayerStore.setState({ selectedFolderNames: ['EmptyFolder'], triggerScan: 2 }); // Increment triggerScan
    });

    // Assert
    await waitFor(() => {
      expect(getHandle).toHaveBeenCalledWith('EmptyFolder');
    });

    await waitFor(() => {
      // addAudioFile should not be called as there are no files
      expect(addAudioFile).not.toHaveBeenCalled();
      // getAllMetadata might be called by the store's refresh mechanism
      // If the scanner always calls refresh, this will be called.
      // If it only calls refresh when files are found, this might not be.
      // Let's assume it's called to ensure consistency.
      expect(getAllMetadata as jest.Mock).toHaveBeenCalledTimes(1); // Initial call from store, then one from scanner's refresh
    });

    const storeState = usePlayerStore.getState();
    expect(Object.keys(storeState.metadata).length).toBe(0); // Metadata should remain empty

    // Check for an appropriate toast message
    expect(toast.info).toHaveBeenCalledWith("Scan complete. No new audio files found in EmptyFolder.");
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  test('scans a folder with only non-audio files and does not add any files', async () => {
    // Arrange
    const mockImageFile = new MockFile('image.jpg', 'image/jpeg', 102400);
    const mockPdfFile = new MockFile('document.pdf', 'application/pdf', 204800);
    const mockImageHandle = new MockFileSystemFileHandle('image.jpg', mockImageFile);
    const mockPdfHandle = new MockFileSystemFileHandle('document.pdf', mockPdfFile);

    const mockMiscFolderHandle = new MockFileSystemDirectoryHandle('MiscFiles', [
      mockImageHandle,
      mockPdfHandle,
    ]);
    (getHandle as jest.Mock).mockResolvedValue(mockMiscFolderHandle);
    (getAllMetadata as jest.Mock).mockResolvedValue({}); // No existing metadata

    // Act
    render(<FolderScanner />);
    await act(async () => {
      usePlayerStore.setState({ selectedFolderNames: ['MiscFiles'], triggerScan: 3 }); // Increment triggerScan
    });

    // Assert
    await waitFor(() => {
      expect(getHandle).toHaveBeenCalledWith('MiscFiles');
    });

    await waitFor(() => {
      expect(addAudioFile).not.toHaveBeenCalled();
      // getAllMetadata might be called once by the store's refresh mechanism,
      // and potentially again by the scanner's refresh logic.
      // Depending on implementation, it could be 1 or 2.
      // If refreshSongList is always called by scanner, it would be 2.
      // Let's stick to the previous test's logic for getAllMetadata calls.
      expect(getAllMetadata as jest.Mock).toHaveBeenCalledTimes(1);
    });

    const storeState = usePlayerStore.getState();
    expect(Object.keys(storeState.metadata).length).toBe(0); // Metadata should remain empty

    // Check for an appropriate toast message
    expect(toast.info).toHaveBeenCalledWith("Scan complete. No new audio files found in MiscFiles.");
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  test('scans a folder with nested subdirectories and adds all audio files', async () => {
    // Arrange
    const mockRootSong = new MockFile('root_song.mp3', 'audio/mpeg', 1024 * 1024);
    const mockAlbumSong = new MockFile('album_song.flac', 'audio/flac', 3072 * 1024);

    const mockRootSongHandle = new MockFileSystemFileHandle('root_song.mp3', mockRootSong);
    const mockAlbumSongHandle = new MockFileSystemFileHandle('album_song.flac', mockAlbumSong);

    const mockSubFolderHandle = new MockFileSystemDirectoryHandle('ArtistAlbum', [mockAlbumSongHandle]);
    const mockMusicRootHandle = new MockFileSystemDirectoryHandle('MusicRoot', [
      mockRootSongHandle,
      mockSubFolderHandle,
    ]);

    (getHandle as jest.Mock).mockResolvedValue(mockMusicRootHandle);

    const expectedMetadataRootSong = {
      id: 'MusicRoot/root_song.mp3', title: 'root_song', artist: 'Unknown Artist', album: 'Unknown Album',
      filePath: 'MusicRoot/root_song.mp3', fileHandle: mockRootSongHandle, duration: 0, artwork: undefined,
    };
    const expectedMetadataAlbumSong = {
      id: 'MusicRoot/ArtistAlbum/album_song.flac', title: 'album_song', artist: 'Unknown Artist', album: 'Unknown Album',
      filePath: 'MusicRoot/ArtistAlbum/album_song.flac', fileHandle: mockAlbumSongHandle, duration: 0, artwork: undefined,
    };

    (addAudioFile as jest.Mock)
      .mockImplementation(async (filePath, handle, metadata) => {
        if (filePath === expectedMetadataRootSong.filePath) return { success: true, metadata: expectedMetadataRootSong };
        if (filePath === expectedMetadataAlbumSong.filePath) return { success: true, metadata: expectedMetadataAlbumSong };
        return { success: false };
      });

    const afterScanGetAllMetadataMock = jest.fn().mockResolvedValue({
      [expectedMetadataRootSong.id]: expectedMetadataRootSong,
      [expectedMetadataAlbumSong.id]: expectedMetadataAlbumSong,
    });
    (getAllMetadata as jest.Mock)
      .mockImplementationOnce(jest.fn().mockResolvedValue({})) // Initial empty
      .mockImplementation(afterScanGetAllMetadataMock); // After scan

    // Act
    render(<FolderScanner />);
    await act(async () => {
      usePlayerStore.setState({ selectedFolderNames: ['MusicRoot'], triggerScan: 4 }); // New scan trigger
    });

    // Assert
    await waitFor(() => {
      expect(getHandle).toHaveBeenCalledWith('MusicRoot');
    });

    await waitFor(() => {
      expect(addAudioFile).toHaveBeenCalledWith(
        'MusicRoot/root_song.mp3',
        mockRootSongHandle,
        expect.objectContaining({ title: 'root_song' })
      );
      expect(addAudioFile).toHaveBeenCalledWith(
        'MusicRoot/ArtistAlbum/album_song.flac',
        mockAlbumSongHandle,
        expect.objectContaining({ title: 'album_song' })
      );
    });

    await waitFor(() => {
      expect(afterScanGetAllMetadataMock).toHaveBeenCalled();
    });

    const storeState = usePlayerStore.getState();
    expect(storeState.metadata[expectedMetadataRootSong.id]).toEqual(expectedMetadataRootSong);
    expect(storeState.metadata[expectedMetadataAlbumSong.id]).toEqual(expectedMetadataAlbumSong);
    expect(storeState.triggerRefresh).toBeGreaterThanOrEqual(1); // Assuming it increments

    expect(toast.success).toHaveBeenCalledWith("Scan complete. Added 2 new audio files.");
  });

  test('handles error when getHandle fails to retrieve a folder handle', async () => {
    // Arrange
    (getHandle as jest.Mock).mockRejectedValue(new Error("Test: Cannot access folder"));
    (getAllMetadata as jest.Mock).mockResolvedValue({}); // Should not change

    // Act
    render(<FolderScanner />);
    await act(async () => {
      usePlayerStore.setState({ selectedFolderNames: ['ErrorFolder'], triggerScan: 5 });
    });

    // Assert
    await waitFor(() => {
      expect(getHandle).toHaveBeenCalledWith('ErrorFolder');
    });

    await waitFor(() => {
      // Ensure toast.error was called with a message containing the folder name and/or error
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("Error accessing folder ErrorFolder"));
      // Or, if the error message is more generic:
      // expect(toast.error).toHaveBeenCalledWith("Failed to scan folder: ErrorFolder. Error: Test: Cannot access folder");
    });

    expect(addAudioFile).not.toHaveBeenCalled();

    const storeState = usePlayerStore.getState();
    expect(Object.keys(storeState.metadata).length).toBe(0); // Metadata should remain unchanged
    expect(storeState.triggerRefresh).toBe(initialPlayerState.triggerRefresh); // triggerRefresh should not change
  });

  test('handles directory becoming inaccessible during scan and cleans up', async () => {
    // Arrange
    const problematicFolderName = 'ProblemFolder';
    const preExistingFileId = `${problematicFolderName}/old_song.mp3`;
    const preExistingMetadata = {
      id: preExistingFileId, title: 'old_song', artist: 'Previous Artist', album: 'Old Album',
      filePath: preExistingFileId, fileHandle: new MockFileSystemFileHandle('old_song.mp3'), duration: 120, artwork: undefined,
      isRemoved: false, // Important: initially not removed
    };

    // Mock a directory handle that throws an error when its values() method is called
    const problematicHandle = new MockFileSystemDirectoryHandle(problematicFolderName, []);
    problematicHandle.values = async function* () {
      // Simulate initial access, then error
      yield new MockFileSystemFileHandle('somefile.txt'); // It might list one file then fail
      throw new Error('Simulated read error during iteration');
    };
    (getHandle as jest.Mock).mockResolvedValue(problematicHandle);

    // Pre-populate store and DB with one song from this folder
    usePlayerStore.setState({
      ...initialPlayerState,
      selectedFolderNames: [problematicFolderName],
      metadata: { [preExistingFileId]: preExistingMetadata },
      triggerScan: 0, // Ensure scan is triggered by next update
    });
    (getAllMetadata as jest.Mock).mockResolvedValue({ [preExistingFileId]: preExistingMetadata });
    (markFileAsRemoved as jest.Mock).mockResolvedValue(undefined);
    (removeHandle as jest.Mock).mockResolvedValue(undefined);


    // Act
    render(<FolderScanner />);
    // Trigger the scan for the problematic folder
    await act(async () => {
      // Increment triggerScan to ensure FolderScanner picks up the change if it depends on it
      usePlayerStore.setState(state => ({ ...state, triggerScan: (state.triggerScan || 0) + 1 }));
    });

    // Assert
    await waitFor(() => {
      expect(getHandle).toHaveBeenCalledWith(problematicFolderName);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining(`Error scanning folder ${problematicFolderName}`));
    });

    await waitFor(() => {
      // Check that attempts were made to clean up
      expect(removeHandle).toHaveBeenCalledWith(problematicFolderName);
      // Check if files previously from this folder are marked as removed
      expect(markFileAsRemoved).toHaveBeenCalledWith(preExistingFileId);
    });

    // Verify store state reflects cleanup
    await waitFor(() => {
      const storeState = usePlayerStore.getState();
      // Folder should be removed from selectedFolderNames
      expect(storeState.selectedFolderNames).not.toContain(problematicFolderName);
      // Metadata for the song from that folder should be marked as removed (or gone)
      // Depending on implementation, it might be removed or flagged. Let's assume flagged.
      // If FolderScanner calls refreshSongList, which uses getAllMetadata, this check might need adjustment
      // For now, let's assume markFileAsRemoved is the primary action recorded.
      // A more robust check would be that the store's metadata for preExistingFileId shows it as removed.
      // This requires that the component updates the store after markFileAsRemoved.
      // Let's assume the component calls refreshSongList which fetches updated metadata.
      (getAllMetadata as jest.Mock).mockResolvedValue({
         [preExistingFileId]: { ...preExistingMetadata, isRemoved: true }
      });
      usePlayerStore.getState().refreshSongList(); // Manually trigger refresh if component doesn't
    });

    await waitFor(() => {
        const storeStateUpdated = usePlayerStore.getState();
        expect(storeStateUpdated.metadata[preExistingFileId]?.isRemoved).toBe(true);
    });

    expect(addAudioFile).not.toHaveBeenCalled(); // No new files should have been added
  });

  test('handles file removal when a previously scanned file is no longer present', async () => {
    // Arrange
    const folderName = 'MyMusic';
    const song1Id = `${folderName}/song1.mp3`;
    const song2Id = `${folderName}/song2.mp3`; // This song will be "removed"

    const mockSong1File = new MockFile('song1.mp3', 'audio/mpeg', 1024);
    const mockSong1Handle = new MockFileSystemFileHandle('song1.mp3', mockSong1File);

    // Initial metadata including song2
    const initialSong1Metadata = {
      id: song1Id, title: 'song1', filePath: song1Id, fileHandle: mockSong1Handle,
      isRemoved: false, artist: 'Artist', album: 'Album', duration: 180, artwork: undefined,
    };
    const initialSong2Metadata = { // song2 is present initially
      id: song2Id, title: 'song2', filePath: song2Id, fileHandle: new MockFileSystemFileHandle('song2.mp3'),
      isRemoved: false, artist: 'Artist', album: 'Album', duration: 200, artwork: undefined,
    };

    // Setup initial store state and DB mocks
    usePlayerStore.setState({
      ...initialPlayerState,
      selectedFolderNames: [folderName],
      metadata: { [song1Id]: initialSong1Metadata, [song2Id]: initialSong2Metadata },
      triggerScan: 0,
    });
    (getAllMetadata as jest.Mock).mockResolvedValue({ // Initial DB state
      [song1Id]: initialSong1Metadata,
      [song2Id]: initialSong2Metadata,
    });
    (markFileAsRemoved as jest.Mock).mockResolvedValue(undefined);

    // Mock for getHandle: first time it returns a handle with song1 & song2
    // For the rescan, it will return a handle with only song1
    const initialDirEntries = [mockSong1Handle, new MockFileSystemFileHandle('song2.mp3', new MockFile('song2.mp3', 'audio/mpeg', 1024))];
    const updatedDirEntries = [mockSong1Handle]; // song2.mp3 is now missing

    const musicFolderHandleInstancePhase1 = new MockFileSystemDirectoryHandle(folderName, initialDirEntries);
    const musicFolderHandleInstancePhase2 = new MockFileSystemDirectoryHandle(folderName, updatedDirEntries);

    (getHandle as jest.Mock)
      .mockResolvedValueOnce(musicFolderHandleInstancePhase1) // For any initial scan that might happen implicitly
      .mockResolvedValueOnce(musicFolderHandleInstancePhase1) // For the first explicit scan in test setup
      .mockResolvedValue(musicFolderHandleInstancePhase2);    // For the rescan

    // Mock addAudioFile: for song1, it might be called to update.
    (addAudioFile as jest.Mock).mockImplementation(async (filePath, handle, metadata) => {
      if (filePath === song1Id) return { success: true, metadata: initialSong1Metadata };
      return { success: false }; // Should not be called for song2
    });

    // Render the component - it might perform an initial scan based on store state
    render(<FolderScanner />);
    // Ensure initial state is processed if FolderScanner reacts to initial selectedFolderNames
    await act(async () => {
        usePlayerStore.setState(state => ({ ...state, triggerScan: (state.triggerScan || 0) + 1 }));
    });
    await waitFor(() => expect(getHandle).toHaveBeenCalledWith(folderName));


    // Act: Trigger a re-scan of the "MyMusic" folder.
    // The mock for getHandle is now set to return the handle *without* song2.mp3
    await act(async () => {
      usePlayerStore.setState(state => ({ ...state, triggerScan: (state.triggerScan || 0) + 1 }));
    });

    // Assert
    await waitFor(() => {
      // getHandle should have been called again for the rescan
      expect(getHandle).toHaveBeenCalledWith(folderName);
       // addAudioFile might be called for song1 (e.g., to update its handle or confirm its presence)
      expect(addAudioFile).toHaveBeenCalledWith(song1Id, mockSong1Handle, expect.any(Object));
    });

    // Crucially, addAudioFile should NOT have been called for song2 in the context of the *rescan*
    // To be precise, we check its calls *after* the rescan was triggered.
    // The number of calls to addAudioFile for song1 might be 2 (initial + rescan), for song2 should be 0 (during rescan)
    // This assertion is a bit tricky due to potential initial scan. A more robust way is to check calls *after* a certain point.
    // For simplicity, we rely on the mock implementation of addAudioFile for song2 to return {success: false}
    // and ensure it's not called with song2Id during the rescan logic.
    // The fact that markFileAsRemoved is called for song2Id is a stronger indicator.

    await waitFor(() => {
      expect(markFileAsRemoved).toHaveBeenCalledWith(song2Id);
    });

    // After markFileAsRemoved, the component should refresh the song list.
    // Mock getAllMetadata to return the state where song2 is marked as removed.
    (getAllMetadata as jest.Mock).mockResolvedValue({
      [song1Id]: initialSong1Metadata, // song1 still there
      [song2Id]: { ...initialSong2Metadata, isRemoved: true }, // song2 marked as removed
    });
    // If FolderScanner itself calls refreshSongList:
    // await waitFor(() => expect(usePlayerStore.getState().metadata[song2Id]?.isRemoved).toBe(true));
    // If we need to manually trigger to see the effect in store:
    await act(async () => {
      usePlayerStore.getState().refreshSongList();
    });

    await waitFor(() => {
      const storeState = usePlayerStore.getState();
      expect(storeState.metadata[song1Id]?.isRemoved).toBe(false);
      expect(storeState.metadata[song2Id]?.isRemoved).toBe(true);
    });

    expect(toast.info).toHaveBeenCalledWith(expect.stringContaining("Scan complete. Updated 1 file, removed 1 file from MyMusic."));
  });
});
