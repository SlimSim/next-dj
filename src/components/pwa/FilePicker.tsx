"use client";
// src/components/pwa/FilePicker.tsx

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  saveDirectoryHandle,
  getDirectoryHandle,
} from "@/utils/directoryHandleStorage";
import FileInput from "./FileInput"; // Import the fallback file input component

interface FilePickerProps {
  onFilesSelected: (files: File[]) => void;
}

const FilePicker: React.FC<FilePickerProps> = ({ onFilesSelected }) => {
  const isFileSystemAPISupported = "showDirectoryPicker" in window;

  // Check for File System Access API support
  useEffect(() => {
    const fetchStoredDirectory = async () => {
      if (isFileSystemAPISupported) {
        const handle = await getDirectoryHandle();
        if (handle) {
          await accessFilesFromDirectory(handle);
        }
      }
    };
    fetchStoredDirectory();
  }, []);

  const getFilesFromDirectory = async (
    dirHandle: FileSystemDirectoryHandle
  ) => {
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

  const accessFilesFromDirectory = async (
    dirHandle: FileSystemDirectoryHandle
  ) => {
    const files: File[] = await getFilesFromDirectory(dirHandle);
    onFilesSelected(files);
  };

  const handleFileSelection = async () => {
    try {
      if (isFileSystemAPISupported) {
        const dirHandle = await (window as any).showDirectoryPicker();

        // Request persistent access
        const permission = await dirHandle.requestPermission({ mode: "read" });
        if (permission === "granted") {
          saveDirectoryHandle(dirHandle); // Save handle to IndexedDB
          await accessFilesFromDirectory(dirHandle); // Access files
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
