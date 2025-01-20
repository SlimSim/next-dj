import { toast } from 'sonner';
import { AudioError, AudioErrorCode, errorMessages } from '../types';

export { AudioError, AudioErrorCode };

/**
 * Handles audio errors with consistent logging and user feedback
 */
export const handleAudioError = (
  error: unknown,
  context: string,
  showToast = true,
  suppressIfInitializing = false
): AudioError => {
  // Convert to AudioError if not already
  const audioError = error instanceof AudioError
    ? error
    : new AudioError(
        error instanceof Error ? error.message : 'Unknown error',
        AudioErrorCode.UNKNOWN
      );

  // Only log and show toast if not suppressing initialization errors
  if (!suppressIfInitializing || (audioError.code !== AudioErrorCode.FILE_NOT_FOUND && audioError.code !== AudioErrorCode.TRACK_NOT_FOUND)) {
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
  }

  return audioError;
};

/**
 * Creates an error handler function for specific contexts
 */
export const createErrorHandler = (context: string) => {
  return (error: unknown, showToast = true, suppressIfInitializing = false) => {
    return handleAudioError(error, context, showToast, suppressIfInitializing);
  };
};

/**
 * Wraps an async function with error handling
 */
export const withErrorHandler = async <T>(
  fn: () => Promise<T>,
  context: string,
  showToast = true,
  suppressIfInitializing = false
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    throw handleAudioError(error, context, showToast, suppressIfInitializing);
  }
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