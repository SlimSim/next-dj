import { useCallback } from "react";
import { AudioError, AudioErrorCode, createErrorHandler } from "../utils/errorUtils";

const handleError = createErrorHandler('AudioDevice');

export const useAudioDevice = (
  audioRef: React.RefObject<HTMLAudioElement>,
  deviceId?: string
) => {
  const setAudioDevice = useCallback(async () => {
    if (!audioRef.current || !deviceId) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());

      // @ts-ignore - setSinkId is not in the type definitions yet
      if (!audioRef.current.setSinkId) {
        throw new AudioError(
          'Audio output device selection is not supported',
          AudioErrorCode.DEVICE_NOT_FOUND
        );
      }

      // @ts-ignore
      await audioRef.current.setSinkId(deviceId);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        handleError(new AudioError(
          'Selected audio device not found',
          AudioErrorCode.DEVICE_NOT_FOUND
        ));
      } else if (error instanceof DOMException && error.name === 'NotAllowedError') {
        handleError(new AudioError(
          'Permission to access audio devices was denied',
          AudioErrorCode.DEVICE_ACCESS_DENIED
        ));
      } else {
        handleError(error);
      }
    }
  }, [audioRef, deviceId]);

  return { setAudioDevice };
};
