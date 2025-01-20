import { useEffect } from "react";
import { PlayerState } from "@/lib/types/player";

export const useFadeEffects = (
  audioRef: React.RefObject<HTMLAudioElement>,
  track: PlayerState["currentTrack"],
  volume: number
) => {
  // Handle start fade
  useEffect(() => {
    if (!audioRef.current || !track) return;

    const fadeDuration = track.fadeDuration || 0;
    const initialVolume = track.volume || 0.75;
    audioRef.current.volume = fadeDuration > 0 ? 0 : initialVolume * volume;

    if (fadeDuration > 0) {
      let startTime = Date.now() / 1000;
      
      const fadeIn = () => {
        if (!audioRef.current) return;

        const currentTime = Date.now() / 1000;
        const elapsed = currentTime - startTime;
        const fadeProgress = Math.min(Math.max(elapsed / fadeDuration, 0), 1);

        if (fadeProgress < 1) {
          audioRef.current.volume = Math.min(Math.max(initialVolume * volume * fadeProgress, 0), 1);
          requestAnimationFrame(fadeIn);
        } else {
          audioRef.current.volume = initialVolume * volume;
        }
      };

      const handlePlay = () => {
        startTime = Date.now() / 1000;
        fadeIn();
      };

      audioRef.current.addEventListener('play', handlePlay, { once: true });
      
      return () => {
        audioRef.current?.removeEventListener('play', handlePlay);
      };
    }
  }, [track?.id, track?.fadeDuration, volume]);

  // Handle end fade
  useEffect(() => {
    if (!audioRef.current || !track || !track.endTimeFadeDuration) return;

    const handleTimeUpdate = () => {
      if (!audioRef.current || !track) return;

      const currentTime = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      const endOffset = track.endTimeOffset || 0;
      const endFadeDuration = track.endTimeFadeDuration || 0;
      const initialVolume = track.volume || 0.75;

      // Calculate when to start fading out
      const fadeStartTime = duration - endOffset - endFadeDuration;
      
      // If we're in the fade out period
      if (currentTime >= fadeStartTime && currentTime <= (duration - endOffset)) {
        const fadeProgress = 1 - ((currentTime - fadeStartTime) / endFadeDuration);
        audioRef.current.volume = Math.min(Math.max(initialVolume * volume * fadeProgress, 0), 1);
      }
    };

    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    
    return () => {
      audioRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [track?.id, track?.endTimeFadeDuration, track?.endTimeOffset, volume]);
};
