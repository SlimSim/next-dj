import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { PlayerStore, PlayerState } from "./types/player";
import { createQueueActions, createPlaybackActions } from "./utils/playerActions";
import { MusicMetadata } from "./types/types";
import { clearHandles, storeHandle } from "@/db/handle-operations";

const initialState: PlayerState = {
  currentTrack: null,
  queue: [],
  history: [],
  isPlaying: false,
  volume: 1,
  shuffle: false,
  repeat: "none",
  duration: 0,
  currentTime: 0,
  isQueueVisible: false,
  refreshTrigger: 0,
  audioDevices: [],
  selectedDeviceId: "default",
  prelistenDeviceId: "default",
  prelistenTrack: null,
  isPrelistening: false,
  selectedFolderNames: [],
  prelistenDuration: 0,
};

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => {
      const queueActions = createQueueActions(set, get);
      const playbackActions = createPlaybackActions(set, get);

      return {
        ...initialState,
        ...queueActions,
        ...playbackActions,

        setPrelistenDuration: (duration) => set({ prelistenDuration: duration }),
        setCurrentTrack: (track: MusicMetadata | null) =>
          set({
            currentTrack: track
              ? { ...track, queueId: track.queueId || uuidv4() }
              : null,
          }),

        addToHistory: (track) =>
          set((state) => ({
            history: [
              ...state.history,
              { ...track, queueId: track.queueId || uuidv4() },
            ],
          })),

        removeFromHistory: (id) =>
          set((state) => ({
            history: state.history.filter((track) => track.queueId !== id),
          })),

        clearHistory: () => set({ history: [] }),
        setHistory: (history) => set({ history }),
        setIsPlaying: (isPlaying) => set({ isPlaying }),
        setVolume: (volume) => set({ volume }),
        setShuffle: (shuffle) => set({ shuffle }),
        setRepeat: (repeat) => set({ repeat }),
        setDuration: (duration) => set({ duration }),
        setCurrentTime: (currentTime) => set({ currentTime }),
        setQueueVisible: (isQueueVisible) => set({ isQueueVisible }),
        triggerRefresh: () =>
          set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),

        clearAll: () =>
          set((state) => {
            if (state.isPlaying && state.currentTrack) {
              return { queue: [], history: [] };
            } else {
              return {
                queue: [],
                history: [],
                currentTrack: null,
                isPlaying: false,
              };
            }
          }),

        setAudioDevices: (devices: MediaDeviceInfo[]) =>
          set({ audioDevices: devices }),
        setSelectedDeviceId: (deviceId: string) =>
          set({ selectedDeviceId: deviceId }),
        setPrelistenDeviceId: (deviceId: string) =>
          set({ prelistenDeviceId: deviceId }),
        setPrelistenTrack: (track: MusicMetadata | null) =>
          set({ prelistenTrack: track }),
        setIsPrelistening: (isPrelistening: boolean) => set({ isPrelistening }),

        addSelectedFolder: async (folderName: string, handle: FileSystemDirectoryHandle) => {
          await storeHandle(folderName, handle);
          set((state) => ({
            selectedFolderNames: [...state.selectedFolderNames, folderName],
          }));
        },

        clearSelectedFolders: () => {
          clearHandles();
          set({ selectedFolderNames: [] });
        },
      };
    },
    {
      name: "player-store",
      partialize: (state) => ({
        volume: state.volume,
        shuffle: state.shuffle,
        repeat: state.repeat,
        selectedDeviceId: state.selectedDeviceId,
        prelistenDeviceId: state.prelistenDeviceId,
        selectedFolderNames: state.selectedFolderNames,
      }),
    }
  )
);
