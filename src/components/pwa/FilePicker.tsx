// src/components/pwa/FilePicker.tsx
import React, { useState } from "react";
import { Button } from "../ui/button";

const FilePicker: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);

  const handleFileSelection = async () => {
    try {
      // Check if the browser supports the File System Access API
      if ("showDirectoryPicker" in window) {
        // Allow user to pick a directory
        const dirHandle = await (window as any).showDirectoryPicker();
        const newFiles: File[] = [];

        // Iterate over directory files
        for await (const [name, handle] of dirHandle) {
          if (handle.kind === "file") {
            const file = await handle.getFile();
            if (
              file.type.startsWith("audio/") ||
              file.type.startsWith("video/")
            ) {
              newFiles.push(file);
            }
          }
        }
        setFiles(newFiles);
      } else {
        alert("File System Access API is not supported on this browser.");
      }
    } catch (error) {
      console.error("Error accessing files:", error);
    }
  };

  return (
    <div>
      <Button variant="outline" onClick={handleFileSelection}>
        Select Directory
      </Button>
      <ul>
        {files.map((file, index) => (
          <li key={index}>
            {file.name} ({file.type})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FilePicker;
