import { v4 as uuidv4 } from "uuid";
import { PlayerState } from "../../../lib/types/player";
import { MusicMetadata } from "../../../lib/types/types";

export const createQueueActions = (set: any, get: () => PlayerState) => ({
  addToQueue: (track: MusicMetadata) =>
    set((state: PlayerState) => {
      const trackWithId = { ...track, queueId: track.queueId || uuidv4() };
      if (!state.currentTrack) {
        return { currentTrack: trackWithId };
      }
      return { queue: [...state.queue, trackWithId] };
    }),

  removeFromQueue: (id: string) =>
    set((state: PlayerState) => {
      const newQueue = state.queue.filter((track) => track.queueId !== id);
      if (state.currentTrack?.queueId === id) {
        const nextTrack = newQueue[0] || null;
        return {
          queue: newQueue,
          currentTrack: nextTrack,
          isPlaying: nextTrack ? state.isPlaying : false,
        };
      }
      return { queue: newQueue };
    }),

  clearQueue: () =>
    set((state: PlayerState) => ({
      queue: state.currentTrack ? [state.currentTrack] : [],
    })),

  setQueue: (queue: MusicMetadata[]) => set({ queue }),

  moveInQueue: (fromIndex: number, toIndex: number) =>
    set((state: PlayerState) => {
      const newQueue = [...state.queue];
      const [removed] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, removed);
      return { queue: newQueue };
    }),
});

export const createPlaybackActions = (set: any, get: () => PlayerState) => ({
  playNextTrack: () => {
    const { queue: currentQueue, currentTrack, shuffle, repeat } = get();

    // Handle empty queue case
    if (!currentQueue.length) {
      if (repeat === "all" && currentTrack) {
        const trackWithQueueId = { ...currentTrack, queueId: uuidv4() };
        set({
          currentTrack: trackWithQueueId,
          isPlaying: true,
          history: currentTrack ? [...get().history, currentTrack] : get().history,
        });
      } else {
        set({
          currentTrack: null,
          isPlaying: false,
          history: currentTrack ? [...get().history, currentTrack] : get().history,
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
    } else {
      [nextTrack, ...newQueue] = [...currentQueue];
    }

    // Update all state in a single operation
    set({
      currentTrack: nextTrack,
      queue: newQueue,
      isPlaying: true,
      history: currentTrack ? [...get().history, currentTrack] : get().history,
    });
  },

  playPreviousTrack: () => {
    const { history, currentTrack, queue } = get();
    if (!history.length) return;

    const previousTrack = history[history.length - 1];
    const newHistory = history.slice(0, -1);

    if (currentTrack) {
      const trackWithQueueId = { ...currentTrack, queueId: uuidv4() };
      set((state: PlayerState) => ({
        queue: [trackWithQueueId, ...state.queue],
        history: newHistory,
        currentTrack: previousTrack,
        isPlaying: true,
      }));
    } else {
      set({
        currentTrack: previousTrack,
        history: newHistory,
        isPlaying: true,
      });
    }
  },
});
