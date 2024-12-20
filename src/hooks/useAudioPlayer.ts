// hooks/useAudioPlayer.ts
import { useCallback, useRef, useState } from "react";
import { usePlayerStore } from "@/lib/store";
import { getAudioFile, incrementPlayCount } from "@/lib/db";
import { toast } from "sonner";

export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentFileRef = useRef<Blob | null>(null);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const [isLoading, setIsLoading] = useState(false);

  const {
    currentTrack,
    isPlaying,
    volume,
    setIsPlaying,
    setDuration,
    setCurrentTime,
    playNextTrack,
  } = usePlayerStore();

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, [setCurrentTime]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, [setDuration]);

  const initAudio = async () => {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);

    try {
      if (!currentTrack?.id) return;

      const audioFile = await getAudioFile(currentTrack.id);
      if (!audioFile?.file) {
        toast.error(`No audio file found for ${currentTrack.title}`);
        playNextTrack();
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
            setDuration(audioRef.current?.duration || 0);
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
