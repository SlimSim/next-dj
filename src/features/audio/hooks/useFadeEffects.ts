import { useEffect } from "react";
import { PlayerState } from "@/lib/types/player";
import { getNormalizedVolume, calculateFadeProgress, calculateEndFadeProgress, calculateTargetVolume } from "../utils/fadeUtils";

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
    
    // Immediately set initial volume before any playback can occur
    audioRef.current.volume = fadeDuration > 0 ? 0 : normalizedBaseVolume;

    if (fadeDuration > 0) {
      let startTime = Date.now() / 1000;
      let fadeInterval: NodeJS.Timeout | undefined = undefined;
      let isFading = false;
      let hasStartTimeBeenSet = false;
      let hasReachedStartTime = false;
      let hasFadeStarted = false;
      
      const fadeIn = () => {
        if (!audioRef.current || !isFading) return;

        const fadeProgress = calculateFadeProgress(startTime, fadeDuration);
        const targetVolume = calculateTargetVolume(fadeProgress, normalizedBaseVolume);

        // Only set volume if it has changed significantly
        if (Math.abs(audioRef.current.volume - targetVolume) > 0.01) {
          audioRef.current.volume = targetVolume;
        }

        if (fadeProgress >= 1) {
          audioRef.current.volume = normalizedBaseVolume;
          isFading = false;
          if (fadeInterval !== undefined) {
            clearInterval(fadeInterval);
            fadeInterval = undefined;
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
        if (fadeInterval !== undefined) {
          clearInterval(fadeInterval);
        }
        // Start the fade interval
        fadeInterval = setInterval(fadeIn, FADE_UPDATE_INTERVAL);
      };

      const handleTimeUpdate = () => {
        if (!audioRef.current || isFading || hasFadeStarted) return;

        // If startTime is 0 or undefined, we should have already started the fade in handleCanPlay
        if (!track.startTime) return;

        // Check if we've reached or passed the startTime
        const currentTime = audioRef.current.currentTime;
        if (currentTime >= track.startTime) {
          hasReachedStartTime = true;
          startFade();
        }
      };

      const handleCanPlay = () => {
        if (!audioRef.current || hasFadeStarted) return;
        
        const currentTime = audioRef.current.currentTime;
        
        // Mark that startTime has been set
        hasStartTimeBeenSet = true;

        // If startTime is 0 or we're already at/past the startTime, start fade immediately
        if (!track.startTime || currentTime >= track.startTime) {
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
        if (fadeInterval !== undefined) {
          clearInterval(fadeInterval);
        }
      };
    }
  }, [track?.id, track?.fadeDuration, track?.startTime, volume]);

  // Handle end fade
  useEffect(() => {
    if (!audioRef.current || !track || !track.endTimeFadeDuration) {
      return;
    }

    let fadeInterval: NodeJS.Timeout | undefined = undefined;
    let isFading = false;

    const handleTimeUpdate = () => {
      if (!audioRef.current || !track) return;

      const currentTime = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      const endOffset = track.endTimeOffset || 0;
      const endFadeDuration = track.endTimeFadeDuration || 0;
      const trackVolume = track.volume || 0.75;
      const normalizedBaseVolume = getNormalizedVolume(volume, trackVolume);

      // Calculate when to start fading out - we start fading BEFORE reaching endTimeOffset
      const fadeStartTime = duration - (endOffset + endFadeDuration);

      // If we're in the fade out period and not already fading
      if (currentTime >= fadeStartTime && !isFading) {

        // Start new fade interval
        isFading = true;
        fadeInterval = setInterval(() => {
          if (!audioRef.current) return;
          
          const currentTime = audioRef.current.currentTime;
          const fadeProgress = calculateEndFadeProgress(fadeStartTime, endFadeDuration, currentTime);
          const targetVolume = calculateTargetVolume(fadeProgress, normalizedBaseVolume);
          
          // Ensure volume is within valid range
          const safeVolume = Math.min(Math.max(targetVolume, 0), 1);
          audioRef.current.volume = safeVolume;

          // Clear interval when fade is complete or we've reached endTimeOffset
          if (fadeProgress <= 0 || currentTime >= (duration - endOffset)) {
            if (fadeInterval !== undefined) {
              clearInterval(fadeInterval);
              fadeInterval = undefined;
            }
            isFading = false;
          }
        }, FADE_UPDATE_INTERVAL);
      }
    };

    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audioRef.current?.removeEventListener('timeupdate', handleTimeUpdate);
      if (fadeInterval !== undefined) {
        clearInterval(fadeInterval);
      }
    };
  }, [track?.id, track?.endTimeFadeDuration, track?.endTimeOffset, volume]);
};
