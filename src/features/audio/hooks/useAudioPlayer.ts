import { useRef, useEffect } from "react";
import { usePlayerStore } from "@/lib/store";
import { useAudioDevice } from "./useAudioDevice";
import { useAudioControls } from "./useAudioControls";
import { useAudioInitialization } from "./useAudioInitialization";
import { useFadeEffects } from "./useFadeEffects";
import { useTimeOffsets } from "./useTimeOffsets";
import { clampVolume } from "../utils/audioUtils";
import { PlayerState } from "@/lib/types/player";

type TrackPropKey = keyof Pick<PlayerState, "currentTrack" | "prelistenTrack">;

export const useAudioPlayer = (trackProp: TrackPropKey = "currentTrack") => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const trackSourceRef = useRef<string | null>(null);
  
  const track = usePlayerStore((state) => state[trackProp]);
  const { isPlaying, volume } = usePlayerStore();

  const { isLoading, initAudio, handleLoadedMetadata, mountedRef } = useAudioInitialization(audioRef, trackProp);
  
  const { handleVolumeChange, toggleMute } = useAudioControls(
    audioRef,
    isLoading,
    track
  );

  const { handleTimeUpdate } = useTimeOffsets(audioRef, track, trackProp);

  // Initialize audio when track changes
  useEffect(() => {
    console.log('AudioPlayer: Track changed:', {
      newTrackTitle: track?.title,
      newTrackId: track?.id,
      oldTrackId: trackSourceRef.current,
      endOffset: track?.endTimeOffset
    });

    if (track?.id !== trackSourceRef.current) {
      trackSourceRef.current = track?.id || null;
      initAudio(track);
    }
  }, [track?.id, initAudio]);

  // Handle metadata updates (volume, etc.) without reinitializing
  useEffect(() => {
    if (audioRef.current && track) {
      const trackVolume = track.volume || 0.75;
      audioRef.current.volume = clampVolume(volume * trackVolume);
    }
  }, [track?.volume, volume]);

  // Apply fade effects
  useFadeEffects(audioRef, track, volume);

  useEffect(() => {
    return () => {
      console.log('AudioPlayer: Cleaning up player');
      mountedRef.current = false;
      if (audioRef.current?.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, []);

  return {
    audioRef,
    isLoading,
    handleVolumeChange,
    toggleMute,
    handleTimeUpdate,
    handleLoadedMetadata,
    mountedRef,
  };
};
