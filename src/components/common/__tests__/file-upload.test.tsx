import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileUpload } from '../file-upload'; // Adjust path as necessary
import { usePlayerStore, PlayerState, MusicMetadata } from '../../../store/player-store'; // Adjust path
import { addAudioFile, getAllMetadata } from '../../../db/audio-operations';
import { isAudioFile } from '../../../features/audio/utils/file-utils';
import { toast } from 'sonner';
import { MockFile, MockFileSystemFileHandle } from '../../../../__mocks__/file-system.mocks'; // Using our mocks

// Mock the modules that are globally mocked in jest.setup.ts or need specific test behavior
jest.mock('../../../db/audio-operations');
jest.mock('../../../features/audio/utils/file-utils');
jest.mock('sonner');
// window.showOpenFilePicker is mocked globally in jest.setup.ts

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
  originalPlaylist: [],
  currentSongIndex: -1,
  playHistory: [],
  metadata: {},
  selectedFolderNames: [],
  triggerScan: 0,
  triggerRefresh: 0,
  isLoading: false,
  sortField: 'title',
  sortOrder: 'asc',
  searchTerm: '',
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
  setMetadata: jest.fn((newMeta) => usePlayerStore.setState(state => ({ metadata: { ...state.metadata, ...newMeta }}))),
  getMetadata: jest.fn(id => usePlayerStore.getState().metadata[id]),
  refreshSongList: jest.fn(() => {
    // Simulate refreshSongList by calling getAllMetadata and updating store
    const currentMeta = getAllMetadata.getMockImplementation() ? getAllMetadata.getMockImplementation()() : Promise.resolve({});
    return currentMeta.then(meta => {
        usePlayerStore.setState({ metadata: meta, triggerRefresh: Date.now() });
    });
  }),
  setAudioContext: jest.fn(),
  setIsLoading: jest.fn(),
  setSortField: jest.fn(),
  setSortOrder: jest.fn(),
  setSearchTerm: jest.fn(),
};


