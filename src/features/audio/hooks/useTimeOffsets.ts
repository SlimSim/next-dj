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

    // Always update the current time for the seeker
    if (trackProp === "currentTrack") {
      setCurrentTime(currentTime);
    }

    // If track has an end offset and we've reached it, play next track
    if (
      track.endTimeOffset !== undefined &&
      track.endTimeOffset > 0 &&
      timeRemaining <= track.endTimeOffset
    ) {
      console.log('TimeOffsets: Reached end offset for track:', track.title);
      if (trackProp === "currentTrack") {
        playNextTrack();
      }
    }
  }, [track, playNextTrack, trackProp, setCurrentTime]);

  useEffect(() => {
    if (!track || !audioRef.current) return;

    console.log('TimeOffsets: Starting playback of track:', track.title);

    audioRef.current.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      if (audioRef.current) {
        console.log('TimeOffsets: Ending playback of track:', track.title);
        audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
      }
    };
  }, [track, handleTimeUpdate]);

  return { handleTimeUpdate };
};
