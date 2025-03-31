import { useCallback } from 'react';
import { usePlayerStore } from '@/lib/store';
import { MusicMetadata } from '@/lib/types/types';
import { AudioError, AudioErrorCode } from '../utils/errorUtils';
import { PlaybackControls, PlaybackState } from './types';

/**
 * Hook for managing the core playback functionality of the main player
 * Handles track switching, play/pause, and playback state
 */
export const usePlaybackControl = (): PlaybackControls => {
  const {
    currentTrack,
    queue,
    history,
    isPlaying,
    shuffle,
    repeat,
    setCurrentTrack,
    setIsPlaying,
    addToHistory,
    setQueue,
  } = usePlayerStore();

  const playNextTrack = useCallback(() => {
    if (!currentTrack) {
      throw new AudioError(
        'No track is currently playing',
        AudioErrorCode.INVALID_AUDIO
      );
    }

    // Add current track to history
    addToHistory(currentTrack);

    if (repeat === 'one') {
      // Replay the current track
      setCurrentTrack({ ...currentTrack });
      return;
    }

    let nextTrack: MusicMetadata | null = null;

    if (shuffle) {
      // Get random track from queue
      const randomIndex = Math.floor(Math.random() * queue.length);
      nextTrack = queue[randomIndex];
      // Remove the selected track from queue
      const newQueue = [...queue];
      newQueue.splice(randomIndex, 1);
      setQueue(newQueue);
    } else {
      // Get next track in order
      nextTrack = queue[0];
      // Remove it from queue
      setQueue(queue.slice(1));
    }

    if (!nextTrack && repeat === 'all' && queue.length === 0) {
      // If repeating all and queue is empty, add history back to queue
      setQueue(history.reverse());
      nextTrack = queue[0];
      setQueue(queue.slice(1));
    }

    setCurrentTrack(nextTrack);
    if (!nextTrack) {
      setIsPlaying(false);
    }
  }, [currentTrack, queue, history, shuffle, repeat, setCurrentTrack, setIsPlaying, addToHistory, setQueue]);

  const playPreviousTrack = useCallback(() => {
    if (!currentTrack) {
      throw new AudioError(
        'No track is currently playing',
        AudioErrorCode.INVALID_AUDIO
      );
    }

    const previousTrack = history[history.length - 1] || null;
    if (previousTrack) {
      setCurrentTrack(previousTrack);
      // Remove from history
      const newHistory = history.slice(0, -1);
      usePlayerStore.setState({ history: newHistory });
    }
  }, [currentTrack, history, setCurrentTrack]);

  const togglePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying, setIsPlaying]);

  const setTrack = useCallback((track: MusicMetadata | null) => {
    setCurrentTrack(track);
  }, [setCurrentTrack]);

  return {
    playNextTrack,
    playPreviousTrack,
    togglePlay,
    setTrack,
  };
};
