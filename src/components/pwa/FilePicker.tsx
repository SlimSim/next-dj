"use client";
// src/components/pwa/FilePicker.tsx

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getDirectoryHandle } from "@/utils/indexedDbService";
import { saveDirectoryHandle } from "@/utils/indexedDbService";
import { getFilesFromIndexedDB } from "@/utils/indexedDbService";
import FileInput from "./FileInput"; // Fallback component

interface FilePickerProps {
  onFilesSelected: (files: File[]) => void;
}

const FilePicker: React.FC<FilePickerProps> = ({ onFilesSelected }) => {
  const [isFileSystemAPISupported, setIsFileSystemAPISupported] =
    useState(false);
  const [loading, setLoading] = useState(true); // Loading state for SSR and initial checks

  useEffect(() => {
    const isClient = typeof window !== "undefined";
    setIsFileSystemAPISupported(isClient && "showDirectoryPicker" in window);
    setLoading(false); // Check complete
  }, []);

  useEffect(() => {
    const fetchStoredFiles = async () => {
      const storedFiles = await getFilesFromIndexedDB();
      const directoryFiles: File[] = [];

      if (isFileSystemAPISupported) {
        const handle = await getDirectoryHandle();
        if (handle) {
          directoryFiles.push(...(await getFilesFromDirectory(handle)));
        }
      }
      onFilesSelected([...storedFiles, ...directoryFiles]); // Merge files from all sources
    };

    if (!loading) {
      fetchStoredFiles();
    }
  }, [isFileSystemAPISupported, loading]);

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
          const storageFiles = await getFilesFromIndexedDB();
          onFilesSelected([...storageFiles, ...directoryFiles]); // Merge and update state
        }
      }
    } catch (error) {
      console.error("Error accessing files:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>; // Placeholder during API check
  }

  return isFileSystemAPISupported ? (
    <Button variant="outline" onClick={handleFileSelection}>
      Select Directory
    </Button>
  ) : (
    <FileInput onFilesSelected={onFilesSelected} /> // Fallback to FileInput component
  );
};

export default FilePicker;
