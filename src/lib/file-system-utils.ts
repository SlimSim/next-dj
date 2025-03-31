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
    const newPermission = await handle.requestPermission({ mode: "read" });
    
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
