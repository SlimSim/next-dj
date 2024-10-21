import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CustomFile } from "@/types/fileTypes"; // Assume CustomFile extends File with metadata
import { updateFileMetadataInIndexedDB } from "@/utils/indexedDbService"; // Helper to update in IndexedDB

interface AudioPlayerProps {
  playingList: CustomFile[]; // Now using CustomFile type
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  playingList,
}: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Update the "timesPlayed" for the current file
  const incrementTimesPlayed = async (file: CustomFile) => {
    file.timesPlayed = (file.timesPlayed || 0) + 1;

    // Check if file is in IndexedDB and update metadata accordingly
    if (file.fileIsIn === "indexedDB") {
      await updateFileMetadataInIndexedDB(file);
    }

    // For FileSystem files, you can extend this logic
    // e.g., using a different helper for FileSystemAPI to sync metadata
  };

  const handlePlay = async () => {
    if (playingList[currentIndex]) {
      const currentFile = playingList[currentIndex];

      toast(`AP Now playing: ${currentFile.name}`);

      if (audioRef.current) {
        audioRef.current.src = URL.createObjectURL(currentFile);
        audioRef.current.play();
        setIsPlaying(true);

        // Increment "timesPlayed" count and update metadata
        await incrementTimesPlayed(currentFile);
      }
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleResume = () => {
    if (audioRef.current && !isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div>
      <audio ref={audioRef} />
      <Button variant="outline" onClick={isPlaying ? handlePause : handlePlay}>
        {isPlaying ? "Pause" : "Play"}
      </Button>
      <Button variant="outline" onClick={handleResume} disabled={isPlaying}>
        Resume
      </Button>
    </div>
  );
};

export default AudioPlayer;
