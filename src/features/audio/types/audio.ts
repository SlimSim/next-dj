import { MusicMetadata } from "@/lib/types/types";

/**
 * Represents an audio file with its metadata and file system information
 */
export interface AudioFile {
  id: string;
  file: Blob;
  metadata: MusicMetadata;
  isReference?: boolean;
  fileHandle?: FileSystemFileHandle;
}

/**
 * Represents the current state of audio playback
 */
export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
}

/**
 * Type for repeat mode options
 */
export type RepeatMode = "none" | "one" | "all";

/**
 * Represents an audio device configuration
 */
export interface AudioDeviceConfig {
  deviceId: string;
  label: string;
  isDefault: boolean;
  kind: MediaDeviceKind;
}

/**
 * Represents audio playback options
 */
export interface AudioPlaybackOptions {
  startTime?: number;
  endTimeOffset?: number;
  fadeDuration?: number;
  endTimeFadeDuration?: number;
  volume?: number;
}

/**
 * Represents the result of an audio operation
 */
export interface AudioOperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: Error;
}
