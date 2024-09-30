"use client";

import AudioPlayer from "@/components/pwa/AudioPlayer";
import AvailableSongs from "@/components/pwa/AvailableSongs";
import FilePicker from "@/components/pwa/FilePicker";
import NowPlayingList from "@/components/pwa/NowPlayingList";
import { Button } from "@/components/ui/button";
import { usePersistentState } from "@/hooks/usePersistentState";
import { useState } from "react";
import { toast } from "sonner";

const HomePage = () => {
  const [availableSongs, setAvailableSongs] = useState<File[]>(
    // "AvailableSongs",
    []
  );
  const [nowPlaying, setNowPlaying] = useState<File[]>([]);

  const handleSongClick = (file: File) => {
    toast(`Now playing: ${file.name}`);
    setNowPlaying((prev) => [...prev, file]);
  };

  const handleRemoveSong = (index: number) => {
    setNowPlaying((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFilesSelected = (newFiles: File[]) => {
    setAvailableSongs(newFiles);
  };

  return (
    <div>
      <h2 className="text-xl">Welcome to Next DJ</h2>
      <p>Your music player PWA.</p>
      <p>Jag vill ha Sonner</p>
      <AudioPlayer nowPlaying={nowPlaying} />
      <Button
        variant="outline"
        onClick={() => {
          toast("Toast working");
        }}
      >
        Test Toast
      </Button>
      <FilePicker onFilesSelected={handleFilesSelected} />
      <AvailableSongs files={availableSongs} onSongClick={handleSongClick} />
      <NowPlayingList nowPlaying={nowPlaying} onRemoveSong={handleRemoveSong} />
    </div>
  );
};

export default HomePage;
