export interface MusicMetadata {
  id: string;
  path: string;
  title?: string;
  artist?: string;
  album?: string;
  track?: number;
  year?: number;
  genre?: string[];
  bpm?: number;
  rating?: number;
  comment?: string;
  duration?: number;
  playCount?: number;
  volume?: number; // 1 is default, 0.5 is half volume, 2 is double volume, etc.
}

export interface AudioFile {
  id: string;
  file: Blob;
  metadata: MusicMetadata;
  isReference?: boolean;
  fileHandle?: FileSystemFileHandle;
}

export type RepeatMode = "none" | "one" | "all";

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
}

export interface PlayHistoryEvent {
  timestamp: string;
  // We can easily add more fields here in the future, like:
  // source?: 'main-player' | 'pre-listen';
  // durationPlayed?: number;
  // deviceId?: string;
}
