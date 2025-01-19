import { StateCreator } from 'zustand';
import { SongList } from '@/lib/types/player';

export interface PlaylistState {
  songLists: SongList[];
  showLists: boolean;
  selectedListId: string | null;
}

export interface PlaylistActions {
  addSongList: (name: string) => void;
  removeSongList: (id: string) => void;
  addSongToList: (listId: string, songPath: string) => void;
  removeSongFromList: (listId: string, songPath: string) => void;
  renameSongList: (id: string, name: string) => void;
  setSelectedListId: (id: string | null) => void;
  toggleLists: () => void;
}

export type PlaylistSlice = PlaylistState & PlaylistActions;

const initialPlaylistState: PlaylistState = {
  songLists: [],
  showLists: false,
  selectedListId: null,
};

export const createPlaylistSlice: StateCreator<PlaylistSlice> = (set) => ({
  ...initialPlaylistState,
  addSongList: (name) => set((state) => ({
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
  removeSongList: (id) => set((state) => ({
    songLists: state.songLists.filter((list) => list.id !== id),
  })),
  addSongToList: (listId, songPath) => set((state) => ({
    songLists: state.songLists.map((list) =>
      list.id === listId
        ? {
            ...list,
            songs: [...list.songs, songPath],
            modified: Date.now(),
          }
        : list
    ),
  })),
  removeSongFromList: (listId, songPath) => set((state) => ({
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
  renameSongList: (id, name) => set((state) => ({
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
  toggleLists: () => set((state) => ({ showLists: !state.showLists })),
});
