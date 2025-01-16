import { useCallback, useRef, useState, useEffect } from "react";
import { usePlayerStore } from "@/lib/store";
import { toast } from "sonner";
import { getAudioFile } from "@/db/audio-operations";
import { useAudioDevice } from "./useAudioDevice";
import { useAudioControls } from "./useAudioControls";
import { PlayerState } from "@/lib/types/player";

// Helper function to clamp volume between 0 and 1
const clampVolume = (value: number) => Math.max(0, Math.min(1, value));

type TrackPropKey = keyof Pick<PlayerState, "currentTrack" | "prelistenTrack">;

export const useAudioPlayer = (trackProp: TrackPropKey = "currentTrack") => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentFileRef = useRef<Blob | null>(null);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const [isLoading, setIsLoading] = useState(false);
  const track = usePlayerStore((state) => state[trackProp]);
  const trackSourceRef = useRef<string | null>(null);

  const {
    isPlaying,
    volume,
    setIsPlaying,
    setDuration,
    setCurrentTime,
    playNextTrack,
    setPrelistenDuration,
  } = usePlayerStore();

  // Initialize audio controls with the current track
  const { handleVolumeChange, toggleMute } = useAudioControls(
    audioRef,
    isLoading,
    track
  );

  // Only reinitialize audio when the track ID changes
  useEffect(() => {
    const shouldReinitialize = track?.id !== trackSourceRef.current;

    if (shouldReinitialize) {
      trackSourceRef.current = track?.id || null;
      initAudio();
    }
  }, [track?.id]);

  // Handle metadata updates (volume, etc.) without reinitializing
  useEffect(() => {
    if (audioRef.current && track) {
      const trackVolume = track.volume || 0.75;
      audioRef.current.volume = clampVolume(volume * trackVolume);
    }
  }, [track?.volume, volume]);

  // Implement fade-in functionality
  useEffect(() => {
    if (!audioRef.current || !track) return;

    const fadeDuration = track.fadeDuration || 0;
    const initialVolume = track.volume || 0.75;
    audioRef.current.volume = fadeDuration > 0 ? 0 : initialVolume;

    console.log('Fade-in effect initiated');
    console.log('Fade Duration:', fadeDuration);
    console.log('Initial Volume:', initialVolume);

    if (fadeDuration > 0) {
      let startTime = Date.now() / 1000; // Use actual time instead of audio currentTime
      
      const fadeIn = () => {
        if (!audioRef.current) return;

        const currentTime = Date.now() / 1000;
        const elapsed = currentTime - startTime;
        const fadeProgress = Math.min(Math.max(elapsed / fadeDuration, 0), 1);

        console.log('Current Time:', currentTime);
        console.log('Start Time:', startTime);
        console.log('Elapsed:', elapsed);
        console.log('Fade Progress:', fadeProgress);
        console.log('Current Volume:', audioRef.current.volume);

        if (fadeProgress < 1) {
          audioRef.current.volume = Math.min(Math.max(initialVolume * fadeProgress, 0), 1);
          requestAnimationFrame(fadeIn);
        } else {
          audioRef.current.volume = initialVolume;
        }
      };

      const handlePlay = () => {
        console.log('Play event triggered');
        startTime = Date.now() / 1000; // Reset start time when play actually begins
        fadeIn();
      };

      audioRef.current.addEventListener('play', handlePlay, { once: true });
    }
  }, [track?.id, track?.fadeDuration]);

  // Set initial time and handle end time offset
  useEffect(() => {
    if (!audioRef.current || !track) return;

    // Handle end time offset
    const handleTimeUpdate = () => {
      if (!audioRef.current || !track.endTimeOffset) return;

      const timeRemaining =
        audioRef.current.duration - audioRef.current.currentTime;
      if (timeRemaining <= track.endTimeOffset) {
        // Time to move to next track
        if (trackProp === "currentTrack") {
          playNextTrack();
        } else {
          // For prelisten, just pause
          audioRef.current.pause();
        }
      }
    };

    audioRef.current.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      audioRef.current?.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [track?.id]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      if (trackProp === "currentTrack") {
        setCurrentTime(audioRef.current.currentTime);
      }
    }
  }, [setCurrentTime, trackProp]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      if (trackProp === "currentTrack") {
        setDuration(audioRef.current.duration);
      } else {
        setPrelistenDuration(audioRef.current.duration);
      }
    }
  }, [setDuration, setPrelistenDuration, trackProp]);

  const initAudio = async () => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);

    try {
      if (!track?.id || track.removed) {
        return;
      }

      const audioFile = await getAudioFile(track.id);
      if (!audioFile?.file) {
        toast.error(`No audio file found for ${track.title}`);
        if (trackProp === "currentTrack") {
          playNextTrack();
        }
        return;
      }

      if (!mountedRef.current) return;

      currentFileRef.current = audioFile.file;
      if (!audioRef.current) throw new Error("Audio element not initialized");

      if (audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }

      const url = URL.createObjectURL(audioFile.file);
      audioRef.current.src = url;

      await new Promise<void>((resolve, reject) => {
        if (!audioRef.current) {
          reject(new Error("Audio element not found"));
          return;
        }

        const handleCanPlay = () => {
          if (mountedRef.current) {
            setIsLoading(false);
            if (trackProp === "currentTrack") {
              setDuration(audioRef.current?.duration || 0);
            } else {
              setPrelistenDuration(audioRef.current?.duration || 0);
            }
            if (track.startTime && track.startTime > 0) {
              audioRef.current.currentTime = track.startTime;
            }
          }
          resolve();
        };

        const handleError = (error: Event) => {
          reject(
            new Error(
              `Failed to load audio: ${
                audioRef.current?.error?.message || "Unknown error"
              }`
            )
          );
        };

        audioRef.current.addEventListener("canplay", handleCanPlay, {
          once: true,
        });
        audioRef.current.addEventListener("error", handleError, { once: true });
        audioRef.current.load();
      });
    } catch (error) {
      console.error("Error initializing audio:", error);
      setIsPlaying(false);
      if (audioRef.current?.src) {
        URL.revokeObjectURL(audioRef.current.src);
        audioRef.current.src = "";
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        loadingRef.current = false;
      }
    }
  };

  return {
    audioRef,
    isLoading,
    handleTimeUpdate,
    handleLoadedMetadata,
    initAudio,
    mountedRef,
  };
};
