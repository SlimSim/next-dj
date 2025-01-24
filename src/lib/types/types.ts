import { AudioFile, type AudioPlaybackOptions, type RepeatMode } from "@/features/audio/types";
import { CustomMetadataValue } from "./customMetadata";

export interface MusicMetadata extends AudioPlaybackOptions {
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
  customMetadata?: { [key: `custom_${string}`]: string };
}

export interface PlayHistoryEvent {
  timestamp: string;
  // We can easily add more fields here in the future, like:
  // source?: 'main-player' | 'pre-listen';
  // durationPlayed?: number;
  // deviceId?: string;
}

export type { AudioFile, AudioPlaybackOptions, RepeatMode };
