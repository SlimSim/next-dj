import { useCallback, useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { getAudioFile } from "@/db/audio-operations";
import { PlayerState } from "@/lib/types/player";
import { usePlayerStore } from "@/lib/store";

export const useAudioInitialization = (
  audioRef: React.RefObject<HTMLAudioElement>,
  trackProp: keyof Pick<PlayerState, "currentTrack" | "prelistenTrack">
) => {
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const [isLoading, setIsLoading] = useState(false);
  const currentFileRef = useRef<Blob | null>(null);
  
  const { setDuration, setPrelistenDuration, playNextTrack } = usePlayerStore();

  // Initialize mountedRef
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      if (trackProp === "currentTrack") {
        setDuration(audioRef.current.duration);
      } else {
        setPrelistenDuration(audioRef.current.duration);
      }
    }
  }, [setDuration, setPrelistenDuration, trackProp]);

  const initAudio = async (track: PlayerState["currentTrack"]) => {
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
          if (!mountedRef.current || !audioRef.current) return;
          
          setIsLoading(false);
          if (trackProp === "currentTrack") {
            setDuration(audioRef.current.duration || 0);
          } else {
            setPrelistenDuration(audioRef.current.duration || 0);
          }
          if (track.startTime && track.startTime > 0 && audioRef.current) {
            audioRef.current.currentTime = track.startTime;
          }
          resolve();
        };

        audioRef.current.addEventListener("canplay", handleCanPlay, { once: true });
      });

    } catch (error) {
      console.error("Error initializing audio:", error);
      toast.error("Error loading audio file");
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    initAudio,
    handleLoadedMetadata,
    mountedRef,
  };
};
