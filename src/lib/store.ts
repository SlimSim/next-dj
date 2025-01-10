import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { PlayerStore, PlayerState } from "./types/player";
import {
  createQueueActions,
  createPlaybackActions,
} from "../features/audio/utils/playerActions";
import { MusicMetadata } from "./types/types";
import { clearHandles, storeHandle } from "@/db/handle-operations";
import { initMusicDB } from "@/db/schema";
import { getRemovedSongs, deleteAudioFile } from "@/db/audio-operations";

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
  showPreListenButtons: true,
  recentPlayHours: 18,
  monthlyPlayDays: 42,
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

        setPrelistenDuration: (duration) =>
          set({ prelistenDuration: duration }),
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
        setShowPreListenButtons: (show: boolean) => set({ showPreListenButtons: show }),
        setRecentPlayHours: (hours: number) => set({ recentPlayHours: hours }),
        setMonthlyPlayDays: (days: number) => set({ monthlyPlayDays: days }),

        addSelectedFolder: async (
          folderName: string,
          handle: FileSystemDirectoryHandle
        ) => {
          await storeHandle(folderName, handle);
          set((state) => ({
            selectedFolderNames: [...state.selectedFolderNames, folderName],
          }));
        },

        removeFolder: async (folderName: string) => {
          const db = await initMusicDB();

          // Remove the folder handle
          const handlesTx = db.transaction(["handles"], "readwrite");
          const handlesStore = handlesTx.objectStore("handles");
          await handlesStore.delete(folderName);

          // Mark all songs from this folder as removed
          const metadataTx = db.transaction(["metadata"], "readwrite");
          const metadataStore = metadataTx.objectStore("metadata");
          const allMetadata = await metadataStore.getAll();

          const folderParts = folderName.split(/[\\/]/); // Split on both forward and back slashes
          const folderBaseName = folderParts[folderParts.length - 1];

          for (const metadata of allMetadata) {
            if (metadata.path) {
              // The stored path is relative to the folder, so it should start with the folder's base name
              const normalizedPath = metadata.path.replace(/\\/g, "/");
              const pathParts = normalizedPath.split("/");

              // Check if this file belongs to the folder we're removing
              if (pathParts[0] === folderBaseName) {
                metadata.removed = true;
                await metadataStore.put(metadata);
              }
            }
          }

          // Remove from state and trigger refresh
          set((state) => ({
            selectedFolderNames: state.selectedFolderNames.filter(
              (name) => name !== folderName
            ),
          }));

          // Trigger refresh to update the song list
          set((state) => ({
            refreshTrigger: state.refreshTrigger + 1,
          }));
        },

        removeRemovedSongs: async () => {
          const removedSongs = await getRemovedSongs();
          const removedIds = removedSongs.map((song) => song.queueId);

          set((state) => ({
            queue: state.queue.filter(
              (track) => !removedIds.includes(track.queueId)
            ),
            history: state.history.filter(
              (track) => !removedIds.includes(track.queueId)
            ),
          }));

          // Optionally, remove these entries from the database
          for (const song of removedSongs) {
            await deleteAudioFile(song.id);
          }

          get().triggerRefresh();
        },

        clearSelectedFolders: async () => {
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
        queue: state.queue,
        history: state.history,
        currentTrack: state.currentTrack,
        isQueueVisible: state.isQueueVisible,
        showPreListenButtons: state.showPreListenButtons,
        recentPlayHours: state.recentPlayHours,
        monthlyPlayDays: state.monthlyPlayDays,
      }),
    }
  )
);
