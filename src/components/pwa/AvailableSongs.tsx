"use client";
// src/components/pwa/AvailableSongs.tsx
import React from "react";
import { Button } from "../ui/button";
import { fetchAndSaveSong } from "@/utils/fileFetchService";
import { toast } from "sonner";
import { CustomFile } from "@/types/fileTypes";

interface AvailableSongsProps {
  files: CustomFile[];
  onSongClick: (file: CustomFile) => void;
  setFiles: React.Dispatch<React.SetStateAction<CustomFile[]>>;
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
      const nr = Math.floor(Math.random() * 1000);
      const savedFile = await fetchAndSaveSong(url, `external_song_${nr}.mp3`);
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
              {file.name} ({file.type}) - {file.size} bytes. {file.fileIsIn}{" "}
              {file.timesPlayed} times played.
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AvailableSongs;
