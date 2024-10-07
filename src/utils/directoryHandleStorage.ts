// src/utils/directoryHandleStorage.ts
import { getDB } from "./database";
import { DIRECTORY_HANDLES_STORE_NAME } from "./constants";

export const saveDirectoryHandle = async (
  handle: FileSystemDirectoryHandle
) => {
  const db = await getDB();
  await db.put(DIRECTORY_HANDLES_STORE_NAME, handle, "directory");
};

export const getDirectoryHandle =
  async (): Promise<FileSystemDirectoryHandle | null> => {
    const db = await getDB();
    return await db.get(DIRECTORY_HANDLES_STORE_NAME, "directory");
  };
