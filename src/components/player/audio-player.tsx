import { useEffect, useRef } from "react";
import { useAudioPlayer } from "../../features/audio/hooks/useAudioPlayer";
import { useAudioControls } from "../../features/audio/hooks/useAudioControls";
import { usePlaybackControl } from "@/features/audio/playback/usePlaybackControl";
import { PlayerLayout } from "./player-layout";
import { usePlayerStore } from "@/lib/store";
import { recordPlayEvent } from "@/db/metadata-operations";
import { initializeEQ } from "@/features/audio/eq";

export const AudioPlayer = () => {
  const {
    audioRef,
    isLoading,
    handleTimeUpdate,
    handleLoadedMetadata,
    mountedRef,
  } = useAudioPlayer();

  const { isMuted, handleVolumeChange, toggleMute, handleSeek, togglePlay } =
    useAudioControls(audioRef, isLoading);

  const { playNextTrack } = usePlaybackControl();

  const {
    currentTrack,
    isPlaying,
    repeat,
    duration,
    currentTime,
    queue,
    setIsPlaying,
  } = usePlayerStore();

  const lastTrackRef = useRef<string | null>(null);

  useEffect(() => {
    if (audioRef.current?.src) {
      URL.revokeObjectURL(audioRef.current.src);
    }
  }, []);

  useEffect(() => {
    if (!audioRef.current || isLoading) {
      console.log('AudioPlayer: Skip play/pause - audio not ready:', { 
        hasAudioRef: !!audioRef.current, 
        isLoading 
      });
      return;
    }

    if (isPlaying && currentTrack) {
      console.log('AudioPlayer: Attempting to play:', { 
        trackId: currentTrack.id,
        trackTitle: currentTrack.title,
        audioSrc: audioRef.current.src
      });
      
      audioRef.current
        .play()
        .then(() => {
          console.log('AudioPlayer: Playback started successfully');
          if (currentTrack.id !== lastTrackRef.current) {
            recordPlayEvent(currentTrack.id).catch((error) => {
              console.error("Error recording play event:", error);
            });
            lastTrackRef.current = currentTrack.id;
          }
        })
        .catch((error) => {
          console.error("Error playing audio:", error);
          console.log('AudioPlayer: Play error details:', { 
            errorName: error.name,
            errorMessage: error.message,
            trackId: currentTrack.id
          });
          setIsPlaying(false);
        });
    } else {
      console.log('AudioPlayer: Pausing playback:', { 
        isPlaying, 
        hasCurrentTrack: !!currentTrack 
      });
      audioRef.current.pause();
      lastTrackRef.current = null;
    }
  }, [isPlaying, isLoading, setIsPlaying, currentTrack]);

  // Initialize EQ as soon as audio element is available
  useEffect(() => {
    if (audioRef.current) {
      // Only initialize EQ when we have a track loaded and playing
      if (currentTrack && isPlaying) {
        initializeEQ(audioRef.current).catch(error => {
          console.error('Failed to initialize EQ:', error);
        });
      }
    }
  }, [currentTrack, isPlaying]);

  // Update EQ when track changes
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      initializeEQ(audioRef.current).catch(error => {
        console.error('Failed to initialize EQ:', error);
      });
    }
  }, [currentTrack]);

  return (
    <PlayerLayout
      audioRef={audioRef}
      queue={queue}
      currentTrack={currentTrack}
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
      />
    </PlayerLayout>
  );
};
