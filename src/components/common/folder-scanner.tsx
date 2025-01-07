"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { usePlayerStore } from "@/lib/store";
import { addAudioFile } from "@/db/audio-operations";
import { markFileAsRemoved } from "@/db/metadata-operations";
import { initMusicDB } from "@/db/schema";
import { isAudioFile } from "@/features/audio/utils/file-utils";

// TODO: flytta dessa handle-funktioner till handle-operations.ts???

// Helper function to get handle from IndexedDB

export const getHandle = async (
  folderName: string
): Promise<FileSystemDirectoryHandle | null> => {
  const db = await initMusicDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["handles"], "readonly");
    const store = transaction.objectStore("handles");
    const getRequest = store.get(folderName);
    console.log("slim sim here is the important code!");
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

export function FolderScanner() {
  const triggerRefresh = usePlayerStore((state) => state.triggerRefresh);
  const selectedFolderNames = usePlayerStore(
    (state) => state.selectedFolderNames
  );

  const processDirectory = async (
    dirHandle: FileSystemDirectoryHandle,
    path = "",
    isCancelled: () => boolean
  ) => {
    try {
      const entries = (dirHandle as any).values();
      const existingFiles = new Set<string>();
      for await (const entry of entries) {
        if (isCancelled()) {
          return;
        }

        if (entry.kind === "file") {
          const fileHandle = entry as FileSystemFileHandle;
          const file = await fileHandle.getFile();

          if (isAudioFile(file)) {
            const newPath = path ? `${path}/${file.name}` : file.name;
            existingFiles.add(newPath);
            const metadata = {
              title: file.name.replace(/\.[^/.]+$/, ""),
              artist: path ? path.split("/")[0] : "Unknown Artist",
              album: path
                ? path.split("/")[1] || "Unknown Album"
                : "Unknown Album",
              duration: 0,
              playCount: 0,
              path: newPath,
            };
            await addAudioFile(fileHandle, metadata, true);
          }
        } else if (entry.kind === "directory") {
          const dirEntry = entry as FileSystemDirectoryHandle;
          const newPath = path ? `${path}/${entry.name}` : entry.name;
          await processDirectory(dirEntry, newPath, isCancelled);
        }
      }

      // Mark files as removed if they are no longer in the directory
      const db = await initMusicDB();
      const tx = db.transaction("metadata", "readonly");
      const allFiles = await tx.store.getAll();
      for (const file of allFiles) {
        if (file.path && !existingFiles.has(file.path)) {
          await markFileAsRemoved(file.path);
        }
      }
    } catch (error) {
      console.error("Error processing directory:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (selectedFolderNames.length === 0) {
      return;
    }

    let isCancelled = false;

    const scanFolders = async () => {
      try {
        for (const folderName of selectedFolderNames) {
          if (isCancelled) {
            return;
          }

          try {
            const handle = await getHandle(folderName);
            if (!handle) {
              continue;
            }

            const permissionStatus = await (handle as any).queryPermission({
              mode: "read",
            });
            if (permissionStatus === "granted") {
              await processDirectory(handle, "", () => isCancelled);
            }
          } catch (error) {
            console.error(`Error accessing folder ${folderName}:`, error);
            toast.error(`Failed to access folder: ${folderName}`);
          }
        }
        if (!isCancelled) {
          triggerRefresh();
        }
      } catch (error) {
        console.error("Error scanning folders:", error);
        toast.error("Failed to scan folders");
      }
    };

    // Run the scan on mount
    scanFolders();

    // Cleanup function to cancel any in-progress scan
    return () => {
      isCancelled = true;
    };
  }, [selectedFolderNames, triggerRefresh]);

  return null;
}
