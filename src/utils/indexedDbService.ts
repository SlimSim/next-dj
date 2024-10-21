// src/utils/indexedDbService.ts
import { openDB } from "idb";
import {
  INDEXED_DB_NAME,
  INDEXED_DB_DIRECTORY_HANDLES_STORE_NAME,
  INDEXED_DB_FILE_BLOB_STORE_NAME,
} from "./constants";
import { CustomFile } from "@/types/fileTypes";

// Initialize or open the IndexedDB database
export const getDB = async () => {
  return openDB(INDEXED_DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(INDEXED_DB_FILE_BLOB_STORE_NAME)) {
        db.createObjectStore(INDEXED_DB_FILE_BLOB_STORE_NAME);
      }
      if (
        !db.objectStoreNames.contains(INDEXED_DB_DIRECTORY_HANDLES_STORE_NAME)
      ) {
        db.createObjectStore(INDEXED_DB_DIRECTORY_HANDLES_STORE_NAME);
      }
    },
  });
};

// Save files into IndexedDB, with metadata
export const saveFilesToIndexedDB = async (files: CustomFile[]) => {
  const db = await getDB();

  // Convert each file to an array buffer before starting the transaction
  const fileData = await Promise.all(
    files.map(async (file) => ({
      name: file.name,
      buffer: await file.arrayBuffer(),
      type: file.type,
      customProperties: {
        fileIsFrom: file.fileIsFrom,
        lastModified: file.lastModified,
        fileIsIn: "indexedDB",
        fileIsInFirebaseStorage: file.fileIsInFirebaseStorage,
        timesPlayed: file.timesPlayed || 0, // Include timesPlayed
      },
    }))
  );

  const tx = db.transaction(INDEXED_DB_FILE_BLOB_STORE_NAME, "readwrite");
  const store = tx.objectStore(INDEXED_DB_FILE_BLOB_STORE_NAME);

  for (const file of fileData) {
    store.put(file, file.name); // Save both buffer and metadata
  }

  await tx.done;
};

export const getFilesFromIndexedDB = async (): Promise<CustomFile[]> => {
  const db = await getDB();
  const tx = db.transaction(INDEXED_DB_FILE_BLOB_STORE_NAME, "readonly");
  const store = tx.objectStore(INDEXED_DB_FILE_BLOB_STORE_NAME);

  const allKeys = await store.getAllKeys();
  const files: CustomFile[] = [];

  for (const key of allKeys) {
    const storedFile = await store.get(key as IDBValidKey);
    if (storedFile) {
      const { buffer, type, customProperties } = storedFile;

      // Create a Blob from the buffer and generate a URL
      const blob = new Blob([buffer], { type });
      const fileUrl = URL.createObjectURL(blob); // Create a Blob URL

      // Create the CustomFile object
      const file = new File([blob], key as string, {
        type,
        lastModified: customProperties?.lastModified || Date.now(),
      }) as CustomFile;

      // Attach the custom properties and the Blob URL
      file.fileIsFrom = customProperties?.fileIsFrom;
      file.fileIsInFirebaseStorage = customProperties?.fileIsInFirebaseStorage;
      file.fileIsIn = "indexedDB";
      file.timesPlayed = customProperties?.timesPlayed || 0;

      // Store the Blob URL for later playback
      (file as any).fileUrl = fileUrl;

      files.push(file);
    }
  }

  return files;
};

// Update the metadata for a file in IndexedDB
export const updateFileMetadataInIndexedDB = async (file: CustomFile) => {
  const db = await getDB();
  const tx = db.transaction(INDEXED_DB_FILE_BLOB_STORE_NAME, "readwrite");
  const store = tx.objectStore(INDEXED_DB_FILE_BLOB_STORE_NAME);
  const storedFile = await store.get(file.name);
  if (storedFile) {
    // Ensure customProperties is defined
    storedFile.customProperties = storedFile.customProperties || {};
    storedFile.customProperties.timesPlayed = file.timesPlayed;
    await store.put(storedFile, file.name); // Update the record
  }

  await tx.done;
};

// Save a directory handle in IndexedDB
export const saveDirectoryHandle = async (
  handle: FileSystemDirectoryHandle
) => {
  const db = await getDB();
  await db.put(INDEXED_DB_DIRECTORY_HANDLES_STORE_NAME, handle, "directory");
};

// Get a saved directory handle from IndexedDB
export const getDirectoryHandle =
  async (): Promise<FileSystemDirectoryHandle | null> => {
    const db = await getDB();
    return await db.get(INDEXED_DB_DIRECTORY_HANDLES_STORE_NAME, "directory");
  };

// Get all file keys from IndexedDB
export const getIndexedDBFileKeys = async () => {
  const db = await getDB();
  const transaction = db.transaction(
    INDEXED_DB_FILE_BLOB_STORE_NAME,
    "readonly"
  );
  const store = transaction.objectStore(INDEXED_DB_FILE_BLOB_STORE_NAME);
  return store.getAllKeys();
};
