export interface MusicMetadata {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  playCount: number;
  lastPlayed?: Date;
  playHistory: PlayHistoryEvent[];
  path?: string;
  coverArt?: string;
  file?: File;
  queueId: string;
  removed?: boolean;
  tempo?: number;
  rating?: number;
  comment?: string;
  track?: number;
  bpm?: number;
  year?: number;
  genre?: string[];
  volume?: number;
  startTime?: number; // Time in seconds to start playback from
  endTimeOffset?: number; // Time in seconds to end before the track's end
  fadeDuration?: number;
  fadeOutDuration?: number;
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
