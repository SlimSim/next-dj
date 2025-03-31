"use client";

import { useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { usePlayerStore } from "@/lib/store";
import { addAudioFile, getAllMetadata } from "@/db/audio-operations";
import { markFileAsRemoved } from "@/db/metadata-operations";
import { initMusicDB } from "@/db/schema";
import { isAudioFile } from "@/features/audio/utils/file-utils";
import { getHandle, removeHandle } from "@/db/handle-operations";

// TODO: flytta dessa handle-funktioner till handle-operations.ts???
export function FolderScanner() {
  const triggerRefresh = usePlayerStore((state) => state.triggerRefresh);
  const selectedFolderNames = usePlayerStore(
    (state) => state.selectedFolderNames
  );
  const refreshTrigger = usePlayerStore((state) => state.refreshTrigger);
  const metadata = usePlayerStore((state) => state.metadata);

  const processDirectory = async (
    dirHandle: FileSystemDirectoryHandle,
    path = "",
    isCancelled: () => boolean,
    existingFiles = new Set<string>()
  ) => {
    try {
      const entries = (dirHandle as any).values();
      let entryCount = 0;
      let fileCount = 0;
      let audioFileCount = 0;
      
      for await (const entry of entries) {
        entryCount++;
        if (isCancelled()) {
          return existingFiles;
        }
        
        if (entry.kind === "file") {
          fileCount++;
          const fileHandle = entry as FileSystemFileHandle;
          try {
            const file = await fileHandle.getFile();
            if (isAudioFile(file)) {
              audioFileCount++;
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
          } catch (error) {
            console.error(`Error accessing file ${entry.name}:`, error);
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

        let removedCount = 0;
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
                removedCount++;
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

  // Track if initial scan has been completed
  const initialScanCompletedRef = useRef<boolean>(false);
  // Track if a scan is currently in progress
  const scanInProgressRef = useRef<boolean>(false);
  // Track the previously scanned folder names to detect actual changes
  const previousFolderNamesRef = useRef<string[]>([]);

  // Define scanFolders with useCallback so it can be used in dependency arrays
  const scanFolders = useCallback(async (isCancelledRef = { current: false }) => {
    // Skip if a scan is already in progress
    if (scanInProgressRef.current) {
      return;
    }

    // Mark scan as in progress
    scanInProgressRef.current = true;

    try {
      let foundAnyFiles = false;

      for (const folderName of selectedFolderNames) {
        if (isCancelledRef.current) {
          break;
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
            try {
              const existingFiles = await processDirectory(handle, "", () => isCancelledRef.current);
              if (existingFiles.size > 0) {
                foundAnyFiles = true;
              }
            } catch (error: any) {
              if (error.name === 'QuotaExceededError') {
                console.error(`Storage quota exceeded when processing ${folderName}. Using reference mode only.`);
                toast.error(`Storage quota exceeded. Some files may not be fully loaded.`);
                // Continue processing - the error is handled, and some files may have been added
                foundAnyFiles = true;
              } else {
                throw error;
              }
            }
          }
        } catch (error) {
          console.error(`Error accessing folder ${folderName}:`, error);
          toast.error(`Failed to access folder: ${folderName}`);
        }
      }

      // Only update the UI if we found files and the scan wasn't cancelled
      if (foundAnyFiles && !isCancelledRef.current) {
        // Force a metadata refresh from the database
        const updatedMetadata = await getAllMetadata();
        
        // Update the store's metadata directly
        const { setMetadata } = usePlayerStore.getState();
        if (typeof setMetadata === 'function') {
          setMetadata(updatedMetadata);
        }
        
        // Trigger a single refresh to update the UI
        triggerRefresh();
      }

      // Mark initial scan as completed
      initialScanCompletedRef.current = true;
    } catch (error) {
      console.error("Error scanning folders:", error);
      toast.error("Failed to scan folders");
    } finally {
      // Mark scan as no longer in progress
      scanInProgressRef.current = false;
      // Update the previous folder names reference
      previousFolderNamesRef.current = [...selectedFolderNames];
    }
  }, [selectedFolderNames, triggerRefresh]);

  // Run initial scan only once when component mounts
  useEffect(() => {
    if (initialScanCompletedRef.current) {
      return; // Skip if initial scan already completed
    }

    const initialScan = async () => {
      if (selectedFolderNames.length > 0) {
        await scanFolders();
      } else {
        // Mark initial scan as completed even if no folders are selected
        initialScanCompletedRef.current = true;
      }
    };

    initialScan();
  }, [scanFolders, selectedFolderNames]);

  // Run scan ONLY when folder names change due to user action
  useEffect(() => {
    // Skip if this is the initial render or if no folders are selected
    if (!initialScanCompletedRef.current || selectedFolderNames.length === 0) {
      return;
    }

    // Check if the folder list has actually changed
    const prevFolders = previousFolderNamesRef.current;
    const currentFolders = selectedFolderNames;

    // Only run scan if the folder list has changed
    if (
      prevFolders.length !== currentFolders.length ||
      !prevFolders.every((folder) => currentFolders.includes(folder))
    ) {
      // Update previous folder names immediately to prevent multiple scans
      previousFolderNamesRef.current = [...selectedFolderNames];
      
      // Run the scan once
      scanFolders();
    }
  }, [selectedFolderNames, scanFolders]);

  useEffect(() => {
    // Only run this effect once on mount
    const checkAndScanDirectories = async () => {
      // Wait a moment for the store to be fully hydrated
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Check if we have any tracks in the store
      const currentMetadata = usePlayerStore.getState().metadata;

      // If we have no tracks but we have selected folders, force a scan
      if (currentMetadata.length === 0) {
        const currentFolders = usePlayerStore.getState().selectedFolderNames;

        if (currentFolders.length > 0) {
          // Force a scan of all directories
          for (const folderName of currentFolders) {
            try {
              const handle = await getHandle(folderName);
              if (handle) {
                // Request permission explicitly
                const permissionStatus = await handle.requestPermission({ mode: "read" });

                if (permissionStatus === "granted") {
                  // If permission was granted, process the directory with a new isCancelled reference
                  const isCancelledRef = { current: false };
                  await processDirectory(handle, "", () => isCancelledRef.current);

                  // Trigger a refresh to update the UI
                  usePlayerStore.getState().triggerRefresh();
                }
              }
            } catch (error) {
              console.error(`FolderScanner: Error during forced scan of ${folderName}:`, error);
            }
          }

          // Check if we found any tracks after scanning
          await new Promise((resolve) => setTimeout(resolve, 500));
          const updatedMetadata = await getAllMetadata();

          if (updatedMetadata.length === 0) {
            toast.error("No music files found in selected directories. Try removing and re-adding the directories.");
          }
        }
      }
    };

    checkAndScanDirectories();
  }, []);

  return null;
}
