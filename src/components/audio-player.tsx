import { useEffect } from "react";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { useAudioControls } from "../hooks/useAudioControls";
import { PlayerLayout } from "./player-layout";
import { usePlayerStore } from "@/lib/store";

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

    if (isPlaying) {
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, isLoading, setIsPlaying]);

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
