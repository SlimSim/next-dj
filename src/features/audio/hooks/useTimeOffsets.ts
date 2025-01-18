import { useCallback, useEffect, useRef } from "react";
import { usePlayerStore } from "@/lib/store";
import { PlayerState } from "@/lib/types/player";

export const useTimeOffsets = (
  audioRef: React.RefObject<HTMLAudioElement>,
  track: PlayerState["currentTrack"],
  trackProp: keyof Pick<PlayerState, "currentTrack" | "prelistenTrack"> = "currentTrack"
) => {
  const { playNextTrack, setCurrentTime } = usePlayerStore();
  const lastLogTimeRef = useRef(0);

  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current || !track) return;

    const currentTime = audioRef.current.currentTime;
    const duration = audioRef.current.duration;
    const timeRemaining = duration - currentTime;

    // Always update the current time for the seeker
    if (trackProp === "currentTrack") {
      setCurrentTime(currentTime);
    }

    // Only log every 10 seconds
    const now = Date.now();
    if (now - lastLogTimeRef.current >= 10000) {
      console.log('TimeOffsets: Time Check:', {
        currentTime: Math.round(currentTime),
        duration: Math.round(duration),
        timeRemaining: Math.round(timeRemaining),
        endOffset: track.endTimeOffset,
        trackId: track.id,
        trackTitle: track.title
      });
      lastLogTimeRef.current = now;
    }

    // If track has an end offset and we've reached it, play next track
    if (
      track.endTimeOffset !== undefined &&
      track.endTimeOffset > 0 &&
      timeRemaining <= track.endTimeOffset
    ) {
      console.log('TimeOffsets: Reached end offset:', {
        currentTime: Math.round(currentTime),
        duration: Math.round(duration),
        endOffset: track.endTimeOffset,
        trackTitle: track.title
      });
      if (trackProp === "currentTrack") {
        playNextTrack();
      }
    }
  }, [track, playNextTrack, trackProp, setCurrentTime]);

  useEffect(() => {
    if (!track) return;

    console.log('TimeOffsets: Setting up listeners for track:', {
      trackTitle: track.title,
      trackId: track.id,
      endOffset: track.endTimeOffset,
      startTime: track.startTime,
      duration: audioRef.current?.duration
    });

    audioRef.current.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      console.log('TimeOffsets: Cleaning up listeners for track:', track.title);
      audioRef.current?.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [track, handleTimeUpdate]);

  return { handleTimeUpdate };
};
