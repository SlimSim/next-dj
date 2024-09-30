"use client";
// src/components/pwa/AvailableSongs.tsx
import React from "react";
import { Button } from "../ui/button";

interface AvailableSongsProps {
  files: File[];
  onSongClick: (file: File) => void;
}

const AvailableSongs: React.FC<AvailableSongsProps> = ({
  files,
  onSongClick,
}: AvailableSongsProps) => {
  return (
    <ul>
      {files.map((file, index) => (
        <li key={index}>
          <Button variant="outline" onClick={() => onSongClick(file)}>
            {file.name} ({file.type}){file.name}
          </Button>
        </li>
      ))}
    </ul>
  );
};

export default AvailableSongs;
