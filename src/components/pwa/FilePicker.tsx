// src/components/pwa/FilePicker.tsx
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { saveDirectoryHandle, getDirectoryHandle } from "@/utils/fileStorage";

interface FilePickerProps {
  onFilesSelected: (files: File[]) => void;
}

const FilePicker: React.FC<FilePickerProps> = ({ onFilesSelected }) => {
  const [directoryHandle, setDirectoryHandle] =
    useState<FileSystemDirectoryHandle | null>(null);

  // Try to load stored directory handle on mount
  useEffect(() => {
    const fetchStoredDirectory = async () => {
      const handle = await getDirectoryHandle();
      if (handle) {
        setDirectoryHandle(handle);
        await accessFilesFromDirectory(handle);
      }
    };
    fetchStoredDirectory();
  }, []);

  const accessFilesFromDirectory = async (
    dirHandle: FileSystemDirectoryHandle
  ) => {
    const files: File[] = [];
    for await (const [, handle] of dirHandle) {
      if (handle.kind === "file") {
        const file = await handle.getFile();
        if (file.type.startsWith("audio/") || file.type.startsWith("video/")) {
          files.push(file);
        }
      }
    }
    onFilesSelected(files);
  };

  const handleFileSelection = async () => {
    try {
      if ("showDirectoryPicker" in window) {
        const dirHandle = await (window as any).showDirectoryPicker();

        // Request persistent access
        const permission = await dirHandle.requestPermission({ mode: "read" });
        if (permission === "granted") {
          setDirectoryHandle(dirHandle);
          saveDirectoryHandle(dirHandle); // Save handle to IndexedDB
          await accessFilesFromDirectory(dirHandle); // Access files
        }
      }
    } catch (error) {
      console.error("Error accessing files:", error);
    }
  };

  return (
    <Button variant="outline" onClick={handleFileSelection}>
      Select Directory
    </Button>
  );
};

export default FilePicker;
