"use client";

// components/FilePicker.tsx

import { useState } from "react";

const FilePicker = () => {
  const [songs, setSongs] = useState<File[]>([]);

  const selectFolder = async () => {
    try {
      // Request the user to pick a directory
      const dirHandle = await window.showDirectoryPicker();

      // Store the directory handle in localStorage (use IndexedDB for larger apps)
      localStorage.setItem("dirHandle", JSON.stringify(dirHandle));

      // Read and list files
      const files: File[] = [];
      for await (const [_, handle] of dirHandle) {
        if (handle.kind === "file") {
          const file = await handle.getFile();
          if (file.type.startsWith("audio/")) {
            files.push(file);
          }
        }
      }
      setSongs(files);
    } catch (error) {
      console.error("Failed to select directory", error);
    }
  };

  return (
    <div>
      <button onClick={selectFolder}>Select Folder</button>
      <ul>
        {songs.map((song, index) => (
          <li key={index}>{song.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default FilePicker;
