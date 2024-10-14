"use client";
// src/components/pwa/AvailableSongs.tsx
import React from "react";
import { Button } from "../ui/button";
import { fetchAndSaveSong } from "@/utils/fetchAndSaveSong";

interface AvailableSongsProps {
  files: File[];
  onSongClick: (file: File) => void;
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

const AvailableSongs: React.FC<AvailableSongsProps> = ({
  files,
  onSongClick,
  setFiles,
}: AvailableSongsProps) => {
  const handleAddExternalSong = async () => {
    const url = prompt("Enter the external song URL:");
    if (url) {
      const savedFile = await fetchAndSaveSong(url, "external_song.mp3");
      if (savedFile) {
        setFiles((prevFiles) => [...prevFiles, savedFile]);
      }
    }
  };

  return (
    <div>
      <Button variant="outline" onClick={handleAddExternalSong}>
        Add Song from URL
      </Button>
      <ul>
        {files.map((file, index) => (
          <li key={index}>
            <Button variant="outline" onClick={() => onSongClick(file)}>
              {file.name} ({file.type})
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AvailableSongs;
