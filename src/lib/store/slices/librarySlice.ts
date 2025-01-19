import { StateCreator } from 'zustand';
import { MusicMetadata } from '@/lib/types/types';
import { SortField, SortOrder, FilterCriteria } from '@/components/player/playlist-controls';

export interface LibraryState {
  selectedFolderNames: string[];
  metadata: MusicMetadata[];
  searchQuery: string;
  sortField: SortField;
  sortOrder: SortOrder;
  filters: FilterCriteria;
  showFilters: boolean;
  refreshTrigger: number;
}

export interface LibraryActions {
  addSelectedFolder: (folderName: string, handle: FileSystemDirectoryHandle) => void;
  removeFolder: (folderName: string) => void;
  clearSelectedFolders: () => void;
  updateTrackMetadata: (
    trackId: string,
    updates: Partial<MusicMetadata> & { __volumeOnly?: boolean; __preserveRef?: boolean }
  ) => void;
  setSearchQuery: (query: string) => void;
  setSortField: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  setFilters: (filters: FilterCriteria) => void;
  toggleFilters: () => void;
  triggerRefresh: () => void;
}

export type LibrarySlice = LibraryState & LibraryActions;

const initialLibraryState: LibraryState = {
  selectedFolderNames: [],
  metadata: [],
  searchQuery: "",
  sortField: "title",
  sortOrder: "asc",
  filters: {},
  showFilters: true,
  refreshTrigger: 0,
};

export const createLibrarySlice: StateCreator<LibrarySlice> = (set) => ({
  ...initialLibraryState,
  addSelectedFolder: (folderName, handle) => {
    // Implementation depends on handle operations
  },
  removeFolder: (folderName) => {
    // Implementation depends on handle operations
  },
  clearSelectedFolders: () => set({ selectedFolderNames: [] }),
  updateTrackMetadata: (trackId, updates) => set((state) => ({
    metadata: state.metadata.map((track) =>
      track.id === trackId ? { ...track, ...updates } : track
    ),
  })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortField: (field) => set({ sortField: field }),
  setSortOrder: (order) => set({ sortOrder: order }),
  setFilters: (filters) => set({ filters }),
  toggleFilters: () => set((state) => ({ showFilters: !state.showFilters })),
  triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
});
