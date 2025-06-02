import { usePlayerStore, initialState, PlayerState } from '../store';
import { removeHandle as dbRemoveHandle } from '../../db/handle-operations'; // Alias to avoid conflict if store has a 'removeHandle'
import { initMusicDB } from '../../db/schema';
import { MusicMetadata } from '../types/types'; // Assuming this is the correct path

// Mock external dependencies
jest.mock('../../db/handle-operations', () => ({
  removeHandle: jest.fn(),
}));
jest.mock('../../db/schema', () => ({
  initMusicDB: jest.fn(),
}));

// Define a type for our mock DB object store for clarity
type MockObjectStore = {
  delete: jest.Mock;
  getAll: jest.Mock;
  put: jest.Mock;
  openCursor: jest.Mock;
  // Add other methods if the store uses them
};

// Define a type for our mock DB for clarity
type MockDB = {
  transaction: jest.Mock<any, [string[], IDBTransactionMode]>;
  objectStore: jest.Mock<MockObjectStore, [string]>; // Mock for the objectStore method
  close: jest.Mock;
  // Add other DB properties/methods if needed
};

describe('usePlayerStore - removeFolder action', () => {
  let mockDb: MockDB;
  let mockMetadataObjectStore: MockObjectStore;
  let mockHandlesObjectStore: MockObjectStore; // For the 'handles' store if removeFolder interacts

  // Helper to define a clean initial state for each test
  const getTestInitialState = (): PlayerState => ({
    ...initialState, // Spread the actual initial state
    // Override specific parts if needed for testing this action
    selectedFolderNames: [],
    metadata: {},
    triggerRefresh: 0,
    // Ensure all functions are jest.fn() for testing if they are part of initialState
    // For example (if these are methods directly on the state):
    // refreshSongList: jest.fn(),
    // etc.
    // However, actions are usually called like usePlayerStore.getState().actionName()
    // So, the functions in initialState might not need to be mocks if they are not directly used by removeFolder
  });

  beforeEach(() => {
    jest.clearAllMocks();
    usePlayerStore.setState(getTestInitialState());

    // Setup mock IndexedDB
    mockMetadataObjectStore = {
      delete: jest.fn().mockResolvedValue(undefined),
      getAll: jest.fn().mockResolvedValue([]),
      put: jest.fn().mockResolvedValue(undefined),
      openCursor: jest.fn(), // Basic mock, can be enhanced if cursors are heavily used
    };
    mockHandlesObjectStore = { // Mock for the 'handles' store
        delete: jest.fn().mockResolvedValue(undefined),
        getAll: jest.fn().mockResolvedValue([]),
        put: jest.fn().mockResolvedValue(undefined),
        openCursor: jest.fn(),
    };

    mockDb = {
      transaction: jest.fn().mockImplementation((storeNames: string[] | string) => {
        // Depending on which store is requested, return the appropriate mock object store
        if (Array.isArray(storeNames) && storeNames.includes('metadata') || storeNames === 'metadata') {
          return { objectStore: () => mockMetadataObjectStore, commit: jest.fn() };
        }
        if (Array.isArray(storeNames) && storeNames.includes('handles') || storeNames === 'handles') {
            return { objectStore: () => mockHandlesObjectStore, commit: jest.fn() };
        }
        // Fallback for other stores if any
        return { objectStore: jest.fn().mockReturnValue({
            delete: jest.fn(), getAll: jest.fn(), put: jest.fn(), openCursor: jest.fn()
        }), commit: jest.fn() };
      }),
      objectStore: jest.fn(), // This won't be directly called if transaction().objectStore() is used
      close: jest.fn(),
    };
    (initMusicDB as jest.Mock).mockResolvedValue(mockDb);
    (dbRemoveHandle as jest.Mock).mockResolvedValue(undefined); // Mock the imported DB function
  });

  test('initial setup test to ensure mocks are working', () => {
    expect(initMusicDB).not.toHaveBeenCalled();
  });

  test('removeFolder successfully removes folder, marks songs as removed, and updates store', async () => {
    // Arrange
    const folderToRemove = "FolderToRemove";
    const anotherFolder = "AnotherFolder";
    const unrelatedFolder = "UnrelatedFolder";

    usePlayerStore.setState({
      selectedFolderNames: [folderToRemove, anotherFolder],
      triggerRefresh: 0, // Initial value
    });

    const song1: MusicMetadata = { id: '1', filePath: `${folderToRemove}/track1.mp3`, title: "Track 1", artist: "Artist", album: "Album", duration: 100, fileHandle: {} as any, isRemoved: false };
    const song2: MusicMetadata = { id: '2', filePath: `${folderToRemove}/sub/track2.mp3`, title: "Track 2", artist: "Artist", album: "Album", duration: 100, fileHandle: {} as any, isRemoved: false };
    const song3: MusicMetadata = { id: '3', filePath: `${anotherFolder}/track3.mp3`, title: "Track 3", artist: "Artist", album: "Album", duration: 100, fileHandle: {} as any, isRemoved: false };
    const song4: MusicMetadata = { id: '4', filePath: `${unrelatedFolder}/track4.mp3`, title: "Track 4", artist: "Artist", album: "Album", duration: 100, fileHandle: {} as any, isRemoved: false };

    mockMetadataObjectStore.getAll.mockResolvedValue([song1, song2, song3, song4]);
    const putSpy = mockMetadataObjectStore.put;
    const initialRefreshTrigger = usePlayerStore.getState().triggerRefresh;

    // Act
    await usePlayerStore.getState().removeFolder(folderToRemove);

    // Assert
    // 1. DB interactions
    expect(initMusicDB).toHaveBeenCalledTimes(1); // Called by removeFolder to get DB instance
    expect(dbRemoveHandle).toHaveBeenCalledWith(folderToRemove); // External DB function for removing handle

    // Check transaction for metadata store
    expect(mockDb.transaction).toHaveBeenCalledWith(['metadata'], 'readwrite');
    expect(mockMetadataObjectStore.getAll).toHaveBeenCalledTimes(1);

    // Check that 'put' was called for song1 and song2 with isRemoved: true
    expect(putSpy).toHaveBeenCalledWith({ ...song1, isRemoved: true });
    expect(putSpy).toHaveBeenCalledWith({ ...song2, isRemoved: true });

    // Check that 'put' was NOT called for song3 and song4 with isRemoved: true
    // Or more precisely, if it was called for them (e.g. an attempt to update all), their isRemoved status must not be true.
    // The current implementation iterates and only 'puts' if path matches.
    expect(putSpy).not.toHaveBeenCalledWith(expect.objectContaining({ id: song3.id, isRemoved: true }));
    expect(putSpy).not.toHaveBeenCalledWith(expect.objectContaining({ id: song4.id, isRemoved: true }));
    // Verify song3 and song4 were not modified if they were 'put'
    const song3Call = putSpy.mock.calls.find(call => call[0].id === song3.id);
    if (song3Call) expect(song3Call[0].isRemoved).toBe(false);
    const song4Call = putSpy.mock.calls.find(call => call[0].id === song4.id);
    if (song4Call) expect(song4Call[0].isRemoved).toBe(false);


    // 2. Store state updates
    const storeState = usePlayerStore.getState();
    expect(storeState.selectedFolderNames).toEqual([anotherFolder]);
    expect(storeState.triggerRefresh).toBeGreaterThan(initialRefreshTrigger);
    expect(storeState.triggerRefresh).toBe(1); // Since initial was 0 and it's incremented.
  });

  test('removeFolder for a non-existent folder name still updates state and calls removeHandle', async () => {
    // Arrange
    const existingFolder = "ExistingFolder";
    const nonExistentFolderToRemove = "NonExistentFolder";

    usePlayerStore.setState({
      selectedFolderNames: [existingFolder],
      triggerRefresh: 0,
    });

    const song1: MusicMetadata = { id: '1', filePath: `${existingFolder}/track1.mp3`, title: "Track 1", artist: "Artist", album: "Album", duration: 100, fileHandle: {} as any, isRemoved: false };
    mockMetadataObjectStore.getAll.mockResolvedValue([song1]); // Songs from other folders might exist
    const putSpy = mockMetadataObjectStore.put;
    const initialRefreshTrigger = usePlayerStore.getState().triggerRefresh;
    const initialSelectedFolders = [...usePlayerStore.getState().selectedFolderNames];

    // Act
    await usePlayerStore.getState().removeFolder(nonExistentFolderToRemove);

    // Assert
    // 1. DB interactions
    expect(initMusicDB).toHaveBeenCalledTimes(1);
    expect(dbRemoveHandle).toHaveBeenCalledWith(nonExistentFolderToRemove); // Attempt to remove handle still happens

    // Check transaction for metadata store - it will still try to iterate songs
    expect(mockDb.transaction).toHaveBeenCalledWith(['metadata'], 'readwrite');
    expect(mockMetadataObjectStore.getAll).toHaveBeenCalledTimes(1);

    // No songs should be marked as removed because no paths will match nonExistentFolderToRemove
    expect(putSpy).not.toHaveBeenCalledWith(expect.objectContaining({ isRemoved: true }));
    // Or, more specifically, ensure song1 was not 'put' with isRemoved: true
    expect(putSpy).not.toHaveBeenCalledWith({ ...song1, isRemoved: true });


    // 2. Store state updates
    const storeState = usePlayerStore.getState();
    // selectedFolderNames should remain unchanged as the non-existent folder wasn't in the list
    expect(storeState.selectedFolderNames).toEqual(initialSelectedFolders);
    expect(storeState.triggerRefresh).toBeGreaterThan(initialRefreshTrigger);
    expect(storeState.triggerRefresh).toBe(1);
  });
});
