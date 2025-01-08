import { MusicMetadata } from "./types";

export interface PlayerState {
  currentTrack: MusicMetadata | null;
  queue: MusicMetadata[];
  history: MusicMetadata[];
  isPlaying: boolean;
  volume: number;
  shuffle: boolean;
  repeat: "none" | "one" | "all";
  duration: number;
  currentTime: number;
  isQueueVisible: boolean;
  refreshTrigger: number;
  audioDevices: MediaDeviceInfo[];
  selectedDeviceId: string;
  prelistenDeviceId: string;
  prelistenTrack: MusicMetadata | null;
  isPrelistening: boolean;
  prelistenDuration: number;
  selectedFolderNames: string[];
}

export interface PlayerActions {
  setPrelistenDuration: (duration: number) => void;
  setCurrentTrack: (track: MusicMetadata | null) => void;
  addToQueue: (track: MusicMetadata) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  setQueue: (queue: MusicMetadata[]) => void;
  moveInQueue: (fromIndex: number, toIndex: number) => void;
  addToHistory: (track: MusicMetadata) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  setHistory: (history: MusicMetadata[]) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  setShuffle: (shuffle: boolean) => void;
  setRepeat: (repeat: "none" | "one" | "all") => void;
  setDuration: (duration: number) => void;
  setCurrentTime: (currentTime: number) => void;
  setQueueVisible: (isQueueVisible: boolean) => void;
  playNextTrack: () => void;
  playPreviousTrack: () => void;
  triggerRefresh: () => void;
  clearAll: () => void;
  setAudioDevices: (devices: MediaDeviceInfo[]) => void;
  setSelectedDeviceId: (deviceId: string) => void;
  setPrelistenDeviceId: (deviceId: string) => void;
  setPrelistenTrack: (track: MusicMetadata | null) => void;
  setIsPrelistening: (isPrelistening: boolean) => void;
  removeRemovedSongs: () => Promise<void>;
  addSelectedFolder: (
    folderName: string,
    handle: FileSystemDirectoryHandle
  ) => void;
  removeFolder: (folderName: string) => void;
  clearSelectedFolders: () => void;
}

export type PlayerStore = PlayerState & PlayerActions;
