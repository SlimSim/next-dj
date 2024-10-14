"use client";
// src/components/pwa/FilePicker.tsx

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  saveDirectoryHandle,
  getDirectoryHandle,
} from "@/utils/directoryHandleStorage";
import { getFilesFromIndexedDB } from "@/utils/fileBlobStorage";
import { getFilesFromOPFS } from "@/utils/loadFilesFromOPFS"; // Import OPFS logic
import FileInput from "./FileInput"; // Fallback component

interface FilePickerProps {
  onFilesSelected: (files: File[]) => void;
}

const FilePicker: React.FC<FilePickerProps> = ({ onFilesSelected }) => {
  const isFileSystemAPISupported = "showDirectoryPicker" in window;

  // Fetch stored files from IndexedDB and OPFS
  const fetchFilesFromStorage = async () => {
    const storedFiles = await getFilesFromIndexedDB(); // Get files from IndexedDB
    const opfsFiles = await getFilesFromOPFS(); // Get files from OPFS
    return [...storedFiles, ...opfsFiles]; // Merge IndexedDB and OPFS files
  };

  // Check for File System Access API support and fetch files
  useEffect(() => {
    const fetchStoredFiles = async () => {
      const storedFiles = await fetchFilesFromStorage();

      if (isFileSystemAPISupported) {
        const handle = await getDirectoryHandle();
        if (handle) {
          const directoryFiles = await getFilesFromDirectory(handle); // Fetch directory files
          onFilesSelected([...storedFiles, ...directoryFiles]); // Merge files from all sources
        } else {
          onFilesSelected(storedFiles); // Only IndexedDB + OPFS
        }
      } else {
        onFilesSelected(storedFiles); // Only IndexedDB + OPFS
      }
    };
    fetchStoredFiles();
  }, []);

  const getFilesFromDirectory = async (
    dirHandle: FileSystemDirectoryHandle
  ): Promise<File[]> => {
    const files: File[] = [];
    for await (const [, handle] of (dirHandle as any).entries()) {
      if (handle.kind === "file") {
        const file = await handle.getFile();
        if (file.type.startsWith("audio/") || file.type.startsWith("video/")) {
          files.push(file);
        }
      } else if (handle.kind === "directory") {
        // Recursively access files in subdirectories
        files.push(...(await getFilesFromDirectory(handle)));
      }
    }
    return files;
  };

  const handleFileSelection = async () => {
    try {
      if (isFileSystemAPISupported) {
        const dirHandle = await (window as any).showDirectoryPicker();

        // Request persistent access
        const permission = await dirHandle.requestPermission({ mode: "read" });
        if (permission === "granted") {
          saveDirectoryHandle(dirHandle); // Save handle to IndexedDB
          const directoryFiles = await getFilesFromDirectory(dirHandle); // Access files
          const storageFiles = await fetchFilesFromStorage(); // Include IndexedDB and OPFS
          onFilesSelected([...storageFiles, ...directoryFiles]); // Merge and update state
        }
      }
    } catch (error) {
      console.error("Error accessing files:", error);
    }
  };

  return isFileSystemAPISupported ? (
    <Button variant="outline" onClick={handleFileSelection}>
      Select Directory
    </Button>
  ) : (
    <FileInput onFilesSelected={onFilesSelected} /> // Fallback to FileInput component
  );
};

export default FilePicker;
