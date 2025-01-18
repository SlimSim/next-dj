import { useCallback, useEffect } from "react";
import { PlayerState } from "@/lib/types/player";
import { usePlayerStore } from "@/lib/store";

export const useTimeOffsets = (
  audioRef: React.RefObject<HTMLAudioElement>,
  track: PlayerState["currentTrack"],
  trackProp: keyof Pick<PlayerState, "currentTrack" | "prelistenTrack">
) => {
  const { setCurrentTime, playNextTrack } = usePlayerStore();

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      if (trackProp === "currentTrack") {
        setCurrentTime(audioRef.current.currentTime);
      }
    }
  }, [setCurrentTime, trackProp]);

  useEffect(() => {
    if (!audioRef.current || !track) return;

    const handleEndTimeOffset = () => {
      if (!audioRef.current || !track.endTimeOffset) return;

      const timeRemaining = audioRef.current.duration - audioRef.current.currentTime;
      if (timeRemaining <= track.endTimeOffset) {
        if (trackProp === "currentTrack") {
          playNextTrack();
        } else {
          audioRef.current.pause();
        }
      }
    };

    audioRef.current.addEventListener("timeupdate", handleEndTimeOffset);
    audioRef.current.addEventListener("timeupdate", handleTimeUpdate);
    
    return () => {
      audioRef.current?.removeEventListener("timeupdate", handleEndTimeOffset);
      audioRef.current?.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [track?.id, handleTimeUpdate, playNextTrack, track?.endTimeOffset, trackProp]);

  return {
    handleTimeUpdate
  };
};
