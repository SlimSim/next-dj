'use client'

import { useCallback, useEffect } from 'react'
import { Button } from '../ui/button'
import { Slider } from '../ui/slider'
import { usePlayerStore } from '@/lib/store'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils/common'
import { formatTime } from '@/features/audio/utils/audioUtils';
import { ConfirmButton } from '../ui/confirm-button'
import ConfirmToggleButton from '../ui/confirm-toggle-button'
import { EQControls } from './eq-controls'
import { EQValues } from '@/lib/types/player'
import { updateEQBand } from '@/features/audio/eq'

interface PlayerControlsMenuProps {
  audioRef: React.RefObject<HTMLAudioElement>
  isLoading: boolean
  isMuted: boolean
  toggleMute: () => void
  handleVolumeChange: (value: number) => void
  handleSeek: (value: number) => void
}

export function PlayerControlsMenu({
  audioRef,
  isLoading,
  isMuted,
  toggleMute,
  handleVolumeChange,
  handleSeek
}: PlayerControlsMenuProps) {
  const {
    currentTrack,
    isPlaying,
    volume,
    repeat,
    duration,
    currentTime,
    setIsPlaying,
    setRepeat,
    playNextTrack,
    playPreviousTrack,
    eqValues,
    practiceMode,
    isControlsMenuVisible,
    setControlsMenuVisible,
  } = usePlayerStore()

  const calculateFinalEQ = (songEQ: number, globalEQ: number): number => {
    const clampedSongEQ = Math.max(0, Math.min(100, songEQ));
    const clampedGlobalEQ = Math.max(0, Math.min(100, globalEQ));
    return Math.round((clampedSongEQ * clampedGlobalEQ) / 100);
  }

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack || isLoading) return
    setIsPlaying(!isPlaying)
  }, [currentTrack, isPlaying, isLoading, audioRef, setIsPlaying])

  useEffect(() => {
    const bands = ['a', 'b', 'c', 'd', 'e'] as const;
    bands.forEach((band, index) => {
      const songValue = currentTrack?.eq?.[band] ?? 70;
      const globalValue = eqValues[band];
      const finalValue = calculateFinalEQ(songValue, globalValue);
      updateEQBand(index, finalValue);
    });
  }, [currentTrack?.eq, eqValues]);

  if (!isControlsMenuVisible) return null

  return (
    <div className="absolute bottom-full w-full bg-background/80 backdrop-blur-sm">
      <div className="bg-background border-t transform transition-transform duration-300 ease-in-out">
        <div className="container max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b">
            <h2 className="text-lg font-semibold">Player Controls</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setControlsMenuVisible(false)}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>

          {/* Controls */}
          <div className="p-4">
            {/* EQ Controls */}
            <EQControls />

            {/* Volume controls */}
            <div className="space-y-2 mt-6">
              <div className="flex items-center gap-2">
                <ConfirmButton
                  disableConfirm={practiceMode}
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="shrink-0"
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                  <span className="sr-only">Toggle mute</span>
                </ConfirmButton>
                <div className="w-full space-y-1">
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[isMuted ? 0 : volume * 100]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={([value]) => handleVolumeChange(value / 100)}
                      className="w-full"
                    />
                    <span className="text-sm text-muted-foreground min-w-[3ch] text-right">
                      {Math.round((isMuted ? 0 : volume * 100))}
                    </span>
                  </div>
                </div>
              </div>
            </div>


            
            {/* Main controls */}
            <div className="flex justify-center items-center gap-8">
              <ConfirmButton
                variant="ghost"
                disableConfirm={practiceMode}
                // confirmText={<HelpCircle className="h-6 w-6" />}
                size="icon"
                className="h-12 w-12"
                disabled={!currentTrack}
                onClick={playPreviousTrack}
              >
                <SkipBack className="h-6 w-6" />
                <span className="sr-only">Previous track</span>
              </ConfirmButton>
              <ConfirmButton
                variant="ghost"
                size="icon"
                disableConfirm={practiceMode}
                className="h-12 w-12"
                disabled={!currentTrack}
                onClick={playNextTrack}
              >
                <SkipForward className="h-6 w-6" />
                <span className="sr-only">Next track</span>
              </ConfirmButton>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
