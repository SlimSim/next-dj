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

// Global audio context and source node
let globalAudioContext: AudioContext | null = null;
let globalSourceNode: MediaElementAudioSourceNode | null = null;

export const useAudioPlayer = (trackProp: TrackPropKey = "currentTrack") => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentFileRef = useRef<Blob | null>(null);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const [isLoading, setIsLoading] = useState(false);
  const track = usePlayerStore((state) => state[trackProp]);
  const trackSourceRef = useRef<string | null>(null);
  const isFadingOutRef = useRef(false);

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
      // Only update volume if we're not in a fade-out state
      if (!isFadingOutRef.current) {
        const trackVolume = track.volume || 0.75;
        audioRef.current.volume = clampVolume(volume * trackVolume);
      }
    }
  }, [track?.volume, volume]);

  // Handle track transition and ensure volume stays at 0 until next track is ready
  const handleTrackTransition = useCallback(() => {
    if (!audioRef.current) return;

    // Ensure volume stays at 0 during transition
    audioRef.current.volume = 0;

    if (trackProp === "currentTrack") {
      playNextTrack();
    } else {
      audioRef.current.pause();
    }
  }, [trackProp, playNextTrack]);

  // Handle end time offset and fade out
  useEffect(() => {
    if (!audioRef.current || !track) return;

    const handleTimeUpdate = () => {
      if (!audioRef.current || !track) return;

      const currentTime = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      const timeRemaining = duration - currentTime;
      const fadeOutDuration = track.fadeOutDuration || 0;
      const endTimeOffset = track.endTimeOffset || 0;
      const shouldEndAt = duration - endTimeOffset;
      const fadeOutStartTime = shouldEndAt - fadeOutDuration;

      // Start fade out if we're past the fade out start time but before the end offset
      if (fadeOutDuration > 0 && currentTime >= fadeOutStartTime && currentTime < shouldEndAt) {
        isFadingOutRef.current = true;
        const timeIntoFade = currentTime - fadeOutStartTime;
        const fadeOutProgress = 1 - (timeIntoFade / fadeOutDuration);
        const targetVolume = (track.volume || 0.75) * fadeOutProgress;
        
        audioRef.current.volume = Math.max(0, Math.min(targetVolume, 1));
      }

      // Once we reach the end point, initiate track transition
      if (currentTime >= shouldEndAt) {
        isFadingOutRef.current = true;
        handleTrackTransition();
      }
    };

    audioRef.current.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
      }
    };
  }, [track?.id, track?.fadeOutDuration, track?.endTimeOffset, handleTrackTransition]);

  // Handle volume initialization and fade-in
  useEffect(() => {
    if (!audioRef.current || !track) return;

    // Reset fade-out state when track changes
    isFadingOutRef.current = false;

    let fadeDuration = track.fadeDuration || 0;
    const initialVolume = track.volume || 0.75;

    // Treat no fade-in as a very short fade-in
    if (fadeDuration === 0) {
      fadeDuration = 0.001; // Set to a very short duration
    }

    audioRef.current.volume = 0; // Start at 0 for fade-in

    console.log('Fade-in effect initiated');
    console.log('Fade Duration:', fadeDuration);
    console.log('Initial Volume:', initialVolume);

    let fadeInterval: number | null = null;
    const startTime = Date.now();

    const handlePlay = () => {
      console.log('Play event triggered');
      
      // Clear any existing interval
      if (fadeInterval) {
        clearInterval(fadeInterval);
      }

      // Use setInterval instead of requestAnimationFrame
      fadeInterval = window.setInterval(() => {
        if (!audioRef.current) {
          if (fadeInterval) clearInterval(fadeInterval);
          return;
        }

        const elapsed = (Date.now() - startTime) / 1000;
        const fadeProgress = Math.min(Math.max(elapsed / fadeDuration, 0), 1);

        console.log('Elapsed:', elapsed);
        console.log('Fade Progress:', fadeProgress);
        console.log('Current Volume:', audioRef.current.volume);

        if (fadeProgress < 1) {
          audioRef.current.volume = Math.min(Math.max(initialVolume * fadeProgress, 0), 1);
        } else {
          audioRef.current.volume = initialVolume;
          if (fadeInterval) {
            clearInterval(fadeInterval);
          }
        }
      }, 50); // Update every 50ms
    };

    audioRef.current.addEventListener('play', handlePlay, { once: true });

    return () => {
      if (fadeInterval) {
        clearInterval(fadeInterval);
      }
      if (audioRef.current) {
        audioRef.current.removeEventListener('play', handlePlay);
      }
    };
  }, [track?.id, track?.fadeDuration]);

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

  // Ensure audio context stays active in background
  useEffect(() => {
    if (!audioRef.current) return;

    if (!globalAudioContext) {
      globalAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (!globalSourceNode) {
      globalSourceNode = globalAudioContext.createMediaElementSource(audioRef.current);
      globalSourceNode.connect(globalAudioContext.destination);
    }

    const resumeAudioContext = () => {
      if (globalAudioContext?.state === 'suspended') {
        globalAudioContext.resume();
      }
    };

    document.addEventListener('visibilitychange', resumeAudioContext);

    return () => {
      document.removeEventListener('visibilitychange', resumeAudioContext);
    };
  }, []);

  // Fix track state management during transitions
  useEffect(() => {
    if (!audioRef.current || !track) return;

    const handleTrackEnd = () => {
      if (trackProp === "currentTrack") {
        playNextTrack();
      }
    };

    audioRef.current.addEventListener('ended', handleTrackEnd);
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleTrackEnd);
      }
    };
  }, [track?.id, trackProp, playNextTrack]);

  return {
    audioRef,
    isLoading,
    handleTimeUpdate,
    handleLoadedMetadata,
    initAudio,
    mountedRef,
  };
};
