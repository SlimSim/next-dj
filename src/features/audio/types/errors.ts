/**
 * Enum representing different types of audio errors
 */
export enum AudioErrorCode {
  // Playback errors
  PLAYBACK_FAILED = 'PLAYBACK_FAILED',
  TRACK_NOT_FOUND = 'TRACK_NOT_FOUND',
  INVALID_AUDIO = 'INVALID_AUDIO',
  
  // Device errors
  DEVICE_NOT_FOUND = 'DEVICE_NOT_FOUND',
  DEVICE_ACCESS_DENIED = 'DEVICE_ACCESS_DENIED',
  DEVICE_ALREADY_IN_USE = 'DEVICE_ALREADY_IN_USE',
  
  // File system errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_ACCESS_DENIED = 'FILE_ACCESS_DENIED',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  
  // Unknown errors
  UNKNOWN = 'UNKNOWN',
}

/**
 * Custom error class for audio-related errors
 */
export class AudioError extends Error {
  constructor(message: string, public readonly code: AudioErrorCode) {
    super(message);
    this.name = 'AudioError';
  }
}

/**
 * Maps error codes to user-friendly messages
 */
export const errorMessages: Record<AudioErrorCode, string> = {
  [AudioErrorCode.PLAYBACK_FAILED]: 'Failed to play audio',
  [AudioErrorCode.TRACK_NOT_FOUND]: 'Track not found',
  [AudioErrorCode.INVALID_AUDIO]: 'Invalid audio file',
  [AudioErrorCode.DEVICE_NOT_FOUND]: 'Audio device not found',
  [AudioErrorCode.DEVICE_ACCESS_DENIED]: 'Access to audio device denied',
  [AudioErrorCode.DEVICE_ALREADY_IN_USE]: 'Audio device is in use',
  [AudioErrorCode.FILE_NOT_FOUND]: 'Audio file not found',
  [AudioErrorCode.FILE_ACCESS_DENIED]: 'Access to audio file denied',
  [AudioErrorCode.INVALID_FILE_TYPE]: 'Invalid audio file type',
  [AudioErrorCode.UNKNOWN]: 'An unknown error occurred',
};
