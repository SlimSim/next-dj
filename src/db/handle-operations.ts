import { initMusicDB } from "./schema";

export async function storeHandle(
  folderName: string,
  handle: FileSystemDirectoryHandle
): Promise<void> {
  const db = await initMusicDB();
  const tx = db.transaction("handles", "readwrite");
  const store = tx.objectStore("handles");
  await store.put(handle, folderName);
}

export async function clearHandles(): Promise<void> {
  const db = await initMusicDB();
  const tx = db.transaction("handles", "readwrite");
  const store = tx.objectStore("handles");
  await store.clear();
}

export async function removeHandle(folderName: string): Promise<void> {
  const db = await initMusicDB();
  const tx = db.transaction("handles", "readwrite");
  const store = tx.objectStore("handles");
  await store.delete(folderName);
}

export const getHandle = async (
  folderName: string
): Promise<FileSystemDirectoryHandle | null> => {
  const db = await initMusicDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["handles"], "readonly");
    const store = transaction.objectStore("handles");
    const getRequest = store.get(folderName);
    getRequest
      .then((directoryHandle) => {
        if (directoryHandle) {
          resolve(directoryHandle);
        } else {
          resolve(null);
        }
      })
      .catch((error) => {
        console.error("Error getting directory handle:", error);
        reject(error);
      });
  });
};
