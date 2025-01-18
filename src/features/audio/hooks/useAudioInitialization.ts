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
      console.log('AudioInit: Metadata loaded:', {
        trackProp,
        duration: audioRef.current.duration,
        src: audioRef.current.src?.split('/').pop() // Only log filename for brevity
      });
      if (trackProp === "currentTrack") {
        setDuration(audioRef.current.duration);
      } else {
        setPrelistenDuration(audioRef.current.duration);
      }
    }
  }, [setDuration, setPrelistenDuration, trackProp]);

  const initAudio = async (track: PlayerState["currentTrack"]) => {
    if (!track?.id) {
      console.log('AudioInit: No track to initialize');
      return;
    }

    console.log('AudioInit: Starting initialization:', {
      trackTitle: track.title,
      trackId: track.id,
      endOffset: track.endTimeOffset,
      isLoading: loadingRef.current
    });

    if (loadingRef.current) {
      console.log('AudioInit: Already loading a track, skipping');
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);

    try {
      if (track.removed) {
        console.log('AudioInit: Track is marked as removed:', track.title);
        return;
      }

      const audioFile = await getAudioFile(track.id);
      if (!audioFile?.file) {
        console.error('AudioInit: No audio file found:', {
          trackTitle: track.title,
          trackId: track.id
        });
        toast.error(`No audio file found for ${track.title}`);
        if (trackProp === "currentTrack") {
          playNextTrack();
        }
        return;
      }

      if (!mountedRef.current) {
        console.log('AudioInit: Component unmounted during initialization');
        return;
      }

      currentFileRef.current = audioFile.file;
      if (!audioRef.current) throw new Error("Audio element not initialized");

      if (audioRef.current.src) {
        console.log('AudioInit: Cleaning up old URL:', audioRef.current.src?.split('/').pop());
        URL.revokeObjectURL(audioRef.current.src);
      }

      const url = URL.createObjectURL(audioFile.file);
      console.log('AudioInit: Created new URL for track:', {
        trackTitle: track.title,
        filename: url.split('/').pop()
      });
      
      audioRef.current.src = url;

      await new Promise<void>((resolve, reject) => {
        if (!audioRef.current) {
          reject(new Error("Audio element not found"));
          return;
        }

        // Add error handler
        const handleError = (e: ErrorEvent) => {
          console.error('AudioInit: Error loading audio:', {
            trackTitle: track.title,
            error: e.message
          });
          reject(new Error(`Failed to load audio: ${e.message}`));
        };

        const handleCanPlay = () => {
          if (!mountedRef.current || !audioRef.current) return;
          
          console.log('AudioInit: Track ready to play:', {
            trackTitle: track.title,
            duration: Math.round(audioRef.current.duration),
            startTime: track.startTime,
            endOffset: track.endTimeOffset
          });

          setIsLoading(false);
          if (trackProp === "currentTrack") {
            setDuration(audioRef.current.duration || 0);
          } else {
            setPrelistenDuration(audioRef.current.duration || 0);
          }
          if (track.startTime && track.startTime > 0 && audioRef.current) {
            audioRef.current.currentTime = track.startTime;
          }

          // Remove any existing ended handler
          audioRef.current.onended = null;

          // Set up the ended handler based on end offset
          audioRef.current.onended = () => {
            console.log('AudioInit: Track ended naturally:', {
              trackTitle: track.title,
              currentTime: Math.round(audioRef.current?.currentTime || 0),
              duration: Math.round(audioRef.current?.duration || 0),
              endOffset: track.endTimeOffset
            });
            if (trackProp === "currentTrack") {
              playNextTrack();
            }
          };

          audioRef.current.removeEventListener('error', handleError);
          resolve();
        };

        audioRef.current.addEventListener('error', handleError);
        audioRef.current.addEventListener("canplay", handleCanPlay, { once: true });
      });

    } catch (error) {
      console.error("AudioInit: Error initializing audio:", {
        trackTitle: track?.title,
        error: error instanceof Error ? error.message : String(error)
      });
      toast.error("Error loading audio file");
      if (trackProp === "currentTrack") {
        playNextTrack();
      }
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
