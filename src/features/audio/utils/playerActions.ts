import { v4 as uuidv4 } from "uuid";
import { PlayerState } from "@/lib/types/player";
import { MusicMetadata } from "@/lib/types/types";
import { AudioError, AudioErrorCode } from "./errorUtils";

export const createQueueActions = (set: any, get: () => PlayerState) => ({
  addToQueue: (track: MusicMetadata) =>
    set((state: PlayerState) => {
      if (!track) {
        throw new AudioError(
          'Cannot add invalid track to queue',
          AudioErrorCode.INVALID_AUDIO
        );
      }

      const trackWithId = { ...track, queueId: track.queueId || uuidv4() };
      
      if (!state.currentTrack) {
        return { currentTrack: trackWithId };
      }
      return { queue: [...state.queue, trackWithId] };
    }),

  removeFromQueue: (id: string) =>
    set((state: PlayerState) => {
      if (!id) {
        throw new AudioError(
          'Cannot remove track without ID from queue',
          AudioErrorCode.INVALID_AUDIO
        );
      }

      const newQueue = state.queue.filter((track) => track.queueId !== id);
      
      if (state.currentTrack?.queueId === id) {
        const nextTrack = newQueue[0] || null;
        if (!nextTrack && state.isPlaying) {
          throw new AudioError(
            'Cannot remove currently playing track without replacement',
            AudioErrorCode.PLAYBACK_FAILED
          );
        }
        return {
          queue: newQueue,
          currentTrack: nextTrack,
          isPlaying: nextTrack ? state.isPlaying : false,
        };
      }
      return { queue: newQueue };
    }),

  moveInQueue: (fromIndex: number, toIndex: number) =>
    set((state: PlayerState) => {
      if (fromIndex < 0 || toIndex < 0 || 
          fromIndex >= state.queue.length || 
          toIndex >= state.queue.length) {
        throw new AudioError(
          'Invalid queue position for move operation',
          AudioErrorCode.INVALID_AUDIO
        );
      }

      const newQueue = [...state.queue];
      const [movedItem] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, movedItem);
      return { queue: newQueue };
    }),

  clearQueue: () =>
    set((state: PlayerState) => {
      if (state.isPlaying) {
        throw new AudioError(
          'Cannot clear queue while track is playing',
          AudioErrorCode.PLAYBACK_FAILED
        );
      }
      return { 
        queue: [],
        currentTrack: null,
        isPlaying: false
      };
    }),

  setQueue: (queue: MusicMetadata[]) => {
    if (!Array.isArray(queue)) {
      throw new AudioError(
        'Invalid queue format',
        AudioErrorCode.INVALID_AUDIO
      );
    }
    set({ queue });
  }
});

export const createPlaybackActions = (set: any, get: () => PlayerState) => ({
  playNextTrack: () => {
    const { queue: currentQueue, currentTrack, shuffle, repeat, isPlaying } = get();
    
    console.log('Playback: PlayNextTrack called:', {
      currentTrack: currentTrack?.title,
      queueLength: currentQueue.length,
      nextTrack: currentQueue[0]?.title,
      shuffle,
      repeat,
      isPlaying
    });

    // Handle empty queue case
    if (!currentQueue.length) {
      console.log('Playback: Queue is empty, handling repeat logic');
      if (repeat === "all" && currentTrack) {
        const trackWithQueueId = { ...currentTrack, queueId: uuidv4() };
        console.log('Playback: Repeating all - recycling current track:', currentTrack.title);
        set({ 
          currentTrack: trackWithQueueId,
          history: currentTrack ? [...get().history, currentTrack] : get().history 
        });
      } else {
        console.log('Playback: No more tracks to play');
        set({ 
          currentTrack: null,
          history: currentTrack ? [...get().history, currentTrack] : get().history 
        });
      }
      return;
    }

    // Get next track based on shuffle setting
    let nextTrack;
    let newQueue;
    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * currentQueue.length);
      nextTrack = currentQueue[randomIndex];
      newQueue = [...currentQueue];
      newQueue.splice(randomIndex, 1);
      console.log('Playback: Shuffle mode - selected random track:', {
        selectedTrack: nextTrack.title,
        randomIndex,
        remainingQueueLength: newQueue.length
      });
    } else {
      [nextTrack, ...newQueue] = [...currentQueue];
      console.log('Playback: Normal mode - taking next track in queue:', {
        nextTrack: nextTrack.title,
        remainingQueueLength: newQueue.length
      });
    }

    console.log('Playback: Updating state with next track:', {
      newCurrentTrack: nextTrack.title,
      oldCurrentTrack: currentTrack?.title,
      newQueueLength: newQueue.length,
      historyLength: get().history.length + (currentTrack ? 1 : 0)
    });

    // Update all state in a single operation
    set({ 
      currentTrack: nextTrack, 
      queue: newQueue,
      history: currentTrack ? [...get().history, currentTrack] : get().history 
    });
  },

  playPreviousTrack: () => {
    const { history, currentTrack, queue, isPlaying } = get();
    console.log('Playback: PlayPreviousTrack called:', {
      historyLength: history.length,
      currentTrack: currentTrack?.title,
      queueLength: queue.length
    });

    if (!history.length) return;

    const previousTrack = history[history.length - 1];
    const newHistory = history.slice(0, -1);

    console.log('Playback: Moving to previous track:', {
      previousTrack: previousTrack.title,
      newHistoryLength: newHistory.length,
      currentTrackMovingToQueue: currentTrack?.title
    });

    if (currentTrack) {
      const trackWithQueueId = { ...currentTrack, queueId: uuidv4() };
      set((state: PlayerState) => ({
        queue: [trackWithQueueId, ...state.queue],
        history: newHistory,
        currentTrack: previousTrack
      }));
    } else {
      set({
        history: newHistory,
        currentTrack: previousTrack
      });
    }
  },
});
