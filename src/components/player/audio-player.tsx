import { useEffect, useRef, useState } from "react";
import { useAudioPlayer } from "../../features/audio/hooks/useAudioPlayer";
import { useAudioControls } from "../../features/audio/hooks/useAudioControls";
import { usePlaybackControl } from "@/features/audio/playback/usePlaybackControl";
import { PlayerLayout } from "./player-layout";
import { usePlayerStore } from "@/lib/store";
import { recordPlayEvent } from "@/db/metadata-operations";
import { initializeEQ } from "@/features/audio/eq";
import { MusicMetadata } from "@/lib/types/types";
import { getAllMetadata } from "@/db/metadata-operations";
import { PlayerControlsMenu } from './player-controls-menu';
import { PlayingQueue } from './playing-queue';

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
    setCurrentTrack,
    setQueue,
    setHistory,
    history,
    isQueueVisible,
    isControlsMenuVisible
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
            recordPlayEvent(currentTrack.id)
              .then(async () => {
                // After recording the play event, refresh the track metadata
                // to ensure play counts are updated
                try {
                  const allMetadata = await getAllMetadata();
                  if (allMetadata) {
                    // Find updated metadata for current track
                    const updatedCurrentTrack = allMetadata.find(track => track.id === currentTrack.id);
                    
                    if (updatedCurrentTrack) {
                      // Update current track with fresh metadata
                      updateCurrentTrack(updatedCurrentTrack);
                      
                      // Also update any instances of this track in the queue or history
                      updateTrackInLists(updatedCurrentTrack);
                    }
                  }
                } catch (error) {
                  console.error("Error refreshing metadata after play:", error);
                }
              })
              .catch((error) => {
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

  // Function to update current track with fresh metadata
  const updateCurrentTrack = (updatedTrack: MusicMetadata) => {
    setCurrentTrack({
      ...currentTrack!,
      playCount: updatedTrack.playCount,
      lastPlayed: updatedTrack.lastPlayed,
      playHistory: updatedTrack.playHistory
    });
  };

  // Function to update a track in queue and history
  const updateTrackInLists = (updatedTrack: MusicMetadata) => {
    // Update in queue if present
    if (queue.some(track => track.id === updatedTrack.id)) {
      const updatedQueue = queue.map(track => 
        track.id === updatedTrack.id 
          ? { ...track, playCount: updatedTrack.playCount, lastPlayed: updatedTrack.lastPlayed, playHistory: updatedTrack.playHistory }
          : track
      );
      setQueue(updatedQueue);
    }

    // Update in history if present
    if (history.some(track => track.id === updatedTrack.id)) {
      const updatedHistory = history.map(track => 
        track.id === updatedTrack.id 
          ? { ...track, playCount: updatedTrack.playCount, lastPlayed: updatedTrack.lastPlayed, playHistory: updatedTrack.playHistory }
          : track
      );
      setHistory(updatedHistory);
    }
  };

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
        id="main-audio"
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        preload="auto"
        playsInline
      />
      
      {isControlsMenuVisible && (
        <PlayerControlsMenu
          audioRef={audioRef}
          isLoading={isLoading}
          isMuted={isMuted}
          toggleMute={toggleMute}
          handleVolumeChange={handleVolumeChange}
          handleSeek={handleSeek}
        />
      )}
      
      {isQueueVisible && (
        <PlayingQueue />
      )}
    </PlayerLayout>
  );
};

export default AudioPlayer;
