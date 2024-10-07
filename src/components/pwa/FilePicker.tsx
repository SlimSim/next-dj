"use client";
// src/components/pwa/FilePicker.tsx

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  saveDirectoryHandle,
  getDirectoryHandle,
} from "@/utils/directoryHandleStorage";
import { getFilesFromIndexedDB } from "@/utils/fileBlobStorage"; // Corrected to use getFilesFromIndexedDB
import FileInput from "./FileInput"; // Import the fallback file input component

interface FilePickerProps {
  onFilesSelected: (files: File[]) => void;
}

const FilePicker: React.FC<FilePickerProps> = ({ onFilesSelected }) => {
  const isFileSystemAPISupported = "showDirectoryPicker" in window;

  // Fetch stored files from IndexedDB
  const fetchFilesFromIndexedDB = async () => {
    const storedFiles = await getFilesFromIndexedDB(); // Get all files from IndexedDB
    return storedFiles;
  };

  // Check for File System Access API support
  useEffect(() => {
    const fetchStoredDirectory = async () => {
      const storedFiles = await fetchFilesFromIndexedDB();

      if (isFileSystemAPISupported) {
        const handle = await getDirectoryHandle();
        if (handle) {
          const directoryFiles = await getFilesFromDirectory(handle); // Fetch files from directory
          onFilesSelected([...storedFiles, ...directoryFiles]); // Merge files from both sources
        } else {
          onFilesSelected(storedFiles); // Only from IndexedDB
        }
      } else {
        onFilesSelected(storedFiles); // Only from IndexedDB
      }
    };
    fetchStoredDirectory();
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
          onFilesSelected(directoryFiles); // Send files to the parent component
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
