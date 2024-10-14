"use client";
// src/components/pwa/AvailableSongs.tsx
import React from "react";
import { Button } from "../ui/button";
import { fetchAndSaveSong } from "@/utils/fetchAndSaveSong";
import { toast } from "sonner";

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
    toast(`Adding external song...`);
    const url = prompt("Enter the external song URL:");
    toast(`Adding external song from ${url}`);
    if (url) {
      const savedFile = await fetchAndSaveSong(url, "external_song.mp3");
      toast(
        `have fetched url, savedFile ${savedFile} is ${savedFile?.name} ${savedFile?.type} ${savedFile?.size}`
      );
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
