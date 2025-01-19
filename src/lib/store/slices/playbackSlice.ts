import { StateCreator } from 'zustand';
import { MusicMetadata } from '@/lib/types/types';

export interface PlaybackState {
  currentTrack: MusicMetadata | null;
  isPlaying: boolean;
  volume: number;
  duration: number;
  currentTime: number;
  repeat: "none" | "one" | "all";
  shuffle: boolean;
}

export interface PlaybackActions {
  setCurrentTrack: (track: MusicMetadata | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  setDuration: (duration: number) => void;
  setCurrentTime: (currentTime: number) => void;
  setRepeat: (repeat: PlaybackState["repeat"]) => void;
  setShuffle: (shuffle: boolean) => void;
}

export type PlaybackSlice = PlaybackState & PlaybackActions;

const initialPlaybackState: PlaybackState = {
  currentTrack: null,
  isPlaying: false,
  volume: 1,
  duration: 0,
  currentTime: 0,
  repeat: "none",
  shuffle: false,
};

export const createPlaybackSlice: StateCreator<PlaybackSlice> = (set) => ({
  ...initialPlaybackState,
  setCurrentTrack: (track) => set({ currentTrack: track }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume }),
  setDuration: (duration) => set({ duration }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setRepeat: (repeat) => set({ repeat }),
  setShuffle: (shuffle) => set({ shuffle }),
});
