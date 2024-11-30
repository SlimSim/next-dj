'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
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
  VolumeX,
  ListMusic
} from 'lucide-react'
import { PlayingQueue } from './playing-queue'

export function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const loadingRef = useRef<boolean>(false)
  const currentUrlRef = useRef<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const {
    currentTrack,
    isPlaying,
    volume,
    shuffle,
    repeat,
    duration,
    currentTime,
    isQueueVisible,
    setIsPlaying,
    setVolume,
    setShuffle,
    setRepeat,
    setDuration,
    setCurrentTime,
    setQueueVisible,
    playNextTrack,
    playPreviousTrack,
  } = usePlayerStore()

  const cleanup = useCallback(() => {
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current)
      currentUrlRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current.load()
    }
  }, [])

  const loadAudioFile = useCallback(async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer()
    const blob = new Blob([buffer], { type: file.type })
    return URL.createObjectURL(blob)
  }, [])

  // Load audio file when currentTrack changes
  useEffect(() => {
    let mounted = true

    const initAudio = async () => {
      // Prevent multiple simultaneous loads
      if (loadingRef.current) return
      loadingRef.current = true

      try {
        if (!currentTrack?.file || !audioRef.current) {
          setIsLoading(false)
          return
        }

        setIsLoading(true)
        cleanup()

        const audioUrl = await loadAudioFile(currentTrack.file)
        if (!mounted) {
          URL.revokeObjectURL(audioUrl)
          return
        }

        currentUrlRef.current = audioUrl
        const audio = audioRef.current
        audio.src = audioUrl
        audio.load()

        await new Promise<void>((resolve, reject) => {
          const handleCanPlay = () => {
            resolve()
          }

          const handleError = (e: Event) => {
            const error = (e.target as HTMLAudioElement).error
            reject(new Error(error?.message || 'Failed to load audio'))
          }

          audio.addEventListener('canplay', handleCanPlay, { once: true })
          audio.addEventListener('error', handleError, { once: true })
        })

        if (!mounted) return

        setIsLoading(false)
        if (isPlaying) {
          try {
            await audio.play()
          } catch (error) {
            console.error('Play error:', error)
            setIsPlaying(false)
          }
        }
      } catch (error) {
        if (mounted) {
          console.error('Audio loading error:', error)
          setIsLoading(false)
          setIsPlaying(false)
        }
      } finally {
        loadingRef.current = false
      }
    }

    initAudio().catch(error => {
      if (mounted) {
        console.error('Unhandled audio error:', error)
        setIsLoading(false)
        setIsPlaying(false)
      }
    })

    return () => {
      mounted = false
      cleanup()
    }
  }, [currentTrack, isPlaying, cleanup, loadAudioFile])

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack || isLoading || loadingRef.current) return

    const handlePlay = async () => {
      try {
        if (isPlaying) {
          if (audio.paused) {
            await audio.play()
          }
        } else {
          audio.pause()
        }
      } catch (error) {
        console.error('Playback control error:', error)
        setIsPlaying(false)
      }
    }

    handlePlay()
  }, [isPlaying, currentTrack, isLoading])

  // Handle track ended
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = () => {
      setIsPlaying(false)
      if (currentTrack) {
        incrementPlayCount(currentTrack.id)
      }
    }

    audio.addEventListener('ended', handleEnded)
    return () => audio.removeEventListener('ended', handleEnded)
  }, [currentTrack])

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack || isLoading || loadingRef.current) return
    setIsPlaying(!isPlaying)
  }, [currentTrack, isPlaying, isLoading])

  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    setCurrentTime(audioRef.current.currentTime)
  }

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return
    setDuration(audioRef.current.duration)
  }

  const handleVolumeChange = useCallback((value: number[]) => {
    setVolume(value[0])
  }, [setVolume])

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
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-950 border-t p-4">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />
      <div className="container mx-auto flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {currentTrack && (
              <div className="text-sm">
                <div className="font-medium">{currentTrack.title}</div>
                <div className="text-neutral-500">{currentTrack.artist}</div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShuffle(!shuffle)}
              className={shuffle ? 'text-primary' : ''}
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={playPreviousTrack}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={togglePlay}>
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={playNextTrack}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRepeat(repeat === 'none' ? 'all' : repeat === 'all' ? 'one' : 'none')}
              className={repeat !== 'none' ? 'text-primary' : ''}
            >
              {repeat === 'one' ? (
                <Repeat1 className="h-4 w-4" />
              ) : (
                <Repeat className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex-1 flex justify-end items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQueueVisible(!isQueueVisible)}
              className={isQueueVisible ? 'text-primary' : ''}
            >
              <ListMusic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleMute}>
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <div className="w-24">
              <Slider
                value={[volume]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-neutral-500 w-12">
            {formatTime(currentTime)}
          </div>
          <div className="flex-1">
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 100}
              step={1}
              onValueChange={handleTimeSeek}
            />
          </div>
          <div className="text-sm text-neutral-500 w-12">
            {formatTime(duration)}
          </div>
        </div>
      </div>
      <PlayingQueue />
    </div>
  )
}
