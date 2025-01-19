/**
 * Audio utility functions for volume control, time formatting, and URL management
 */

/**
 * Clamps volume value between 0 and 1
 */
export const clampVolume = (value: number): number => Math.max(0, Math.min(1, value));

/**
 * Formats seconds into MM:SS format
 */
export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Formats duration in a human-readable format with hours if needed
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 3600) {
    return formatTime(seconds);
  }
  const hours = Math.floor(seconds / 3600);
  const remainingMinutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Creates a URL for an audio file and returns cleanup function
 */
export const createAudioUrl = (file: Blob): { url: string; cleanup: () => void } => {
  const url = URL.createObjectURL(file);
  return {
    url,
    cleanup: () => URL.revokeObjectURL(url),
  };
};

/**
 * Safely revokes an audio URL if it exists
 */
export const revokeAudioUrl = (url: string | null) => {
  if (url) {
    URL.revokeObjectURL(url);
  }
};

/**
 * Calculates volume level for visualization (in dB)
 */
export const calculateVolumeLevel = (value: number): number => {
  // Convert linear volume (0-1) to dB (-60 to 0)
  if (value <= 0) return -60;
  const db = 20 * Math.log10(value);
  return Math.max(-60, Math.min(0, db));
};

/**
 * Converts dB to linear volume (0-1)
 */
export const dbToLinear = (db: number): number => {
  if (db <= -60) return 0;
  return Math.min(1, Math.pow(10, db / 20));
};

/**
 * Safely sets audio element source with proper cleanup
 */
export const setAudioSource = (
  audioElement: HTMLAudioElement | null,
  file: Blob | null
): (() => void) => {
  if (!audioElement || !file) return () => {};

  const { url, cleanup } = createAudioUrl(file);
  audioElement.src = url;

  return cleanup;
};
