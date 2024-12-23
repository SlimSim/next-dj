import { useCallback, useState } from "react";
import { usePlayerStore } from "@/lib/store";

export const useAudioControls = (
  audioRef: React.RefObject<HTMLAudioElement>,
  isLoading: boolean
) => {
  const [isMuted, setIsMuted] = useState(false);
  const { setVolume, isPlaying, setIsPlaying, setCurrentTime, currentTrack } =
    usePlayerStore();

  const handleVolumeChange = useCallback(
    (value: number) => {
      setVolume(value);
      if (audioRef.current) {
        audioRef.current.volume = value;
      }
    },
    [setVolume]
  );

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
    if (!audioRef.current || !currentTrack || isLoading) return;
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
