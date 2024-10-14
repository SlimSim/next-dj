// src/utils/database.ts
import { openDB } from "idb";
import {
  INDEXED_DB_NAME,
  INDEXED_DB_DIRECTORY_HANDLES_STORE_NAME,
  INDEXED_DB_FILE_BLOB_STORE_NAME,
} from "./constants";

export const getDB = async () => {
  return openDB(INDEXED_DB_NAME, 1, {
    upgrade(db) {
      // Ensure both object stores are created when the database is initialized
      if (!db.objectStoreNames.contains(INDEXED_DB_FILE_BLOB_STORE_NAME)) {
        db.createObjectStore(INDEXED_DB_FILE_BLOB_STORE_NAME);
        console.log(`Created object store: ${INDEXED_DB_FILE_BLOB_STORE_NAME}`);
      }
      if (
        !db.objectStoreNames.contains(INDEXED_DB_DIRECTORY_HANDLES_STORE_NAME)
      ) {
        db.createObjectStore(INDEXED_DB_DIRECTORY_HANDLES_STORE_NAME);
        console.log(
          `Created object store: ${INDEXED_DB_DIRECTORY_HANDLES_STORE_NAME}`
        );
      }
    },
  });
};

export const getIndexedDBFileKeys = async () => {
  const db = await getDB();
  const transaction = db.transaction(
    INDEXED_DB_FILE_BLOB_STORE_NAME,
    "readonly"
  );
  const store = transaction.objectStore(INDEXED_DB_FILE_BLOB_STORE_NAME);
  return store.getAllKeys(); // Returns all file keys
};

export const saveFilesToIndexedDB = async (files: File[]) => {
  const db = await getDB();

  // Convert each file to an array buffer before starting the transaction
  const fileBuffers = await Promise.all(
    files.map(async (file) => ({
      name: file.name,
      buffer: await file.arrayBuffer(),
    }))
  );

  // Begin transaction after gathering all file buffers
  const tx = db.transaction(INDEXED_DB_FILE_BLOB_STORE_NAME, "readwrite");
  const store = tx.objectStore(INDEXED_DB_FILE_BLOB_STORE_NAME);

  for (const file of fileBuffers) {
    store.put(file.buffer, file.name);
  }

  await tx.done; // Ensure the transaction completes
};

export const getFilesFromIndexedDB = async (): Promise<File[]> => {
  const db = await getDB();
  const tx = db.transaction(INDEXED_DB_FILE_BLOB_STORE_NAME, "readonly");
  const store = tx.objectStore(INDEXED_DB_FILE_BLOB_STORE_NAME);

  const allKeys = await store.getAllKeys();
  const files: File[] = [];

  // Retrieve files and convert back to File objects
  for (const key of allKeys) {
    const buffer = await store.get(key as IDBValidKey);
    if (buffer) {
      const blob = new Blob([buffer]); // Create blob from array buffer
      const file = new File([blob], key as string);
      files.push(file);
    }
  }

  return files;
};

export const saveDirectoryHandle = async (
  handle: FileSystemDirectoryHandle
) => {
  const db = await getDB();
  await db.put(INDEXED_DB_DIRECTORY_HANDLES_STORE_NAME, handle, "directory");
};

export const getDirectoryHandle =
  async (): Promise<FileSystemDirectoryHandle | null> => {
    const db = await getDB();
    return await db.get(INDEXED_DB_DIRECTORY_HANDLES_STORE_NAME, "directory");
  };
