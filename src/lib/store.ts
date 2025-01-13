import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { PlayerStore, PlayerState, SongList } from "./types/player";
import { MusicMetadata } from "./types/types";
import {
  createQueueActions,
  createPlaybackActions,
} from "../features/audio/utils/playerActions";
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
  selectedDeviceId: "",
  prelistenDeviceId: "",
  prelistenTrack: null,
  isPrelistening: false,
  selectedFolderNames: [],
  prelistenDuration: 0,
  showPreListenButtons: true,
  recentPlayHours: 0,
  monthlyPlayDays: 0,
  hasShownPreListenWarning: false,
  searchQuery: "",
  sortField: "title",
  sortOrder: "asc",
  filters: {},
  showFilters: true,
  songLists: [],
  showLists: false,
  selectedListId: null,
  metadata: [], // Store all track metadata
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
        setShowPreListenButtons: (show: boolean) =>
          set({ showPreListenButtons: show }),
        setRecentPlayHours: (hours: number) => set({ recentPlayHours: hours }),
        setMonthlyPlayDays: (days: number) => set({ monthlyPlayDays: days }),
        setHasShownPreListenWarning: (shown: boolean) =>
          set({ hasShownPreListenWarning: shown }),
        setSearchQuery: (query) => set({ searchQuery: query }),
        setSortField: (field) => set({ sortField: field }),
        setSortOrder: (order) => set({ sortOrder: order }),
        setFilters: (filters) => set({ filters: filters }),
        toggleFilters: () =>
          set((state) => ({ showFilters: !state.showFilters })),
        toggleLists: () => set((state) => ({ showLists: !state.showLists })),
        addSongList: (name) =>
          set((state) => ({
            songLists: [
              ...state.songLists,
              {
                id: crypto.randomUUID(),
                name,
                songs: [],
                created: Date.now(),
                modified: Date.now(),
              },
            ],
          })),
        removeSongList: (id) =>
          set((state) => ({
            songLists: state.songLists.filter((list) => list.id !== id),
          })),
        addSongToList: (listId, songPath) =>
          set((state) => ({
            songLists: state.songLists.map((list) =>
              list.id === listId
                ? {
                    ...list,
                    songs: [...new Set([...list.songs, songPath])],
                    modified: Date.now(),
                  }
                : list
            ),
          })),
        removeSongFromList: (listId, songPath) =>
          set((state) => ({
            songLists: state.songLists.map((list) =>
              list.id === listId
                ? {
                    ...list,
                    songs: list.songs.filter((path) => path !== songPath),
                    modified: Date.now(),
                  }
                : list
            ),
          })),
        renameSongList: (id, name) =>
          set((state) => ({
            songLists: state.songLists.map((list) =>
              list.id === id
                ? {
                    ...list,
                    name,
                    modified: Date.now(),
                  }
                : list
            ),
          })),
        setSelectedListId: (id) => set({ selectedListId: id }),

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

        updateTrackMetadata: (
          trackId: string,
          updates: Partial<MusicMetadata> & { __volumeOnly?: boolean }
        ) =>
          set((state) => {
            console.log("Updating metadata:", { trackId, updates });

            // Create a new metadata array with updates
            const metadata = state.metadata.map((track) =>
              track.id === trackId ? { ...track, ...updates } : track
            );

            // Check if this is a volume-only update
            const isVolumeUpdate = updates.__volumeOnly === true;
            console.log("Is volume-only update:", isVolumeUpdate);

            // Remove internal flag before applying updates
            const cleanUpdates = { ...updates };
            delete cleanUpdates.__volumeOnly;

            // Update currentTrack
            let currentTrack = state.currentTrack;
            if (state.currentTrack?.id === trackId) {
              if (isVolumeUpdate) {
                // Modify volume in place without creating a new reference
                currentTrack = state.currentTrack;
                currentTrack.volume = cleanUpdates.volume;
              } else {
                // Create new reference for other updates
                currentTrack = {
                  ...state.currentTrack,
                  ...cleanUpdates,
                  path: state.currentTrack.path,
                  id: state.currentTrack.id,
                };
              }
            }

            // Update prelistenTrack similarly
            let prelistenTrack = state.prelistenTrack;
            if (state.prelistenTrack?.id === trackId) {
              if (isVolumeUpdate) {
                // Modify volume in place without creating a new reference
                prelistenTrack = state.prelistenTrack;
                prelistenTrack.volume = cleanUpdates.volume;
              } else {
                // Create new reference for other updates
                prelistenTrack = {
                  ...state.prelistenTrack,
                  ...cleanUpdates,
                  path: state.prelistenTrack.path,
                  id: state.prelistenTrack.id,
                };
              }
            }

            return {
              metadata,
              currentTrack,
              prelistenTrack,
            };
          }),
      };
    },
    {
      name: "player-storage",
      partialize: (state) => ({
        currentTrack: state.currentTrack,
        queue: state.queue,
        history: state.history,
        volume: state.volume,
        shuffle: state.shuffle,
        repeat: state.repeat,
        selectedFolderNames: state.selectedFolderNames,
        showPreListenButtons: state.showPreListenButtons,
        recentPlayHours: state.recentPlayHours,
        monthlyPlayDays: state.monthlyPlayDays,
        searchQuery: state.searchQuery,
        sortField: state.sortField,
        sortOrder: state.sortOrder,
        filters: state.filters,
        showFilters: state.showFilters,
        songLists: state.songLists,
        showLists: state.showLists,
        selectedListId: state.selectedListId,
        metadata: state.metadata,
      }),
    }
  )
);
