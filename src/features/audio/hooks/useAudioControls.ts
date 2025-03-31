import { useCallback, useState, useEffect } from "react";
import { usePlayerStore } from "@/lib/store";
import { MusicMetadata } from "@/lib/types/types";
import { getNormalizedVolume } from "../utils/audioUtils";

// Helper function to clamp volume between 0 and 1
const clampVolume = (value: number) => Math.max(0, Math.min(1, value));

export const useAudioControls = (
  audioRef: React.RefObject<HTMLAudioElement>,
  isLoading: boolean,
  track?: MusicMetadata | null
) => {
  const [isMuted, setIsMuted] = useState(false);
  const {
    setVolume,
    isPlaying,
    setIsPlaying,
    setCurrentTime,
    volume,
    currentTrack,
  } = usePlayerStore();

  const handleVolumeChange = useCallback(
    (value: number) => {
      setVolume(value);
      if (audioRef.current) {
        const trackVolume = track?.volume || 1;
        audioRef.current.volume = getNormalizedVolume(value, trackVolume);
      }
    },
    [setVolume, track]
  );

  // Update volume when track changes
  useEffect(() => {
    if (audioRef.current && !isMuted) {
      const trackVolume = track?.volume || 1;
      audioRef.current.volume = getNormalizedVolume(volume, trackVolume);
    }
  }, [track, volume, isMuted]);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      audioRef.current.muted = newMuted;
    }
  }, [isMuted]);

  const handleSeek = useCallback(
    (value: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = value;
        setCurrentTime(value);
      }
    },
    [setCurrentTime]
  );

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack || isLoading) {
      return;
    }
    setIsPlaying(!isPlaying);
  }, [currentTrack, isPlaying, isLoading, setIsPlaying]);

  return {
    isMuted,
    handleVolumeChange,
    toggleMute,
    handleSeek,
    togglePlay,
  };
};
