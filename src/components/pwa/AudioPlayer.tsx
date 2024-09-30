// src/components/pwa/AudioPlayer.tsx
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AudioPlayerProps {
  nowPlaying: File[];
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  nowPlaying,
}: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    toast(`AP Now playing: ${nowPlaying[currentIndex].name}`);
    if (audioRef.current && nowPlaying[currentIndex]) {
      audioRef.current.src = URL.createObjectURL(nowPlaying[currentIndex]);
      audioRef.current.play();
      setIsPlaying(true);
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
