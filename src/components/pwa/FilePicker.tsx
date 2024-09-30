// src/components/pwa/FilePicker.tsx
import React from "react";
import { Button } from "@/components/ui/button";

interface FilePickerProps {
  onFilesSelected: (files: File[]) => void;
}

const FilePicker: React.FC<FilePickerProps> = ({ onFilesSelected }) => {
  const handleFileSelection = async () => {
    try {
      if ("showDirectoryPicker" in window) {
        const dirHandle = await (window as any).showDirectoryPicker();
        const files: File[] = [];
        for await (const [, handle] of dirHandle) {
          if (handle.kind === "file") {
            const file = await handle.getFile();
            if (
              file.type.startsWith("audio/") ||
              file.type.startsWith("video/")
            ) {
              files.push(file);
            }
          }
        }
        onFilesSelected(files);
      } else {
        alert("File System Access API is not supported on this browser.");
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
