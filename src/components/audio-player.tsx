"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { PlayButton } from "./play-button";
import { usePlayerStore } from "@/lib/store";
import { incrementPlayCount, getAudioFile } from "@/lib/db";
import { AudioFile } from "@/lib/types";
import { PlayingQueue } from "./playing-queue";
import { PlayerControlsMenu } from "./player-controls-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import OpenPlayingQueueButton from "./open-playing-queue-button";
import OpenPlayerControlsButton from "./open-player-controls-button";
import ProgressIndicator from "./progress-indicator";
import CurrentSongInfo from "./current-song-info";

export const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentFileRef = useRef<Blob | null>(null);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);
  const [isLoading, setIsLoading] = useState(false);
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [isControlsMenuOpen, setIsControlsMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isButtonVisible, setIsButtonVisible] = useState(true);

  const {
    currentTrack,
    isPlaying,
    volume,
    shuffle,
    repeat,
    duration,
    currentTime,
    isQueueVisible,
    queue,
    setIsPlaying,
    setVolume,
    setShuffle,
    setRepeat,
    setDuration,
    setCurrentTime,
    setQueueVisible,
    playNextTrack,
    playPreviousTrack,
  } = usePlayerStore();

  const [isMuted, setIsMuted] = useState(false);

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

  const handleVolumeChange = useCallback(
    (value: number) => {
      setVolume(value);
      if (audioRef.current) {
        audioRef.current.volume = value;
      }
    },
    [setVolume]
  );

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      audioRef.current.muted = newMuted;
    }
  }, [isMuted]);

  const handleSeek = useCallback(
    (value: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = value;
        setCurrentTime(value);
      }
    },
    [setCurrentTime]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (audioRef.current?.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, []);

  useEffect(() => {
    const initAudio = async () => {
      if (loadingRef.current) return;

      loadingRef.current = true;
      setIsLoading(true);

      try {
        if (!currentTrack?.id) {
          return;
        }

        const audioFile = await getAudioFile(currentTrack.id);
        if (!audioFile || !audioFile.file) {
          toast.error(
            `No audio file found for ${currentTrack.title}.\nAdd the file ${currentTrack.path} to play it.`
          );
          playNextTrack();
          return;
        }

        if (!mountedRef.current) {
          return;
        }

        currentFileRef.current = audioFile.file;

        if (!audioRef.current) {
          throw new Error("Audio element not initialized");
        }

        // Clean up previous URL if it exists
        if (audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src);
        }

        // Create new URL and set it
        const url = URL.createObjectURL(audioFile.file);
        audioRef.current.src = url;

        // Wait for the audio to be loaded
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
            console.error("Audio load error:", error);
            const audioError = audioRef.current?.error;
            reject(
              new Error(
                `Failed to load audio: ${
                  audioError?.message || "Unknown error"
                }`
              )
            );
          };

          audioRef.current.addEventListener("canplay", handleCanPlay, {
            once: true,
          });
          audioRef.current.addEventListener("error", handleError, {
            once: true,
          });

          // Force load
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

    initAudio();
  }, [currentTrack, setDuration, setIsPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (!audioRef.current || isLoading) return;

    if (isPlaying) {
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, isLoading, setIsPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack || isLoading || loadingRef.current) return;

    const handleEnded = () => {
      setIsPlaying(false);
      if (currentTrack) {
        incrementPlayCount(currentTrack.id);
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [currentTrack]);

  useEffect(() => {
    if (!isPlaying && !isButtonVisible) {
      const timeout = setTimeout(() => {
        setIsButtonVisible(true);
        // Add a small delay before removing animation class
        setTimeout(() => {
          setIsAnimating(false);
        }, 50);
      }, 200);

      return () => clearTimeout(timeout);
    }
  }, [isPlaying, isButtonVisible]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack || isLoading || loadingRef.current)
      return;

    setIsPlaying(!isPlaying);
  }, [currentTrack, isPlaying, isLoading]);

  const cleanup = useCallback(() => {
    if (currentFileRef.current) {
      URL.revokeObjectURL(URL.createObjectURL(currentFileRef.current));
      currentFileRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.load();
    }
  }, []);

  return (
    <div
      className={cn(
        queue.length === 0 && currentTrack
          ? "bg-red-600/40 dark:bg-red-500/50"
          : "bg-background/95"
      )}
    >
      <div
        className={cn(
          "border-t",
          queue.length === 0 &&
            currentTrack &&
            "border-red-500/70 dark:border-red-400/70"
        )}
      >
        <ProgressIndicator value={currentTime} max={duration} />
        <div className="container flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-4">
            <OpenPlayingQueueButton
              number={queue.length}
              onClick={() => setQueueVisible(!isQueueVisible)}
            />
            <CurrentSongInfo
              track={currentTrack}
              duration={duration}
              currentTime={currentTime}
            />
          </div>
          <div className="flex items-center gap-2">
            <PlayButton
              isPlaying={isPlaying}
              onClick={togglePlay}
              // disabled={
              //   !audioRef.current ||
              //   !currentTrack ||
              //   isLoading ||
              //   loadingRef.current
              // }
            />
            <OpenPlayerControlsButton
              onClick={() => setIsControlsMenuOpen(!isControlsMenuOpen)}
            />
          </div>
        </div>
      </div>

      {/* Player controls menu */}
      <PlayerControlsMenu
        isOpen={isControlsMenuOpen}
        onClose={() => setIsControlsMenuOpen(false)}
        audioRef={audioRef}
        isLoading={isLoading}
        isMuted={isMuted}
        toggleMute={toggleMute}
        handleVolumeChange={handleVolumeChange}
        handleSeek={handleSeek}
      />

      <audio
        ref={audioRef}
        id="main-audio"
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          if (repeat === "one") {
            audioRef.current?.play();
          } else {
            playNextTrack();
          }
        }}
      />
      {isQueueVisible && <PlayingQueue />}
    </div>
  );
};
