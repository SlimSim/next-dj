// src/utils/fileBlobStorage.ts
import { FILE_BLOB_STORE_NAME } from "./constants";
import { getDB } from "./database";

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
  const tx = db.transaction(FILE_BLOB_STORE_NAME, "readwrite");
  const store = tx.objectStore(FILE_BLOB_STORE_NAME);

  for (const file of fileBuffers) {
    store.put(file.buffer, file.name);
  }

  await tx.done; // Ensure the transaction completes
};

export const getFilesFromIndexedDB = async (): Promise<File[]> => {
  const db = await getDB();
  const tx = db.transaction(FILE_BLOB_STORE_NAME, "readonly");
  const store = tx.objectStore(FILE_BLOB_STORE_NAME);

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
