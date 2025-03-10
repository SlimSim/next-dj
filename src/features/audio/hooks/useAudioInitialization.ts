import { useCallback, useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { getAudioFile } from "@/db/audio-operations";
import { PlayerState } from "@/lib/types/player";
import { usePlayerStore } from "@/lib/store";
import { createAudioUrl, revokeAudioUrl, setAudioSource } from "../utils/audioUtils";
import { AudioError, AudioErrorCode } from "../types";
import { createErrorHandler, withErrorHandler } from "../utils/errorUtils";

const handleError = createErrorHandler('AudioInitialization');

export const useAudioInitialization = (
  audioRef: React.RefObject<HTMLAudioElement>,
  trackProp: keyof Pick<PlayerState, "currentTrack" | "prelistenTrack">
) => {
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const [isLoading, setIsLoading] = useState(false);
  const currentFileRef = useRef<Blob | null>(null);
  const currentUrlRef = useRef<string | null>(null);

  const { setDuration, setPrelistenDuration, playNextTrack } = usePlayerStore();
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  // Initialize mountedRef
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Cleanup URL on unmount
      if (currentUrlRef.current) {
        revokeAudioUrl(currentUrlRef.current);
        currentUrlRef.current = null;
      }
    };
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      if (trackProp === "currentTrack") {
        setDuration(audioRef.current.duration);
        // Resume playback if it was playing before
        if (isPlaying) {
          audioRef.current.play().catch(() => 
            handleError(new AudioError('Failed to resume playback', AudioErrorCode.PLAYBACK_FAILED))
          );
        }
      } else {
        setPrelistenDuration(audioRef.current.duration);
      }
    }
  }, [setDuration, setPrelistenDuration, trackProp, isPlaying]);

  const cleanupCurrentTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (audioRef.current.src) {
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      }
    }
    if (currentUrlRef.current) {
      revokeAudioUrl(currentUrlRef.current);
      currentUrlRef.current = null;
    }
  }, []);

  const initAudio = async (track: PlayerState["currentTrack"]) => {
    if (!track?.id) return;
    if (loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);

    try {
      // Clean up previous track first
      cleanupCurrentTrack();

      if (track.removed) {
        throw new AudioError(`Track ${track.title} has been removed`, AudioErrorCode.TRACK_NOT_FOUND);
      }

      const audioFile = await withErrorHandler(
        () => getAudioFile(track.id),
        'getAudioFile',
        true,
        true
      );

      if (!audioFile?.file) {
        throw new AudioError(
          `No audio file found for ${track.title}`,
          AudioErrorCode.FILE_NOT_FOUND
        );
      }

      if (!mountedRef.current) return;

      currentFileRef.current = audioFile.file;
      if (!audioRef.current) {
        throw new AudioError(
          'Audio element not initialized',
          AudioErrorCode.PLAYBACK_FAILED
        );
      }

      // Set preload attribute to prevent auto-seeking
      audioRef.current.preload = "none";

      // Set initial start time before setting the source
      if (track.startTime && track.startTime > 0) {
        audioRef.current.currentTime = track.startTime;
      }

      const cleanup = setAudioSource(audioRef.current, audioFile.file);
      currentUrlRef.current = audioRef.current.src;

      await new Promise<void>((resolve, reject) => {
        if (!audioRef.current) {
          reject(new AudioError('Audio element not found', AudioErrorCode.PLAYBACK_FAILED));
          return;
        }

        const handleAudioError = (e: ErrorEvent) => {
          console.info(`Audio error at: ${new Date().toISOString()}, Error: ${e.message}, Seek Time: ${audioRef.current?.currentTime.toFixed(2)}s`);
          reject(new AudioError(
            `Failed to load audio: ${e.message}`,
            AudioErrorCode.INVALID_AUDIO
          ));
        };

        const handleCanPlay = () => {
          if (!mountedRef.current || !audioRef.current) return;

          setIsLoading(false);
          
          if (trackProp === "currentTrack") {
            setDuration(audioRef.current.duration || 0);
            
            // Double check start time is correct
            if (track.startTime && track.startTime > 0 && Math.abs(audioRef.current.currentTime - track.startTime) > 0.1) {
              audioRef.current.currentTime = track.startTime;
            }

            // Now that everything is set up, start playback if needed
            if (isPlaying) {
              audioRef.current.play().catch(() => 
                handleError(new AudioError('Failed to start playback', AudioErrorCode.PLAYBACK_FAILED))
              );
            }
          } else {
            setPrelistenDuration(audioRef.current.duration || 0);
            // For prelisten, verify start time
            if (track.startTime && track.startTime > 0 && Math.abs(audioRef.current.currentTime - track.startTime) > 0.1) {
              audioRef.current.currentTime = track.startTime;
            }
          }

          // Remove any existing ended handler
          audioRef.current.onended = null;

          // Set up the ended handler based on end offset
          if (audioRef.current) {
            audioRef.current.onended = () => {
              cleanupCurrentTrack();
              if (trackProp === "currentTrack") {
                playNextTrack();
              }
            };

            audioRef.current.removeEventListener('error', handleAudioError);
          }
          resolve();
        };

        audioRef.current.addEventListener('error', handleAudioError);
        audioRef.current.addEventListener("canplay", handleCanPlay, { once: true });
      });

    } catch (error) {
      handleError(error);
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
