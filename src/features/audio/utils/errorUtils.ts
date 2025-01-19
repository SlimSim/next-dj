import { toast } from 'sonner';

/**
 * Custom error types for audio operations
 */
export class AudioError extends Error {
  constructor(message: string, public readonly code: AudioErrorCode) {
    super(message);
    this.name = 'AudioError';
  }
}

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
 * Maps error codes to user-friendly messages
 */
const errorMessages: Record<AudioErrorCode, string> = {
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

/**
 * Handles audio errors with consistent logging and user feedback
 */
export const handleAudioError = (
  error: unknown,
  context: string,
  showToast = true
): AudioError => {
  // Convert to AudioError if not already
  const audioError = error instanceof AudioError
    ? error
    : new AudioError(
        error instanceof Error ? error.message : 'Unknown error',
        AudioErrorCode.UNKNOWN
      );

  // Log error with context
  console.error(`Audio Error [${context}]:`, {
    code: audioError.code,
    message: audioError.message,
    originalError: error
  });

  // Show toast notification if requested
  if (showToast) {
    toast.error(errorMessages[audioError.code]);
  }

  return audioError;
};

/**
 * Creates an error handler function for specific contexts
 */
export const createErrorHandler = (context: string) => {
  return (error: unknown, showToast = true) => {
    return handleAudioError(error, context, showToast);
  };
};

/**
 * Wraps an async function with error handling
 */
export const withErrorHandler = <T>(
  fn: () => Promise<T>,
  context: string,
  showToast = true
): Promise<T> => {
  return fn().catch(error => {
    handleAudioError(error, context, showToast);
    throw error;
  });
};

/**
 * Checks if an error is a specific type of AudioError
 */
export const isAudioError = (
  error: unknown,
  code: AudioErrorCode
): error is AudioError => {
  return error instanceof AudioError && error.code === code;
};
