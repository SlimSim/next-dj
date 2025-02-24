import { MusicMetadata } from "./types";
import {
  SortField,
  SortOrder,
  FilterCriteria,
} from "@/components/player/playlist-controls";
import { CustomMetadataField, CustomMetadataState } from "./customMetadata";
import { StandardMetadataField } from "./settings";

export interface SongList {
  id: string;
  name: string;
  songs: string[]; // Array of song paths
  created: number;
  modified: number;
}

export type EQValues = {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
}

export type EQMode = '3-band' | '5-band';

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
  showPreListenButtons: boolean;
  recentPlayHours: number;
  monthlyPlayDays: number;
  hasShownPreListenWarning: boolean;
  searchQuery: string;
  sortField: SortField;
  sortOrder: SortOrder;
  filters: FilterCriteria;
  showFilters: boolean;
  songLists: SongList[];
  showLists: boolean;
  selectedListId: string | null;
  metadata: MusicMetadata[];
  customMetadata: CustomMetadataState;
  standardMetadataFields: StandardMetadataField[];
  eqValues: EQValues;
  eqMode: EQMode;
  practiceMode: boolean;
}

export interface PlayerActions {
  setPrelistenDuration: (duration: number) => void;
  setCurrentTrack: (track: MusicMetadata | null) => void;
  addToQueue: (track: MusicMetadata) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  setQueue: (queue: MusicMetadata[]) => void;
  moveInQueue: (fromIndex: number, toIndex: number) => void;
  playNextTrack: () => void;
  playPreviousTrack: () => void;
  addToHistory: (track: MusicMetadata) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  setHistory: (history: MusicMetadata[]) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  setShuffle: (shuffle: boolean) => void;
  setRepeat: (repeat: PlayerState["repeat"]) => void;
  setDuration: (duration: number) => void;
  setCurrentTime: (currentTime: number) => void;
  setQueueVisible: (isQueueVisible: boolean) => void;
  triggerRefresh: () => void;
  clearAll: () => void;
  setAudioDevices: (devices: MediaDeviceInfo[]) => void;
  setSelectedDeviceId: (deviceId: string) => void;
  setPrelistenDeviceId: (deviceId: string) => void;
  setPrelistenTrack: (track: MusicMetadata | null) => void;
  setIsPrelistening: (isPrelistening: boolean) => void;
  setShowPreListenButtons: (show: boolean) => void;
  setRecentPlayHours: (hours: number) => void;
  setMonthlyPlayDays: (days: number) => void;
  setHasShownPreListenWarning: (shown: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSortField: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  setFilters: (filters: FilterCriteria) => void;
  toggleFilters: () => void;
  toggleLists: () => void;
  addSongList: (name: string) => void;
  removeSongList: (id: string) => void;
  addSongToList: (listId: string, songPath: string) => void;
  removeSongFromList: (listId: string, songPath: string) => void;
  renameSongList: (id: string, name: string) => void;
  setSelectedListId: (id: string | null) => void;
  addSelectedFolder: (folderName: string, handle: FileSystemDirectoryHandle) => void;
  removeFolder: (folderName: string) => void;
  removeRemovedSongs: () => void;
  clearSelectedFolders: () => void;
  updateTrackMetadata: (trackId: string, updates: Partial<MusicMetadata>) => void;
  addCustomMetadataField: (field: CustomMetadataField) => void;
  removeCustomMetadataField: (fieldId: string) => void;
  toggleCustomMetadataFilter: (fieldId: string) => void;
  toggleCustomMetadataVisibility: (fieldId: string) => void;
  renameCustomMetadataField: (fieldId: string, newName: string) => void;
  reorderCustomMetadataFields: (oldIndex: number, newIndex: number) => void;
  toggleStandardMetadataFilter: (fieldId: string) => void;
  toggleStandardMetadataVisibility: (fieldId: string) => void;
  reorderStandardMetadataFields: (oldIndex: number, newIndex: number) => void;
  toggleCustomMetadataSearch: (fieldId: string) => void;
  toggleStandardMetadataSearch: (fieldId: string) => void;
  setEQValue: (key: keyof EQValues, value: number) => void;
  setEQMode: (mode: EQMode) => void;
  setPracticeMode: (enabled: boolean) => void;
}

export type PlayerStore = PlayerState & PlayerActions;
