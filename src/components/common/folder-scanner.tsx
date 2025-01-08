"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { usePlayerStore } from "@/lib/store";
import { addAudioFile } from "@/db/audio-operations";
import { markFileAsRemoved } from "@/db/metadata-operations";
import { initMusicDB } from "@/db/schema";
import { isAudioFile } from "@/features/audio/utils/file-utils";
import { getHandle, removeHandle } from "@/db/handle-operations";

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
    isCancelled: () => boolean,
    existingFiles = new Set<string>()
  ) => {
    try {
      const entries = (dirHandle as any).values();
      for await (const entry of entries) {
        if (isCancelled()) {
          return existingFiles;
        }

        if (entry.kind === "file") {
          const fileHandle = entry as FileSystemFileHandle;
          const file = await fileHandle.getFile();

          if (isAudioFile(file)) {
            // Include the folder name in the path
            const basePath = dirHandle.name;
            const newPath = path
              ? `${basePath}/${path}/${file.name}`
              : `${basePath}/${file.name}`;
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
          await processDirectory(dirEntry, newPath, isCancelled, existingFiles);
        }
      }

      // Only mark files as removed in the root call
      if (!path) {
        // Mark files as removed if they are no longer in the directory
        const db = await initMusicDB();
        const tx = db.transaction("metadata", "readonly");
        const allFiles = await tx.store.getAll();
        const currentFolderPath = dirHandle.name;

        for (const file of allFiles) {
          if (file.path) {
            // Only check files that belong to the current folder
            const normalizedPath = file.path.replace(/\\/g, "/");
            const normalizedFolder = currentFolderPath.replace(/\\/g, "/");

            if (
              normalizedPath.startsWith(normalizedFolder + "/") ||
              normalizedPath === normalizedFolder
            ) {
              if (!existingFiles.has(file.path)) {
                await markFileAsRemoved(file.path);
              }
            }
          }
        }
      }

      return existingFiles;
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

            // Try to verify the folder still exists by attempting to read its contents
            try {
              // Try to get an iterator of the directory contents
              const entries = await (handle as any).values();
              // Try to get the first entry to verify we can actually access the directory
              await entries.next();
            } catch (error) {
              console.error("scanFolders: Catch error:", error);
              toast.error(
                `Folder "${folderName}" no longer exists or was renamed`
              );

              // Remove the handle from the database
              await removeHandle(folderName);

              // Mark all files from this folder and its subfolders as removed
              const db = await initMusicDB();
              const tx = db.transaction("metadata", "readwrite");
              const store = tx.objectStore("metadata");

              // Get all files in the database
              let cursor = await store.openCursor();
              let processedFiles = 0;
              let markedAsRemoved = 0;

              while (cursor) {
                const metadata = cursor.value;
                processedFiles++;

                if (metadata.path) {
                  // Normalize the paths to handle spaces and different separators
                  const normalizedPath = metadata.path.replace(/\\/g, "/");
                  const normalizedFolder = folderName.replace(/\\/g, "/");

                  // Check if the normalized path starts with the normalized folder name
                  if (
                    normalizedPath.startsWith(normalizedFolder + "/") ||
                    normalizedPath === normalizedFolder
                  ) {
                    metadata.removed = true;
                    await store.put(metadata);
                    markedAsRemoved++;
                  }
                }
                cursor = await cursor.continue();
              }

              // Update the selected folders list by filtering out the invalid folder
              const state = usePlayerStore.getState();
              usePlayerStore.setState({
                selectedFolderNames: state.selectedFolderNames.filter(
                  (name) => name !== folderName
                ),
              });
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
