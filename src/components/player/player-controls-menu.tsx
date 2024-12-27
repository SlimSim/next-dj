'use client'

import { useCallback } from 'react'
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
  Shuffle,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils/common'
import { formatTime } from '@/lib/utils/formatting'
import { ConfirmButton } from '../ui/confirm-button'
import ConfirmToggleButton from '../ui/confirm-toggle-button'

interface PlayerControlsMenuProps {
  isOpen: boolean
  onClose: () => void
  audioRef: React.RefObject<HTMLAudioElement>
  isLoading: boolean
  isMuted: boolean
  toggleMute: () => void
  handleVolumeChange: (value: number) => void
  handleSeek: (value: number) => void
}

export function PlayerControlsMenu({
  isOpen,
  onClose,
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
    shuffle,
    repeat,
    duration,
    currentTime,
    setIsPlaying,
    setShuffle,
    setRepeat,
    playNextTrack,
    playPreviousTrack
  } = usePlayerStore()

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack || isLoading) return
    setIsPlaying(!isPlaying)
  }, [currentTrack, isPlaying, isLoading, audioRef, setIsPlaying])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-0 bottom-0 bg-background border-t transform transition-transform duration-300 ease-in-out">
        <div className="container max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b">
            <h2 className="text-lg font-semibold">Player Controls</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>

          {/* Controls */}
          <div className="p-4 space-y-6">
            {/* Track info */}
            <div className="text-center space-y-1">
              <h3 className="font-medium">
                {currentTrack?.title || 'No track playing'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {currentTrack?.artist || 'Unknown artist'}
              </p>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <Slider
                value={[currentTime]}
                min={0}
                max={duration}
                step={1}
                onValueChange={([value]) => handleSeek(value)}
                className="w-full"
                disabled={!currentTrack}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main controls */}
            <div className="flex justify-center items-center gap-8">
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-12 w-12', shuffle && 'text-primary')}
                onClick={() => setShuffle(!shuffle)}
              >
                <Shuffle className="h-6 w-6" />
                <span className="sr-only">Toggle shuffle</span>
              </Button>
              <ConfirmButton
                variant="ghost"
                // confirmText={<HelpCircle className="h-6 w-6" />}
                size="icon"
                className="h-12 w-12"
                disabled={!currentTrack}
                onClick={playPreviousTrack}
              >
                <SkipBack className="h-6 w-6" />
                <span className="sr-only">Previous track</span>
              </ConfirmButton>

              <ConfirmToggleButton
                isToggled={isPlaying}
                onToggle={togglePlay}
                disabled={!currentTrack || isLoading}
                className="h-16 w-16"
                variant="default"
                toggledIcon={<><Pause className="h-8 w-8" /><span className="sr-only">Pause</span></>}
              >
                <Play className="h-8 w-8" />
                <span className="sr-only">Play</span>
              </ConfirmToggleButton>
              <ConfirmButton
                variant="ghost"
                size="icon"
                className="h-12 w-12"
                disabled={!currentTrack}
                onClick={playNextTrack}
              >
                <SkipForward className="h-6 w-6" />
                <span className="sr-only">Next track</span>
              </ConfirmButton>
              <Button
                variant="ghost"
                size="icon"
                className={cn('h-12 w-12', repeat !== 'none' && 'text-primary')}
                onClick={() => {
                  setRepeat(
                    repeat === 'none'
                      ? 'all'
                      : repeat === 'all'
                      ? 'one'
                      : 'none'
                  )
                }}
              >
                {repeat === 'one' ? (
                  <Repeat1 className="h-6 w-6" />
                ) : (
                  <Repeat className="h-6 w-6" />
                )}
                <span className="sr-only">Toggle repeat</span>
              </Button>
            </div>

            {/* Volume controls */}
            <div className="flex items-center gap-4 px-4">
              <ConfirmToggleButton
                variant="ghost"
                size="icon"
                toggledIcon={<><Volume2 className="h-5 w-5" />
                <span className="sr-only">Turn volume on</span></>}
                isToggled={!(isMuted || volume === 0)}
                onToggle={toggleMute}
              >
                <VolumeX className="h-5 w-5" />
                <span className="sr-only">Unmute</span>
              </ConfirmToggleButton>
              <Slider
                value={[volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={([value]) => handleVolumeChange(value)}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
