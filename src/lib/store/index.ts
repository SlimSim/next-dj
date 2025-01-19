import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { PlaybackSlice, createPlaybackSlice } from './slices/playbackSlice';
import { QueueSlice, createQueueSlice } from './slices/queueSlice';
import { DeviceSlice, createDeviceSlice } from './slices/deviceSlice';
import { LibrarySlice, createLibrarySlice } from './slices/librarySlice';
import { PlaylistSlice, createPlaylistSlice } from './slices/playlistSlice';
import { StatsSlice, createStatsSlice } from './slices/statsSlice';

export type PlayerStore = PlaybackSlice &
  QueueSlice &
  DeviceSlice &
  LibrarySlice &
  PlaylistSlice &
  StatsSlice;

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (...args) => ({
      ...createPlaybackSlice(...args),
      ...createQueueSlice(...args),
      ...createDeviceSlice(...args),
      ...createLibrarySlice(...args),
      ...createPlaylistSlice(...args),
      ...createStatsSlice(...args),
    }),
    {
      name: 'player-storage',
      partialize: (state) => ({
        // Only persist necessary state
        volume: state.volume,
        selectedDeviceId: state.selectedDeviceId,
        prelistenDeviceId: state.prelistenDeviceId,
        showPreListenButtons: state.showPreListenButtons,
        selectedFolderNames: state.selectedFolderNames,
        recentPlayHours: state.recentPlayHours,
        monthlyPlayDays: state.monthlyPlayDays,
        hasShownPreListenWarning: state.hasShownPreListenWarning,
        songLists: state.songLists,
        metadata: state.metadata,
      }),
    }
  )
);
