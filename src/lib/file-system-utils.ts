import { initMusicDB } from "@/db/schema";
import { toast } from "sonner";

// Extend the FileSystemDirectoryHandle type to include the permission methods
declare global {
  interface FileSystemDirectoryHandle {
    queryPermission: (descriptor: { mode: 'read' | 'readwrite' }) => Promise<PermissionState>;
    requestPermission: (descriptor: { mode: 'read' | 'readwrite' }) => Promise<PermissionState>;
    values: () => AsyncIterableIterator<FileSystemHandle>;
    keys: () => AsyncIterableIterator<string>;
    entries: () => AsyncIterableIterator<[string, FileSystemHandle]>;
    getDirectoryHandle: (name: string, options?: { create?: boolean }) => Promise<FileSystemDirectoryHandle>;
    getFileHandle: (name: string, options?: { create?: boolean }) => Promise<FileSystemFileHandle>;
  }
}

/**
 * Checks if the browser is in incognito/private browsing mode
 * This is not 100% reliable but can help detect many incognito scenarios
 */
export async function isIncognitoMode(): Promise<boolean> {
  try {
    // Try to use IndexedDB as a test
    const testDb = await new Promise<boolean>((resolve) => {
      const dbTest = indexedDB.open('test-private-mode');
      dbTest.onerror = () => resolve(true); // Error likely means incognito
      dbTest.onsuccess = () => {
        // Clean up the test database
        indexedDB.deleteDatabase('test-private-mode');
        resolve(false);
      };
    });
    
    if (testDb) {
      fileSystemLog("Detected incognito/private browsing mode");
      return true;
    }
    
    // Additional check: storage quota
    if (navigator.storage && navigator.storage.estimate) {
      const { quota } = await navigator.storage.estimate();
      // Incognito mode typically has a much lower quota (often around 120MB)
      const isLowQuota = quota !== undefined && quota < 120 * 1024 * 1024;
      if (isLowQuota) {
        fileSystemLog(`Detected low storage quota (${Math.round(quota / (1024 * 1024))}MB), likely incognito mode`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error detecting incognito mode:", error);
    return false;
  }
}

/**
 * Checks and logs the permission status for all directory handles stored in the app.
 * This function retrieves all directory handles from IndexedDB and queries their permission status.
 */
export async function checkAndLogFileSystemPermissions(): Promise<void> {
  fileSystemLog("=== Next DJ File System Permissions ===");
  
  try {
    // Check if File System Access API is available
    if (typeof window === 'undefined' || !('showDirectoryPicker' in window)) {
      fileSystemLog("File System Access API is not available in this browser");
      return;
    }
    
    // Check if in incognito mode
    const incognito = await isIncognitoMode();
    if (incognito) {
      fileSystemLog("Running in incognito/private browsing mode - permissions may be limited");
    }
    
    // Get all stored directory handles from IndexedDB
    const db = await initMusicDB();
    const tx = db.transaction("handles", "readonly");
    const store = tx.objectStore("handles");
    const allHandles = await store.getAll();
    const allKeys = await store.getAllKeys();
    
    if (allHandles.length === 0) {
      fileSystemLog("No directory handles stored");
      return;
    }
    
    fileSystemLog(`Found ${allHandles.length} stored directory handles`);
    
    // Check permission status for each handle
    for (let i = 0; i < allHandles.length; i++) {
      const folderName = allKeys[i] as string;
      const handle = allHandles[i] as FileSystemDirectoryHandle;
      
      try {
        // Query the permission status
        const permissionStatus = await handle.queryPermission({ mode: "read" });
        fileSystemLog(`${folderName}: Permission status - ${permissionStatus}`);
        
        // Additional information about the directory
        fileSystemLog(`  - Name: ${handle.name}`);
        fileSystemLog(`  - Kind: ${handle.kind}`);
        
        // Test if we can actually read from the directory
        try {
          const entries = await handle.values();
          const firstEntry = await entries.next();
          if (!firstEntry.done) {
            fileSystemLog(`  - Successfully verified access to directory contents`);
          }
        } catch (error) {
          fileSystemLog(`  - Cannot access directory contents despite permission status: ${permissionStatus}`);
          console.error(`Error accessing directory contents for ${folderName}:`, error);
        }
      } catch (error) {
        console.error(`Error checking permission for ${folderName}:`, error);
        fileSystemLog(`  - Error checking permission: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } catch (error) {
    console.error("Error checking file system permissions:", error);
    fileSystemLog(`Error checking permissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Requests permission for a specific directory handle.
 * @param handle The directory handle to request permission for
 * @returns A promise that resolves to the permission status
 */
export async function requestPermission(handle: FileSystemDirectoryHandle): Promise<PermissionState> {
  try {
    // First check current permission
    const currentPermission = await handle.queryPermission({ mode: "read" });
    
    // If already granted, no need to request again
    if (currentPermission === "granted") {
      return currentPermission;
    }
    
    // Request permission
    fileSystemLog(`Requesting permission for directory: ${handle.name}`);
    const newPermission = await handle.requestPermission({ mode: "read" });
    fileSystemLog(`New permission status for ${handle.name}: ${newPermission}`);
    
    // Notify user about permission status
    if (newPermission === "granted") {
      toast.success(`Access granted to folder: ${handle.name}`);
    } else {
      toast.error(`Permission denied for folder: ${handle.name}`);
    }
    
    return newPermission;
  } catch (error) {
    console.error("Error requesting permission:", error);
    toast.error(`Failed to request permission: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return "denied";
  }
}

function fileSystemLog(message: string) {
  console.info( "[File System] " + message);
}