describe('FileUpload Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePlayerStore.setState(initialPlayerState);

    // Default mock implementations
    (isAudioFile as jest.Mock).mockReturnValue(false); // Default to not audio
    (addAudioFile as jest.Mock).mockResolvedValue({ success: false });
    (getAllMetadata as jest.Mock).mockResolvedValue({});
    (toast.error as jest.Mock).mockImplementation(() => {});
    (toast.success as jest.Mock).mockImplementation(() => {});

    // Reset showOpenFilePicker mock if it's used
    if (window.showOpenFilePicker) {
      (window.showOpenFilePicker as jest.Mock).mockReset();
    }
  });

  // Dummy test to ensure setup works
  test('should render', () => {
    render(<FileUpload />);
    // Depending on FileUpload's structure, it might have a button or be a drop zone.
    // For now, just checking it renders without error.
    // A more specific assertion would be to find a button like "Upload File" or "Add Song"
    // For this test, let's assume there's a button that opens the file dialog
    expect(screen.getByRole('button', { name: /add song/i })).toBeInTheDocument();
  });

  test('successfully uploads an audio file via file input', async () => {
    // Arrange
    render(<FileUpload />);

    // Assume the component uses a visually hidden input, and a button triggers its click.
    // Or, it might use a label associated with the input.
    // For simplicity, let's assume we can find the input directly or via a test-id.
    // If FileUpload has a specific structure like a button triggering a hidden input,
    // we'd first click the button, then interact with the input.
    // Let's assume the input is findable by a test ID or label.
    // We need to know how FileUpload is structured. For now, let's assume a test-id on input.
    // If not, we might need to query by role if the input is part of a form.
    // The component itself might be a button that internally creates an input on the fly.

    // Let's assume FileUpload renders an <input type="file" data-testid="file-input" />
    // If not, this query needs to be adjusted. For many components, the input is hidden
    // and programmatically clicked. We'd simulate the click on the visible button first.

    // Let's assume the "Add Song" button *is* the trigger for the hidden input,
    // or that the component handles the click on itself to open a picker.
    // For a standard <input type="file"> that is part of the DOM:
    // const fileInputElement = screen.getByTestId('file-input'); // Or other selector

    // Simulating that the component structure might involve a button that itself handles the file logic,
    // often by creating an input element dynamically or using a library.
    // If it's a simple <input type="file" /> made visible or accessible by label:
    // For the purpose of this test, let's assume `FileUpload` itself can be targeted for the change event
    // if it wraps the input logic cleverly, or we find the input.
    // A common pattern is a label wrapping an input, so clicking the label text works.
    // If the component uses a ref to a hidden input and calls click() on it,
    // we need to mock that interaction or ensure the input is briefly available.

    // Let's try to find an input directly. If not, we'll adjust.
    // Typically, a file input is not directly visible but triggered.
    // We will assume the primary button is how users interact.
    // The test below for showOpenFilePicker is a more modern approach.
    // For this test, we'll assume a classic input.

    const mockAudioFile = new MockFile(['dummy audio content'], 'test_song.mp3', { type: 'audio/mpeg' });
    const expectedMetadata: MusicMetadata = {
      id: 'test_song.mp3', // Assuming ID is filename for single uploads
      filePath: 'test_song.mp3',
      title: 'test_song', // Assuming title is derived from filename
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      duration: 0, // Duration might be extracted later
      fileHandle: expect.any(Object), // or the file itself depending on impl.
      isRemoved: false,
    };

    (isAudioFile as jest.Mock).mockReturnValue(true);
    (addAudioFile as jest.Mock).mockResolvedValue({ success: true, metadata: expectedMetadata });

    // Simulate getAllMetadata being called by refreshSongList
    (getAllMetadata as jest.Mock)
      .mockResolvedValueOnce({}) // Initial call during store setup or first render
      .mockResolvedValueOnce({ [expectedMetadata.id]: expectedMetadata }); // After adding the file

    // To simulate file input, we need to know how the component exposes it.
    // If it's a standard input:
    // const input = screen.getByLabelText(/upload song/i) or similar.
    // For now, let's assume the component is set up to receive a drop or change event on a specific element.
    // This part is highly dependent on FileUpload's internal implementation.
    // Let's assume the FileUpload component itself has a role that can accept file changes,
    // or we find a specific input element.

    // A common way to test hidden file inputs is to make them temporarily visible or use a data-testid.
    // For now, let's assume a button triggers the event that the component listens to.
    // If the component directly uses <input type="file" onChange={handleFileChange}>
    // and this input is findable (e.g. by role, label, or testId):

    // Create a dummy input element to simulate the event if the component doesn't render one directly accessible
    // or if it uses a library that abstracts it.
    // This is a workaround if the actual input is too hard to target without knowing component internals.
    const dummyInput = document.createElement('input');
    dummyInput.type = 'file';
    // Attach the event handler the component would use. This is the tricky part without seeing FileUpload.
    // Assuming FileUpload has a prop like `onFileSelect` or a method we can spy on.
    // For now, we'll assume `fireEvent.change` on a button/dropzone area is how it's triggered.

    // Let's assume the component has a button role.
    const uploadTriggerButton = screen.getByRole('button', { name: /add song/i });

    // This test will be more robust if FileUpload uses showOpenFilePicker (covered in another test)
    // or if we can reliably target its input element.
    // For classic input, often it's `fireEvent.change(screen.getByTestId('file-input'), { target: { files: [mockAudioFile] } })`
    // Let's assume the `FileUpload` component itself has an `onChange` handler or similar for testing purposes,
    // or that clicking the button and then finding the input is the way.
    // Given the constraints, we'll try a direct fireEvent on the button if it's set up to handle it,
    // or assume an input becomes available.

    // THIS IS A GUESS at FileUpload's structure. It might need a specific input target.
    // If FileUpload itself is a dropzone or directly handles file events on its root:
    // fireEvent.change(uploadTriggerButton, { target: { files: [mockAudioFile] } });
    // This is unlikely for `change`. `drop` event would be more common for a dropzone.

    // **Revising approach: Test the click that *would* open a file dialog, then manually call handler**
    // This is common if the actual input is hidden and managed by `onClick` + `ref.current.click()`.
    // We can't easily test `ref.current.click()`.
    // A better way for components with hidden inputs is to test the handler function directly if possible,
    // or ensure the component uses `data-testid` for the hidden input.

    // Let's assume for this test the FileUpload component calls a handler like `handleFileChange(event)`
    // And we are testing this handler's effects.
    // The most common pattern is for the component to have an <input type="file" ref={inputRef} onChange={actualHandler}>
    // and a button <button onClick={() => inputRef.current.click()}>.
    // We will have to assume the input is findable by a testId or role if it's part of the DOM.
    // If not, we'll focus on the showOpenFilePicker test case which is more modern.

    // Let's assume the component *does* render an input, perhaps styled to look like a button or linked via label.
    const fileInputElement = screen.getByLabelText(/add song/i); // Common for accessibility
                                                              // Or screen.getByTestId('file-input-id');

    await act(async () => {
        fireEvent.change(fileInputElement, { target: { files: [mockAudioFile] } });
    });

    await waitFor(() => {
      expect(isAudioFile).toHaveBeenCalledWith(mockAudioFile);
    });
    await waitFor(() => {
      // The FileUpload component might create a FileSystemFileHandle-like object for consistency,
      // or pass the File object directly. For single file uploads, passing the File is common.
      // If it creates a handle: expect.any(MockFileSystemFileHandle)
      // If it passes the file: mockAudioFile
      // Let's assume it tries to be consistent with folder scanning and creates a handle-like structure or passes the File.
      // The path for single files might just be the filename.
      expect(addAudioFile).toHaveBeenCalledWith(
        mockAudioFile.name, // path often defaults to filename
        expect.objectContaining({ name: mockAudioFile.name, getFile: expect.any(Function) }), // Simplified handle or the file itself
        expect.objectContaining({ title: 'test_song' }) // Basic metadata check
      );
    });

    await waitFor(() => {
      // refreshSongList calls getAllMetadata
      expect(getAllMetadata).toHaveBeenCalledTimes(2); // Initial + after add
    });

    await waitFor(() => {
      const storeState = usePlayerStore.getState();
      expect(storeState.metadata[expectedMetadata.id]).toEqual(expectedMetadata);
    });

    expect(toast.success).toHaveBeenCalledWith(`Song "test_song.mp3" added successfully.`);
  });

  test('attempts to upload a non-audio file via file input and shows error', async () => {
    // Arrange
    render(<FileUpload />);
    const fileInputElement = screen.getByLabelText(/add song/i); // Assuming same input accessibility

    const mockTextFile = new MockFile(['dummy text content'], 'notes.txt', { type: 'text/plain' });

    (isAudioFile as jest.Mock).mockReturnValue(false); // Mock as non-audio file

    const initialMetadata = usePlayerStore.getState().metadata;

    // Act
    await act(async () => {
      fireEvent.change(fileInputElement, { target: { files: [mockTextFile] } });
    });

    // Assert
    await waitFor(() => {
      expect(isAudioFile).toHaveBeenCalledWith(mockTextFile);
    });

    expect(addAudioFile).not.toHaveBeenCalled();

    // Ensure store metadata hasn't changed
    const storeState = usePlayerStore.getState();
    expect(storeState.metadata).toEqual(initialMetadata); // Should be same as initial

    expect(toast.error).toHaveBeenCalledWith("Invalid file type. Please select an audio file.");
    expect(toast.success).not.toHaveBeenCalled();
  });

  test('successfully uploads an audio file using showOpenFilePicker', async () => {
    // Arrange
    const mockAudioFile = new MockFile(['dummy audio content'], 'picker_song.mp3', { type: 'audio/mpeg' });
    const mockFileHandle = new MockFileSystemFileHandle('picker_song.mp3', mockAudioFile);

    // Setup the global window.showOpenFilePicker mock from jest.setup.ts to be active for this test
    // (window.showOpenFilePicker as jest.Mock).mockReset(); // Already in beforeEach
    (window.showOpenFilePicker as jest.Mock).mockResolvedValue([mockFileHandle]);

    render(<FileUpload />);
    const uploadButton = screen.getByRole('button', { name: /add song/i }); // Or whatever triggers the picker

    const expectedMetadata: MusicMetadata = {
      id: 'picker_song.mp3', filePath: 'picker_song.mp3', title: 'picker_song',
      artist: 'Unknown Artist', album: 'Unknown Album', duration: 0,
      fileHandle: mockFileHandle, isRemoved: false,
    };

    (isAudioFile as jest.Mock).mockReturnValue(true); // For the file from picker
    (addAudioFile as jest.Mock).mockResolvedValue({ success: true, metadata: expectedMetadata });
    (getAllMetadata as jest.Mock)
      .mockResolvedValueOnce({}) // Initial
      .mockResolvedValueOnce({ [expectedMetadata.id]: expectedMetadata }); // After add

    // Act
    await act(async () => {
      fireEvent.click(uploadButton);
    });

    // Assert
    expect(window.showOpenFilePicker).toHaveBeenCalled();

    // getFile() is called internally by the component on the handle
    // We can check if the handle passed to addAudioFile is our mockFileHandle
    // which implies getFile() would have been used if the component needs the File object.
    // Or, if addAudioFile is robust, it might accept the handle directly.

    await waitFor(() => {
      // isAudioFile would be called with the File object obtained from the handle
      expect(isAudioFile).toHaveBeenCalledWith(mockAudioFile);
    });

    await waitFor(() => {
      expect(addAudioFile).toHaveBeenCalledWith(
        mockFileHandle.name, // Path is likely the handle's name
        mockFileHandle,      // The handle itself is passed
        expect.objectContaining({ title: 'picker_song' })
      );
    });

    await waitFor(() => {
      expect(getAllMetadata).toHaveBeenCalledTimes(2); // Initial + after add
    });

    await waitFor(() => {
      const storeState = usePlayerStore.getState();
      expect(storeState.metadata[expectedMetadata.id]).toEqual(expectedMetadata);
    });

    expect(toast.success).toHaveBeenCalledWith(`Song "picker_song.mp3" added successfully.`);
  });
});
