'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'
import { Slider } from './ui/slider'
import { usePlayerStore } from '@/lib/store'
import { formatTime } from '@/lib/utils'
import { incrementPlayCount } from '@/lib/db'
import { AudioFile } from '@/lib/types'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  Volume2,
  VolumeX
} from 'lucide-react'

export function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null)
  const {
    currentTrack,
    isPlaying,
    volume,
    shuffle,
    repeat,
    duration,
    currentTime,
    setIsPlaying,
    setVolume,
    setShuffle,
    setRepeat,
    setDuration,
    setCurrentTime,
  } = usePlayerStore()

  // Load audio file when currentTrack changes
  useEffect(() => {
    if (currentTrack) {
      // Here you would fetch the audio file from IndexedDB using currentTrack.id
      // For now, we'll just set it to null
      setAudioFile(null)
    }
  }, [currentTrack])

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    setCurrentTime(audioRef.current.currentTime)
  }

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return
    setDuration(audioRef.current.duration)
  }

  const handleEnded = () => {
    if (!currentTrack) return
    incrementPlayCount(currentTrack.id)
    // Handle repeat modes and next track logic here
  }

  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return
    const newVolume = value[0]
    audioRef.current.volume = newVolume
    setVolume(newVolume)
  }

  const toggleMute = () => {
    if (!audioRef.current) return
    audioRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleTimeSeek = (value: number[]) => {
    if (!audioRef.current) return
    const newTime = value[0]
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const toggleShuffle = () => {
    setShuffle(!shuffle)
  }

  const toggleRepeat = () => {
    const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all']
    const currentIndex = modes.indexOf(repeat)
    const nextIndex = (currentIndex + 1) % modes.length
    setRepeat(modes[nextIndex])
  }

  if (!currentTrack) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-2">
      {audioFile && (
        <audio 
          ref={audioRef} 
          className="hidden" 
          src={URL.createObjectURL(audioFile.file)} 
          onTimeUpdate={handleTimeUpdate} 
          onLoadedMetadata={handleLoadedMetadata} 
          onEnded={handleEnded} 
        />
      )}

      <div className="flex flex-col gap-2">
        {/* Track info */}
        <div className="text-center">
          <h2 className="text-lg font-semibold">{currentTrack.title}</h2>
          <p className="text-sm text-neutral-500">{currentTrack.artist}</p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration}
            step={0.1}
            onValueChange={handleTimeSeek}
            className="progress-bar"
          />
          <div className="flex justify-between text-sm">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleShuffle}
            className={shuffle ? 'text-primary' : ''}
          >
            <Shuffle className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <SkipBack className="w-5 h-5" />
          </Button>
          <Button onClick={togglePlay} size="icon">
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </Button>
          <Button variant="ghost" size="icon">
            <SkipForward className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleRepeat}
            className={repeat !== 'none' ? 'text-primary' : ''}
          >
            {repeat === 'one' ? (
              <Repeat1 className="w-5 h-5" />
            ) : (
              <Repeat className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Volume control */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleMute}>
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>
          <Slider
            value={[volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="volume-slider"
          />
        </div>
      </div>
    </div>
  )
}
