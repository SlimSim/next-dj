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
import { cn } from '@/lib/utils'

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

  const loadAudioFile = useCallback(async (file: File | Blob | null): Promise<string> => {
    try {
      if (!file) {
        throw new Error('No file provided')
      }
      
      if (file instanceof File && !file.type.startsWith('audio/')) {
        throw new Error(`Invalid audio file type: ${file.type}`)
      }
      
      return URL.createObjectURL(file)
    } catch (error) {
      throw error
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const initAudio = async () => {
      if (loadingRef.current) return
      
      loadingRef.current = true

      try {
        if (!currentTrack?.file) {
          setIsLoading(false)
          return
        }

        if (!audioRef.current) {
          setIsLoading(false)
          return
        }

        setIsLoading(true)
        cleanup()

        let audioUrl: string
        try {
          audioUrl = await loadAudioFile(currentTrack.file)
        } catch (error) {
          setIsLoading(false)
          return
        }

        if (!mounted) {
          URL.revokeObjectURL(audioUrl)
          return
        }

        currentUrlRef.current = audioUrl
        const audio = audioRef.current
        
        audio.src = audioUrl
        audio.load()

        await new Promise<void>((resolve, reject) => {
          const handleCanPlay = () => resolve()

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
            setIsPlaying(false)
          }
        }
      } catch (error) {
        if (mounted) {
          setIsLoading(false)
          setIsPlaying(false)
        }
      } finally {
        loadingRef.current = false
      }
    }

    initAudio()

    return () => {
      mounted = false
      cleanup()
    }
  }, [currentTrack, isPlaying, cleanup, loadAudioFile, setIsPlaying])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

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
        setIsPlaying(false)
      }
    }

    handlePlay()
  }, [isPlaying, currentTrack, isLoading])

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
    <div className="bottom-0 left-0 right-0 bg-white dark:bg-neutral-950 p-2 sm:p-3">
      <div className="container max-w-4xl mx-auto">
        <div className="space-y-2 sm:space-y-3">
          {/* Track info */}
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              {currentTrack ? (
                <>
                  <div className="truncate font-medium">
                    {currentTrack.title}
                  </div>
                  {currentTrack.artist && (
                    <div className="truncate text-sm text-muted-foreground">
                      {currentTrack.artist}
                      {currentTrack.album && ` - ${currentTrack.album}`}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-muted-foreground">
                  No track selected
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => setQueueVisible(!isQueueVisible)}
            >
              <ListMusic className="h-5 w-5" />
              <span className="sr-only">Toggle queue</span>
            </Button>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <Slider
              value={[currentTime]}
              max={duration}
              step={1}
              onValueChange={([value]) => {
                if (audioRef.current) {
                  audioRef.current.currentTime = value
                  setCurrentTime(value)
                }
              }}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <div>{formatTime(currentTime)}</div>
              <div>{formatTime(duration)}</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                disabled={!currentTrack}
                onClick={() => setShuffle(!shuffle)}
                className={cn(shuffle && 'text-primary')}
              >
                <Shuffle className="h-5 w-5" />
                <span className="sr-only">Toggle shuffle</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={!currentTrack}
                onClick={playPreviousTrack}
              >
                <SkipBack className="h-5 w-5" />
                <span className="sr-only">Previous track</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12"
                disabled={!currentTrack || isLoading}
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
                <span className="sr-only">
                  {isPlaying ? 'Pause' : 'Play'}
                </span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={!currentTrack}
                onClick={playNextTrack}
              >
                <SkipForward className="h-5 w-5" />
                <span className="sr-only">Next track</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={!currentTrack}
                onClick={() => {
                  const nextRepeat = repeat === 'none' ? 'all' : repeat === 'all' ? 'one' : 'none'
                  setRepeat(nextRepeat)
                }}
                className={cn(repeat !== 'none' && 'text-primary')}
              >
                {repeat === 'one' ? (
                  <Repeat1 className="h-5 w-5" />
                ) : (
                  <Repeat className="h-5 w-5" />
                )}
                <span className="sr-only">Change repeat mode</span>
              </Button>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => {
                  setIsMuted(!isMuted)
                  setVolume(isMuted ? volume || 1 : 0)
                }}
              >
                {volume === 0 || isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle mute</span>
              </Button>
              <Slider
                value={[isMuted ? 0 : volume * 100]}
                max={100}
                step={1}
                onValueChange={([value]) => {
                  const newVolume = value / 100
                  setVolume(newVolume)
                  setIsMuted(newVolume === 0)
                }}
                className="w-24 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onEnded={playNextTrack} />
      <PlayingQueue />
    </div>
  )
}
