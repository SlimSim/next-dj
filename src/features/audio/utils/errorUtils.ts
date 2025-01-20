import { toast } from 'sonner';
import { AudioError, AudioErrorCode, errorMessages } from '../types';

export { AudioError, AudioErrorCode };

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