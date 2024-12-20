import { useEffect } from "react";

export const useAudioDevice = (
  audioRef: React.RefObject<HTMLAudioElement>,
  deviceId?: string
) => {
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !deviceId || !("setSinkId" in audio)) return;

    const setAudioDevice = async () => {
      try {
        // @ts-ignore - setSinkId is not in the HTMLAudioElement type yet
        await audio.setSinkId(deviceId);
      } catch (error) {
        console.error("Error switching audio output:", error);
      }
    };

    setAudioDevice();
  }, [deviceId]);
};
