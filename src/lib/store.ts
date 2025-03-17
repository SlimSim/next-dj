import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import { PlayerStore, PlayerState, SongList } from "./types/player";
import { MusicMetadata } from "./types/types";
import { CustomMetadataState, CustomMetadataField } from './types/customMetadata';
import { StandardMetadataField } from './types/settings';
import { AudioError, AudioErrorCode } from "@/features/audio/types";
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
  eqValues: {
    a: 70,
    b: 70,
    c: 70,
    d: 70,
    e: 70,
  },
  eqMode: '5-band',
  use5BandEQ: true,
  isQueueVisible: false,
  isControlsMenuVisible: false,
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
  practiceMode: false,
  // Track selection state
  selectedTracks: [] as string[],
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
        setEQValue: (key: 'a' | 'b' | 'c' | 'd' | 'e', value: number) =>
          set((state) => ({
            eqValues: {
              ...state.eqValues,
              [key]: value,
            },
          })),
        setEQMode: (mode) => set({ eqMode: mode }),
        setUse5BandEQ: (enabled) => {
          set((state) => ({
            use5BandEQ: enabled,
            // When enabling 5-band EQ, set the mode to '5-band'
            eqMode: enabled ? '5-band' : state.eqMode
          }));
        },
        setQueueVisible: (isQueueVisible) => set((state) => ({ 
          isQueueVisible,
          isControlsMenuVisible: isQueueVisible ? false : state.isControlsMenuVisible 
        })),
        setControlsMenuVisible: (isControlsMenuVisible) => set((state) => ({ 
          isControlsMenuVisible,
          isQueueVisible: isControlsMenuVisible ? false : state.isQueueVisible 
        })),
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

        updateTrackMetadata: (trackId, updates) => {
          set((state) => {
            const updateTrack = (track: MusicMetadata): MusicMetadata => {
              if (track.id === trackId) {
                return { ...track, ...updates };
              }
              return track;
            };

            const newMetadata = state.metadata.map(updateTrack);

            const newQueue = state.queue.map(updateTrack);
            const newHistory = state.history.map(updateTrack);

            const newCurrentTrack = state.currentTrack?.id === trackId
              ? updateTrack(state.currentTrack)
              : state.currentTrack;

            return {
              metadata: newMetadata,
              queue: newQueue,
              history: newHistory,
              currentTrack: newCurrentTrack,
            };
          });
        },
        addCustomMetadataField: (field: { id: string; name: string; type: 'text' }) =>
          set((state) => ({
            customMetadata: {
              ...state.customMetadata,
              fields: [
                ...state.customMetadata.fields,
                { 
                  ...field, 
                  showInFilter: true,   // Default to showing in filter
                  showInList: true,     // Default to showing in list
                  showInSearch: true,   // Default to showing in search
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
        toggleCustomMetadataSearch: (fieldId: string) =>
          set((state) => ({
            customMetadata: {
              fields: state.customMetadata.fields.map(field =>
                field.id === fieldId
                  ? { ...field, showInSearch: !field.showInSearch }
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
        toggleSearch: (fieldId: string) =>
          set((state) => ({
            standardMetadataFields: state.standardMetadataFields.map((field) =>
              field.id === fieldId
                ? { ...field, showInSearch: !field.showInSearch }
                : field
            ),
            customMetadata: {
              fields: state.customMetadata.fields.map(field =>
                field.id === fieldId
                  ? { ...field, showInSearch: !field.showInSearch }
                  : field
              ),
            },
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
        setPracticeMode: (mode: boolean) => set({ practiceMode: mode }),
        setSelectedTracks: (tracks: string[] | Set<string>) => {
          const trackArray = Array.isArray(tracks) ? tracks : Array.from(tracks);
          set((state) => ({ ...state, selectedTracks: trackArray }));
        },
        handleSelectAll: (trackIds: string[]) => {
          console.log('handleSelectAll called with trackIds:', trackIds);
          
          const currentSelected = get().selectedTracks || [];
          console.log('Current selected tracks:', currentSelected);
          
          const allSelected = trackIds.length > 0 && trackIds.every(id => currentSelected.includes(id));
          console.log('All tracks already selected?', allSelected);
          
          if (allSelected) {
            console.log('Clearing selection');
            set({ selectedTracks: [] });
          } else {
            console.log('Setting new selection');
            const hiddenSelected = currentSelected.filter(id => !trackIds.includes(id));
            const newSelection = [...hiddenSelected, ...trackIds];
            console.log('New selection:', newSelection);
            set({ selectedTracks: newSelection });
          }
        },
        addToQueue: (track: MusicMetadata) =>
          set((state: PlayerState) => {
            if (!track) {
              throw new AudioError(
                'Cannot add invalid track to queue',
                AudioErrorCode.INVALID_AUDIO
              );
            }

            const trackWithId = { ...track, queueId: track.queueId || uuidv4() };
            
            // If there's no current track, set this as current
            if (!state.currentTrack) {
              return { 
                currentTrack: trackWithId,
                isPlaying: true // Auto-start playback when adding to empty queue
              };
            }
            return { queue: [...state.queue, trackWithId] };
          }),

        addTracksToQueue: (tracks: MusicMetadata[]) =>
          set((state: PlayerState) => {
            if (!Array.isArray(tracks) || tracks.length === 0) {
              return state;
            }

            const tracksWithIds = tracks.map(track => ({ ...track, queueId: uuidv4() }));
            
            // If there's no current track, set the first track as current
            if (!state.currentTrack) {
              const [firstTrack, ...remainingTracks] = tracksWithIds;
              return { 
                currentTrack: firstTrack,
                queue: remainingTracks,
                isPlaying: true // Auto-start playback when adding to empty queue
              };
            }
            return { queue: [...state.queue, ...tracksWithIds] };
          }),
      };
    },
    {
      name: "player-storage",
      partialize: (state) => ({
        ...state,
        isPlaying: false, // Always reset isPlaying to false when rehydrating
        currentTime: 0,
        queue: state.queue,
        history: state.history,
        currentTrack: state.currentTrack,
        volume: state.volume,
        shuffle: state.shuffle,
        repeat: state.repeat,
        eqValues: state.eqValues,
        eqMode: state.eqMode,
        use5BandEQ: state.use5BandEQ,
        selectedDeviceId: state.selectedDeviceId,
        prelistenDeviceId: state.prelistenDeviceId,
        showPreListenButtons: state.showPreListenButtons,
        recentPlayHours: state.recentPlayHours,
        monthlyPlayDays: state.monthlyPlayDays,
        hasShownPreListenWarning: state.hasShownPreListenWarning,
        songLists: state.songLists,
        selectedListId: state.selectedListId,
        metadata: state.metadata,
        customMetadata: state.customMetadata,
        standardMetadataFields: state.standardMetadataFields,
        practiceMode: state.practiceMode,
        selectedFolderNames: state.selectedFolderNames
      }),
      onRehydrateStorage: () => (state) => {
        // Initialize DB after store is rehydrated
        if (typeof window !== 'undefined') {
          initMusicDB().catch(console.error);
        }
      },
    }
  )
);
