import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { PlayerStore, PlayerState, SongList } from "./types/player";
import { MusicMetadata } from "./types/types";
import { CustomMetadataState, CustomMetadataField } from './types/customMetadata';
import { StandardMetadataField } from './types/settings';
import {
  createQueueActions,
  createPlaybackActions,
} from "../features/audio/utils/playerActions";
import { clearHandles, storeHandle } from "@/db/handle-operations";
import { initMusicDB } from "@/db/schema";
import { getRemovedSongs, deleteAudioFile, getAllMetadata } from "@/db/audio-operations";
import { FilterCriteria } from "@/components/player/playlist-controls";

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
  customMetadata: {
    fields: [],
  },
  standardMetadataFields: [
    {
      id: 'artist',
      name: 'Artist',
      key: 'artist',
      showInFilter: true,
      showInList: true,
      showInSearch: true,
    },
    {
      id: 'album',
      name: 'Album',
      key: 'album',
      showInFilter: true,
      showInList: true,
      showInSearch: true,
    },
    {
      id: 'genre',
      name: 'Genre',
      key: 'genre',
      showInFilter: true,
      showInList: true,
      showInSearch: false,
    },
    {
      id: 'track',
      name: 'Track #',
      key: 'track',
      showInFilter: false,
      showInList: true,
      showInSearch: false,
    },
    {
      id: 'year',
      name: 'Year',
      key: 'year',
      showInFilter: false,
      showInList: true,
      showInSearch: false,
    },
    {
      id: 'comment',
      name: 'Comment',
      key: 'comment',
      showInFilter: false,
      showInList: true,
      showInSearch: false,
    },
  ],
};

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => {
      const queueActions = createQueueActions(set, get);
      const playbackActions = createPlaybackActions(set, get);

      // Only try to initialize metadata in browser environment
      if (typeof window !== 'undefined') {
        // Delay metadata loading to ensure it runs after hydration
        Promise.resolve().then(() => {
          getAllMetadata()
            .then((metadata) => {
              set({ metadata });
            })
            .catch(console.error);
        });
      }

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
          updates: Partial<MusicMetadata> & { __volumeOnly?: boolean; __preserveRef?: boolean }
        ) => {
          set((state) => {
            const trackIndex = state.metadata.findIndex((t) => t.id === trackId);
            if (trackIndex === -1) return state;

            const updatedMetadata = [...state.metadata];
            if (updates.__volumeOnly) {
              // Only update volume
              updatedMetadata[trackIndex] = {
                ...updatedMetadata[trackIndex],
                volume: updates.volume,
              };
            } else if (updates.__preserveRef) {
              // Preserve the reference but update fields
              Object.assign(updatedMetadata[trackIndex], updates);
            } else {
              // Create new reference with all updates
              updatedMetadata[trackIndex] = {
                ...updatedMetadata[trackIndex],
                ...updates,
              };
            }

            // Update current track if it's the same
            const currentTrack =
              state.currentTrack?.id === trackId
                ? { ...state.currentTrack, ...updates }
                : state.currentTrack;

            // Update prelisten track if it's the same
            const prelistenTrack =
              state.prelistenTrack?.id === trackId
                ? { ...state.prelistenTrack, ...updates }
                : state.prelistenTrack;

            return {
              metadata: updatedMetadata,
              currentTrack,
              prelistenTrack,
            };
          });
        },
        addCustomMetadataField: (field: { id: string; name: string; type: 'text' }) =>
          set((state) => ({
            customMetadata: {
              fields: [
                ...state.customMetadata.fields,
                { 
                  ...field, 
                  showInFilter: true,  // Default to showing in filter
                  showInList: true,    // Default to showing in list
                }
              ],
            },
          })),
        toggleCustomMetadataFilter: (fieldId: string) =>
          set((state) => ({
            customMetadata: {
              fields: state.customMetadata.fields.map(field =>
                field.id === fieldId
                  ? { ...field, showInFilter: !field.showInFilter }
                  : field
              ),
            },
          })),
        toggleCustomMetadataVisibility: (fieldId: string) =>
          set((state) => ({
            customMetadata: {
              fields: state.customMetadata.fields.map(field =>
                field.id === fieldId
                  ? { ...field, showInList: !field.showInList }
                  : field
              ),
            },
          })),
        removeCustomMetadataField: (fieldId: string) =>
          set((state) => {
            // Remove the field's filter if it exists
            const customKey = `custom_${fieldId}` as const;
            const updatedFilters = { ...state.filters } as FilterCriteria;
            const typedKey = customKey as keyof typeof updatedFilters;
            delete updatedFilters[typedKey];

            return {
              customMetadata: {
                ...state.customMetadata,
                fields: state.customMetadata.fields.filter(field => field.id !== fieldId),
              },
              // Update filters to remove the deleted field's filter
              filters: updatedFilters,
            };
          }),
        renameCustomMetadataField: (fieldId: string, newName: string) =>
          set((state) => ({
            customMetadata: {
              fields: state.customMetadata.fields.map(field =>
                field.id === fieldId
                  ? { ...field, name: newName.trim() }
                  : field
              ),
            },
          })),
        reorderCustomMetadataFields: (oldIndex: number, newIndex: number) =>
          set((state) => {
            const fields = [...state.customMetadata.fields];
            const [movedField] = fields.splice(oldIndex, 1);
            fields.splice(newIndex, 0, movedField);
            return {
              customMetadata: {
                ...state.customMetadata,
                fields,
              },
            };
          }),
        toggleStandardMetadataFilter: (fieldId: string) =>
          set((state) => ({
            standardMetadataFields: state.standardMetadataFields.map(field =>
              field.id === fieldId
                ? { ...field, showInFilter: !field.showInFilter }
                : field
            ),
          })),
        toggleStandardMetadataVisibility: (fieldId: string) =>
          set((state) => ({
            standardMetadataFields: state.standardMetadataFields.map(field =>
              field.id === fieldId
                ? { ...field, showInList: !field.showInList }
                : field
            ),
          })),
        toggleStandardMetadataSearch: (fieldId: string) =>
          set((state) => ({
            standardMetadataFields: state.standardMetadataFields.map((field) =>
              field.id === fieldId && field.key !== 'title'
                ? { ...field, showInSearch: !field.showInSearch }
                : field
            ),
          })),
        reorderStandardMetadataFields: (oldIndex: number, newIndex: number) =>
          set((state) => {
            const fields = [...state.standardMetadataFields];
            const [movedField] = fields.splice(oldIndex, 1);
            fields.splice(newIndex, 0, movedField);
            return {
              standardMetadataFields: fields,
            };
          }),
      };
    },
    {
      name: "player-storage",
      partialize: (state) => ({
        selectedFolderNames: state.selectedFolderNames,
        selectedDeviceId: state.selectedDeviceId,
        prelistenDeviceId: state.prelistenDeviceId,
        showPreListenButtons: state.showPreListenButtons,
        recentPlayHours: state.recentPlayHours,
        monthlyPlayDays: state.monthlyPlayDays,
        hasShownPreListenWarning: state.hasShownPreListenWarning,
        sortField: state.sortField,
        sortOrder: state.sortOrder,
        filters: state.filters,
        showFilters: state.showFilters,
        songLists: state.songLists,
        showLists: state.showLists,
        selectedListId: state.selectedListId,
        metadata: state.metadata,
        customMetadata: state.customMetadata,
        standardMetadataFields: state.standardMetadataFields,
      }),
      onRehydrateStorage: () => (state) => {
        // Ensure all standard metadata fields exist with default values
        if (state) {
          const existingFields = state.standardMetadataFields || [];
          const existingFieldKeys = new Set(existingFields.map(f => f.key));
          
          // Add any missing fields from initialState
          const missingFields = initialState.standardMetadataFields.filter(
            field => !existingFieldKeys.has(field.key)
          );
          
          if (missingFields.length > 0) {
            state.standardMetadataFields = [...existingFields, ...missingFields];
          }
        }
      },
    }
  )
);
