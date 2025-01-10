import { useEffect, useRef } from "react";
import { useAudioPlayer } from "../../features/audio/hooks/useAudioPlayer";
import { useAudioControls } from "../../features/audio/hooks/useAudioControls";
import { PlayerLayout } from "./player-layout";
import { usePlayerStore } from "@/lib/store";
import { recordPlayEvent } from "@/db/metadata-operations";

export const AudioPlayer = () => {
  const {
    audioRef,
    isLoading,
    handleTimeUpdate,
    handleLoadedMetadata,
    initAudio,
    mountedRef,
  } = useAudioPlayer();

  const { isMuted, handleVolumeChange, toggleMute, handleSeek, togglePlay } =
    useAudioControls(audioRef, isLoading);

  const {
    currentTrack,
    isPlaying,
    repeat,
    duration,
    currentTime,
    isQueueVisible,
    queue,
    setIsPlaying,
    setQueueVisible,
    playNextTrack,
  } = usePlayerStore();

  const lastTrackRef = useRef<string | null>(null);

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
    initAudio();
  }, [currentTrack]);

  useEffect(() => {
    if (!audioRef.current || isLoading) return;

    if (isPlaying && currentTrack) {
      audioRef.current
        .play()
        .then(() => {
          // Only record play event for main player, not pre-listen
          // And only when the track changes (not when auto-playing next track)
          if (currentTrack.id !== lastTrackRef.current) {
            recordPlayEvent(currentTrack.id).catch((error) => {
              console.error("Error recording play event:", error);
            });
            lastTrackRef.current = currentTrack.id;
          }
        })
        .catch((error) => {
          console.error("Error playing audio:", error);
          setIsPlaying(false);
        });
    } else {
      audioRef.current.pause();
      // Reset lastTrackRef when paused so next play will record
      lastTrackRef.current = null;
    }
  }, [isPlaying, isLoading, setIsPlaying, currentTrack]);

  return (
    <PlayerLayout
      audioRef={audioRef}
      queue={queue}
      currentTrack={currentTrack}
      isQueueVisible={isQueueVisible}
      setQueueVisible={setQueueVisible}
      currentTime={currentTime}
      duration={duration}
      isPlaying={isPlaying}
      isLoading={isLoading}
      togglePlay={togglePlay}
      handleVolumeChange={handleVolumeChange}
      handleSeek={handleSeek}
      toggleMute={toggleMute}
      isMuted={isMuted}
    >
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
    </PlayerLayout>
  );
};
