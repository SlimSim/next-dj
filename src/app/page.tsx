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
      <ul>
        <li>
          att fixa: att den kan ladda ner och spara låtar som finns på servern,
          ska jag göra detta via backenden kanske? (så att NextJs anropar
          firebase (eller spotify!!!) och skickar låtarna till klienten, som
          sparar det på disk (och där finns ju BÅDE den publika disken, som
          chrome komemr åt, men också en sån där seecret place, som ios kommer
          åt) eller i IndexedDB!)
        </li>
      </ul>
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
