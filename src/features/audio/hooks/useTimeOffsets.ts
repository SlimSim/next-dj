import { useCallback, useEffect } from "react";
import { usePlayerStore } from "@/lib/store";
import { PlayerState } from "@/lib/types/player";

export const useTimeOffsets = (
  audioRef: React.RefObject<HTMLAudioElement>,
  track: PlayerState["currentTrack"],
  trackProp: keyof Pick<PlayerState, "currentTrack" | "prelistenTrack"> = "currentTrack"
) => {
  const { playNextTrack, setCurrentTime } = usePlayerStore();

  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current || !track) return;

    const currentTime = audioRef.current.currentTime;
    const duration = audioRef.current.duration;
    const timeRemaining = duration - currentTime;
    const endTimeOffset = track.endTimeOffset || 0;
    const endTimeFadeDuration = track.endTimeFadeDuration || 0;

    // Always update the current time for the seeker
    if (trackProp === "currentTrack") {
      setCurrentTime(currentTime);
    }

    // If track has an end offset and we've reached it, play next track
    if (
      endTimeOffset > 0 &&
      timeRemaining <= endTimeOffset  // Switch exactly at endTimeOffset
    ) {      
      if (trackProp === "currentTrack") {
        // Stop current track before playing next
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        playNextTrack();
      }
    }
  }, [track, playNextTrack, trackProp, setCurrentTime]);

  useEffect(() => {
    if (!track || !audioRef.current) return;

    audioRef.current.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
      }
    };
  }, [track, handleTimeUpdate]);

  return { handleTimeUpdate };
};
