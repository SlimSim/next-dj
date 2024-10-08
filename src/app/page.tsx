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
      <ul className="list-decimal ml-4">
        <li>
          att fixa: att den kan ladda ner och spara låtar som finns på servern,
          ska jag göra detta via backenden kanske? (så att NextJs anropar
          firebase (eller spotify!!!) och skickar låtarna till klienten, som
          sparar det på disk (och där finns ju BÅDE den publika disken, som
          chrome komemr åt, men också en sån där seecret place, som ios kommer
          åt) eller i IndexedDB!)
          <ul className="list-disc ml-4">
            <li>
              denan fil (take me to church) från firebase:
              4ed171cc22759ea60cfe6049f01f0e1b8715e52acbc1b3bffe88acc1c42652a5
            </li>
            <li>
              har denna länk:{" "}
              <a
                target="_blank"
                href="https://firebasestorage.googleapis.com/v0/b/troff-test.appspot.com/o/TroffFiles%2F4ed171cc22759ea60cfe6049f01f0e1b8715e52acbc1b3bffe88acc1c42652a5?alt=media&token=bfc80084-a477-4db6-b587-2ae00e64d5ac"
              >
                länk
              </a>
            </li>
            <li>
              testa att ladda ner den både till <b>indexedDB</b> OCH till{" "}
              <b>fileSystemAPI</b>
              (hemliga helst!)
            </li>
          </ul>
        </li>
        <li>Att ladda upp låtar från datorn också!</li>
        <li>
          Slå ihop tailwind.config.ts och tailwind.config.js, borde bara behöva
          en eller?
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
