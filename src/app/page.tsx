"use client";

import AudioPlayer from "@/components/pwa/AudioPlayer";
import AvailableSongs from "@/components/pwa/AvailableSongs";
import FilePicker from "@/components/pwa/FilePicker";
import NowPlayingList from "@/components/pwa/NowPlayingList";
import ToDo from "@/components/ToDo";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

const HomePage = () => {
  const [availableSongs, setAvailableSongs] = useState<File[]>([]);
  const [playingList, setPlayingList] = useState<File[]>([]);

  const handleSongClick = (file: File) => {
    toast(`Added ${file.name} to playlist.`);
    setPlayingList((prev) => [...prev, file]);
  };

  const handleRemoveSong = (index: number) => {
    setPlayingList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFilesSelected = (newFiles: File[]) => {
    setAvailableSongs(newFiles);
  };

  return (
    <div>
      <h2 className="text-xl">Welcome to Next DJ</h2>
      <p>Your music player PWA.</p>
      <ToDo></ToDo>
      <AudioPlayer playingList={playingList} />
      <Button
        variant="outline"
        onClick={() => {
          toast("Toast working");
        }}
      >
        Test Toast
      </Button>
      <FilePicker onFilesSelected={handleFilesSelected} />
      <AvailableSongs
        files={availableSongs}
        onSongClick={handleSongClick}
        setFiles={setAvailableSongs}
      />
      <NowPlayingList
        nowPlaying={playingList}
        onRemoveSong={handleRemoveSong}
      />
    </div>
  );
};

export default HomePage;
