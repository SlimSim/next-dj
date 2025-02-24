import { useEffect } from "react";
import { PlayerState } from "@/lib/types/player";
import { getNormalizedVolume } from "../utils/audioUtils";

// Update interval in milliseconds (20ms = 50 updates per second, smooth enough for volume changes)
const FADE_UPDATE_INTERVAL = 20;

export const useFadeEffects = (
  audioRef: React.RefObject<HTMLAudioElement>,
  track: PlayerState["currentTrack"],
  volume: number
) => {
  // Handle start fade
  useEffect(() => {
    if (!audioRef.current || !track) return;

    const fadeDuration = track.fadeDuration || 0;
    const trackVolume = track.volume || 0.75;
    const normalizedBaseVolume = getNormalizedVolume(volume, trackVolume);
    
    // Set initial volume to 0 if we have a fade duration
    if (fadeDuration > 0) {
      audioRef.current.volume = 0;
    }

    if (fadeDuration > 0) {
      let startTime = Date.now() / 1000;
      let fadeInterval: NodeJS.Timeout | null = null;
      let isFading = false;
      let hasStartTimeBeenSet = false;
      let hasReachedStartTime = false;
      let hasFadeStarted = false;
      
      const fadeIn = () => {
        if (!audioRef.current || !isFading) return;

        const currentTime = Date.now() / 1000;
        const elapsed = currentTime - startTime;
        const fadeProgress = Math.min(Math.max(elapsed / fadeDuration, 0), 1);
        const targetVolume = normalizedBaseVolume * fadeProgress;
        const safeVolume = Math.min(Math.max(targetVolume, 0), 1);

        // Only set volume if it has changed significantly
        if (Math.abs(audioRef.current.volume - safeVolume) > 0.01) {
          audioRef.current.volume = safeVolume;
        }

        if (fadeProgress >= 1) {
          audioRef.current.volume = normalizedBaseVolume;
          isFading = false;
          if (fadeInterval) {
            clearInterval(fadeInterval);
            fadeInterval = null;
          }
        }
      };

      const startFade = () => {
        if (isFading || !audioRef.current || hasFadeStarted) return;

        // Only start fade if we're at the correct time and playing
        if (!hasStartTimeBeenSet || !hasReachedStartTime || audioRef.current.paused) {
          return;
        }

        // Reset volume to 0 before starting fade
        audioRef.current.volume = 0;
        startTime = Date.now() / 1000;
        isFading = true;
        hasFadeStarted = true;
        
        // Clear any existing interval
        if (fadeInterval) {
          clearInterval(fadeInterval);
        }
        // Start the fade interval
        fadeInterval = setInterval(fadeIn, FADE_UPDATE_INTERVAL);
      };

      const handleTimeUpdate = () => {
        if (!audioRef.current || isFading || hasFadeStarted) return;

        // Check if we've reached or passed the startTime
        if (track.startTime && track.startTime > 0) {
          const currentTime = audioRef.current.currentTime;
          // Changed to check if we're at or past the startTime
          if (currentTime >= track.startTime) {
            hasReachedStartTime = true;
            startFade();
          }
        }
      };

      const handleCanPlay = () => {
        if (!audioRef.current || hasFadeStarted) return;
        
        const currentTime = audioRef.current.currentTime;
        
        // Mark that startTime has been set
        hasStartTimeBeenSet = true;

        // If we're already at or past the correct time, mark it
        if (track.startTime && currentTime >= track.startTime) {
          hasReachedStartTime = true;
          startFade();
        }
      };

      const handlePlay = () => {
        // Check again in case we're already past startTime when play is pressed
        if (!audioRef.current || hasFadeStarted) return;
        
        if (hasStartTimeBeenSet && (hasReachedStartTime || (track.startTime && audioRef.current.currentTime >= track.startTime))) {
          hasReachedStartTime = true;
          startFade();
        }
      };

      // Listen for all relevant events
      audioRef.current.addEventListener('canplay', handleCanPlay);
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('play', handlePlay);
      
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('canplay', handleCanPlay);
          audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
          audioRef.current.removeEventListener('play', handlePlay);
        }
        if (fadeInterval) {
          clearInterval(fadeInterval);
        }
      };
    }
  }, [track?.id, track?.fadeDuration, track?.startTime, volume]);

  // Handle end fade
  useEffect(() => {
    if (!audioRef.current || !track || !track.endTimeFadeDuration) return;

    let fadeInterval: NodeJS.Timeout | null = null;
    let isFading = false;

    const handleTimeUpdate = () => {
      if (!audioRef.current || !track) return;

      const currentTime = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      const endOffset = track.endTimeOffset || 0;
      const endFadeDuration = track.endTimeFadeDuration || 0;
      const trackVolume = track.volume || 0.75;
      const normalizedBaseVolume = getNormalizedVolume(volume, trackVolume);

      // Calculate when to start fading out
      const fadeStartTime = duration - endOffset - endFadeDuration;
      
      // If we're in the fade out period and not already fading
      if (currentTime >= fadeStartTime && currentTime <= (duration - endOffset) && !isFading) {
        // Start new fade interval
        isFading = true;
        fadeInterval = setInterval(() => {
          if (!audioRef.current) return;
          
          const currentTime = audioRef.current.currentTime;
          const fadeProgress = Math.max(0, 1 - ((currentTime - fadeStartTime) / endFadeDuration));
          const targetVolume = normalizedBaseVolume * fadeProgress;
          
          // Ensure volume is within valid range
          const safeVolume = Math.min(Math.max(targetVolume, 0), 1);
          audioRef.current.volume = safeVolume;

          // Clear interval when fade is complete
          if (fadeProgress <= 0 && fadeInterval) {
            clearInterval(fadeInterval);
            fadeInterval = null;
            isFading = false;
          }
        }, FADE_UPDATE_INTERVAL);
      }
    };

    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audioRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
      if (fadeInterval) {
        clearInterval(fadeInterval);
      }
    };
  }, [track?.id, track?.endTimeFadeDuration, track?.endTimeOffset, volume]);
};
