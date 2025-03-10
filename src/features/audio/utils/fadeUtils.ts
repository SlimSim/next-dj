/**
 * Normalize volume based on global and track-specific volume settings.
 * @param globalVolume - The global volume setting.
 * @param trackVolume - The track-specific volume setting.
 * @returns Normalized volume level.
 */
export function getNormalizedVolume(globalVolume: number, trackVolume: number): number {
  return Math.min(Math.max(globalVolume * trackVolume, 0), 1);
}

/**
 * Calculate fade progress based on elapsed time and fade duration.
 * @param startTime - The start time of the fade effect.
 * @param fadeDuration - The total duration of the fade effect.
 * @returns Fade progress as a value between 0 and 1.
 */
export function calculateFadeProgress(startTime: number, fadeDuration: number): number {
  const currentTime = Date.now() / 1000;
  const elapsed = currentTime - startTime;
  return Math.min(Math.max(elapsed / fadeDuration, 0), 1);
}

/**
 * Calculate fade progress for end fade based on current time and fade parameters.
 * @param fadeStartTime - The time when fade should start.
 * @param fadeDuration - The total duration of the fade effect.
 * @param currentTime - The current playback time.
 * @returns Fade progress as a value between 0 and 1.
 */
export function calculateEndFadeProgress(fadeStartTime: number, fadeDuration: number, currentTime: number): number {
  const elapsed = currentTime - fadeStartTime;
  return Math.max(0, 1 - (elapsed / fadeDuration));
}

/**
 * Safely calculate the target volume based on fade progress and normalized volume.
 * @param fadeProgress - The current progress of the fade effect.
 * @param normalizedBaseVolume - The base volume level to reach.
 * @returns Safe target volume level.
 */
export function calculateTargetVolume(fadeProgress: number, normalizedBaseVolume: number): number {
  const targetVolume = normalizedBaseVolume * fadeProgress;
  return Math.min(Math.max(targetVolume, 0), 1);
}
