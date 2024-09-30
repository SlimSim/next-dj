// src/utils/fileStorage.ts
import { openDB } from 'idb';

const DB_NAME = 'music-player-db';
const STORE_NAME = 'file-handles';

// Create or open the IndexedDB database and ensure the object store is created
const getDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      // Log for debugging the upgrade process
      console.log('Upgrading DB or creating new DB...');
      // Ensure the object store is created if it does not already exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
        console.log(`Created object store: ${STORE_NAME}`);
      }
    },
  });
};

export const saveDirectoryHandle = async (handle: FileSystemDirectoryHandle) => {
  const db = await getDB();
  await db.put(STORE_NAME, handle, 'directory');
};

export const getDirectoryHandle = async (): Promise<FileSystemDirectoryHandle | null> => {
  const db = await getDB();
  return await db.get(STORE_NAME, 'directory');
};
