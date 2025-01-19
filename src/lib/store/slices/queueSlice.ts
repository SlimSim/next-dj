import { StateCreator } from 'zustand';
import { MusicMetadata } from '@/lib/types/types';

export interface QueueState {
  queue: MusicMetadata[];
  history: MusicMetadata[];
  isQueueVisible: boolean;
}

export interface QueueActions {
  addToQueue: (track: MusicMetadata) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  setQueue: (queue: MusicMetadata[]) => void;
  moveInQueue: (fromIndex: number, toIndex: number) => void;
  playNextTrack: () => void;
  playPreviousTrack: () => void;
  addToHistory: (track: MusicMetadata) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  setHistory: (history: MusicMetadata[]) => void;
  setQueueVisible: (isQueueVisible: boolean) => void;
}

export type QueueSlice = QueueState & QueueActions;

const initialQueueState: QueueState = {
  queue: [],
  history: [],
  isQueueVisible: false,
};

export const createQueueSlice: StateCreator<
  QueueSlice & { currentTrack: MusicMetadata | null; isPlaying: boolean },
  [],
  [],
  QueueSlice
> = (set, get) => ({
  ...initialQueueState,
  addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),
  removeFromQueue: (id) => set((state) => ({ 
    queue: state.queue.filter((track) => track.id !== id) 
  })),
  clearQueue: () => set({ queue: [] }),
  setQueue: (queue) => set({ queue }),
  moveInQueue: (fromIndex, toIndex) => set((state) => {
    const newQueue = [...state.queue];
    const [movedItem] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, movedItem);
    return { queue: newQueue };
  }),
  playNextTrack: () => {
    const state = get();
    const currentIndex = state.queue.findIndex((track) => track.id === state.currentTrack?.id);
    const nextIndex = currentIndex + 1;
    
    // Set the next track if available, maintaining the current playing state
    if (nextIndex < state.queue.length) {
      set({ currentTrack: state.queue[nextIndex] });
    } else {
      set({ currentTrack: null, isPlaying: false });
    }
  },
  playPreviousTrack: () => {
    const state = get();
    const currentIndex = state.queue.findIndex((track) => track.id === state.currentTrack?.id);
    const prevIndex = currentIndex - 1;
    
    // Set the previous track if available, maintaining the current playing state
    if (prevIndex >= 0) {
      set({ currentTrack: state.queue[prevIndex] });
    } else {
      set({ currentTrack: null, isPlaying: false });
    }
  },
  addToHistory: (track) => set((state) => ({ 
    history: [...state.history, track] 
  })),
  removeFromHistory: (id) => set((state) => ({ 
    history: state.history.filter((track) => track.id !== id) 
  })),
  clearHistory: () => set({ history: [] }),
  setHistory: (history) => set({ history }),
  setQueueVisible: (isQueueVisible) => set({ isQueueVisible }),
});
