// src/utils/database.ts
import { openDB } from "idb";
import {
  DB_NAME,
  DIRECTORY_HANDLES_STORE_NAME,
  FILE_BLOB_STORE_NAME,
} from "./constants";

export const getDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      // Ensure both object stores are created when the database is initialized
      if (!db.objectStoreNames.contains(FILE_BLOB_STORE_NAME)) {
        db.createObjectStore(FILE_BLOB_STORE_NAME);
        console.log(`Created object store: ${FILE_BLOB_STORE_NAME}`);
      }
      if (!db.objectStoreNames.contains(DIRECTORY_HANDLES_STORE_NAME)) {
        db.createObjectStore(DIRECTORY_HANDLES_STORE_NAME);
        console.log(`Created object store: ${DIRECTORY_HANDLES_STORE_NAME}`);
      }
    },
  });
};

export const indexedDBFileKeys = async () => {
  const db = await getDB();
  const transaction = db.transaction(FILE_BLOB_STORE_NAME, "readonly");
  const store = transaction.objectStore(FILE_BLOB_STORE_NAME);
  return store.getAllKeys(); // Returns all file keys
};
