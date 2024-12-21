export const storeHandle = async (
    folderName: string,
    handle: FileSystemDirectoryHandle
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("next-dj", 1);
  
      request.onerror = () => reject(request.error);
  
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("handles")) {
          db.createObjectStore("handles");
        }
      };
  
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(["handles"], "readwrite");
        const store = transaction.objectStore("handles");
  
        const storeRequest = store.put(handle, folderName);
  
        storeRequest.onsuccess = () => resolve(undefined);
        storeRequest.onerror = () => reject(storeRequest.error);
      };
    });
  };
  
  export const clearHandles = (): void => {
    const request = indexedDB.open("next-dj", 1);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(["handles"], "readwrite");
      const store = transaction.objectStore("handles");
      store.clear();
    };
  };