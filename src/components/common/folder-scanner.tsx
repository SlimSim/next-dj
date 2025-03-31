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
      console.log(`Processing directory: ${dirHandle.name}, path: ${path}`);
      const entries = (dirHandle as any).values();
      let entryCount = 0;
      let fileCount = 0;
      let audioFileCount = 0;
      
      for await (const entry of entries) {
        entryCount++;
        if (isCancelled()) {
          console.log(`Processing cancelled for ${dirHandle.name}`);
          return existingFiles;
        }

        console.log(`Found entry: ${entry.name}, kind: ${entry.kind}`);
        
        if (entry.kind === "file") {
          fileCount++;
          const fileHandle = entry as FileSystemFileHandle;
          try {
            const file = await fileHandle.getFile();
            console.log(`Got file: ${file.name}, type: ${file.type}, size: ${file.size}`);

            if (isAudioFile(file)) {
              audioFileCount++;
              console.log(`Found audio file: ${file.name}`);
              // Include the folder name in the path
              const basePath = dirHandle.name;
              const newPath = path
                ? `${basePath}/${path}/${file.name}`
                : `${basePath}/${file.name}`;
              existingFiles.add(newPath);
              console.log(`Added path to existingFiles: ${newPath}`);
              
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
              console.log(`Adding audio file to database: ${newPath}`);
              await addAudioFile(fileHandle, metadata, true);
              console.log(`Successfully added audio file to database: ${newPath}`);
            } else {
              console.log(`Skipping non-audio file: ${file.name}, type: ${file.type}`);
            }
          } catch (error) {
            console.error(`Error accessing file ${entry.name}:`, error);
          }
        } else if (entry.kind === "directory") {
          console.log(`Found subdirectory: ${entry.name}`);
          const dirEntry = entry as FileSystemDirectoryHandle;
          const newPath = path ? `${path}/${entry.name}` : entry.name;
          console.log(`Recursing into subdirectory: ${newPath}`);
          await processDirectory(dirEntry, newPath, isCancelled, existingFiles);
        }
      }

      console.log(`Finished processing directory ${dirHandle.name}. Found ${entryCount} entries, ${fileCount} files, ${audioFileCount} audio files.`);

      // Only mark files as removed in the root call
      if (!path) {
        console.log(`Checking for removed files in ${dirHandle.name}`);
        // Mark files as removed if they are no longer in the directory
        const db = await initMusicDB();
        const tx = db.transaction("metadata", "readonly");
        const allFiles = await tx.store.getAll();
        const currentFolderPath = dirHandle.name;
        console.log(`Found ${allFiles.length} total files in database`);

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
                console.log(`Marking file as removed: ${file.path}`);
                await markFileAsRemoved(file.path);
                removedCount++;
              }
            }
          }
        }
        console.log(`Marked ${removedCount} files as removed`);
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
      console.log("Scan already in progress, skipping");
      return;
    }

    // Mark scan as in progress
    scanInProgressRef.current = true;

    console.log("Starting folder scan with folders:", selectedFolderNames);
    try {
      let foundAnyFiles = false;

      for (const folderName of selectedFolderNames) {
        if (isCancelledRef.current) {
          console.log("Scan cancelled");
          break;
        }

        try {
          console.log(`Attempting to get handle for folder: ${folderName}`);
          const handle = await getHandle(folderName);
          if (!handle) {
            console.log(`No handle found for folder: ${folderName}`);
            continue;
          }
          console.log(`Handle retrieved for folder: ${folderName}`);

          // Try to verify the folder still exists by attempting to read its contents
          try {
            // Try to get an iterator of the directory contents
            console.log(`Verifying access to folder: ${folderName}`);
            const entries = await (handle as any).values();
            // Try to get the first entry to verify we can actually access the directory
            await entries.next();
            console.log(`Successfully verified access to folder: ${folderName}`);
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
          console.log(`Permission status for ${folderName}: ${permissionStatus}`);
          if (permissionStatus === "granted") {
            console.log(`Processing directory: ${folderName}`);
            try {
              const existingFiles = await processDirectory(handle, "", () => isCancelledRef.current);
              console.log(`Processed directory: ${folderName}, found ${existingFiles.size} files`);

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
          } else {
            console.log(`Permission not granted for folder: ${folderName}`);
          }
        } catch (error) {
          console.error(`Error accessing folder ${folderName}:`, error);
          toast.error(`Failed to access folder: ${folderName}`);
        }
      }

      // Only update the UI if we found files and the scan wasn't cancelled
      if (foundAnyFiles && !isCancelledRef.current) {
        console.log("Found files during scan, updating UI");
        
        // Force a metadata refresh from the database
        const updatedMetadata = await getAllMetadata();
        console.log(`Found ${updatedMetadata.length} tracks in database after scan`);
        
        // Update the store's metadata directly
        const { setMetadata } = usePlayerStore.getState();
        if (typeof setMetadata === 'function') {
          setMetadata(updatedMetadata);
          console.log("Updated store metadata directly after scan");
        }
        
        // Trigger a single refresh to update the UI
        triggerRefresh();
      } else {
        console.log("No files found during scan or scan was cancelled");
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
        console.log("Running initial folder scan on mount");
        await scanFolders();
      } else {
        console.log("No folders selected, skipping initial scan");
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
      console.log("Folder list changed, running scan");
      
      // Update previous folder names immediately to prevent multiple scans
      previousFolderNamesRef.current = [...selectedFolderNames];
      
      // Run the scan once
      scanFolders();
    }
  }, [selectedFolderNames, scanFolders]);

  useEffect(() => {
    // Only run this effect once on mount
    const checkAndScanDirectories = async () => {
      console.log("FolderScanner: Initial mount check");

      // Wait a moment for the store to be fully hydrated
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Check if we have any tracks in the store
      const currentMetadata = usePlayerStore.getState().metadata;
      console.log(`FolderScanner: Found ${currentMetadata.length} tracks in store`);

      // If we have no tracks but we have selected folders, force a scan
      if (currentMetadata.length === 0) {
        const currentFolders = usePlayerStore.getState().selectedFolderNames;
        console.log(`FolderScanner: Found ${currentFolders.length} selected folders`);

        if (currentFolders.length > 0) {
          console.log("FolderScanner: No tracks but folders exist, forcing directory scan");

          // Force a scan of all directories
          for (const folderName of currentFolders) {
            try {
              const handle = await getHandle(folderName);
              if (handle) {
                console.log(`FolderScanner: Forcing scan of directory: ${folderName}`);

                // Request permission explicitly
                const permissionStatus = await handle.requestPermission({ mode: "read" });
                console.log(`FolderScanner: Permission status for ${folderName}: ${permissionStatus}`);

                if (permissionStatus === "granted") {
                  // If permission was granted, process the directory with a new isCancelled reference
                  const isCancelledRef = { current: false };
                  await processDirectory(handle, "", () => isCancelledRef.current);
                  console.log(`FolderScanner: Completed forced scan of ${folderName}`);

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
          console.log(`FolderScanner: After forced scan, found ${updatedMetadata.length} tracks`);

          if (updatedMetadata.length === 0) {
            console.log("FolderScanner: Still no tracks after scan, showing toast message");
            toast.error("No music files found in selected directories. Try removing and re-adding the directories.");
          }
        }
      }
    };

    checkAndScanDirectories();
  }, []);

  return null;
}
