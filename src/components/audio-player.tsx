'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from './ui/button'
import { Slider } from './ui/slider'
import { usePlayerStore } from '@/lib/store'
import { formatTime } from '@/lib/utils'
import { incrementPlayCount, getAudioFile } from '@/lib/db'
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

export const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const currentFileRef = useRef<Blob | null>(null)
  const loadingRef = useRef(false)
  const mountedRef = useRef(true)
  const [isLoading, setIsLoading] = useState(false)
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null)

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
    playPreviousTrack
  } = usePlayerStore()

  const [isMuted, setIsMuted] = useState(false)

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }, [setCurrentTime])

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }, [setDuration])

  const handleVolumeChange = useCallback((value: number) => {
    setVolume(value)
    if (audioRef.current) {
      audioRef.current.volume = value
    }
  }, [setVolume])

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      const newMuted = !isMuted
      setIsMuted(newMuted)
      audioRef.current.muted = newMuted
    }
  }, [isMuted])

  const handleSeek = useCallback((value: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value
      setCurrentTime(value)
    }
  }, [setCurrentTime])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (audioRef.current?.src) {
        URL.revokeObjectURL(audioRef.current.src)
      }
    }
  }, [])

  useEffect(() => {
    const initAudio = async () => {
      if (loadingRef.current) return
      
      loadingRef.current = true
      setIsLoading(true)

      try {
        if (!currentTrack?.id) {
          console.log('No current track selected')
          return
        }

        console.log('InitAudio - Current track state:', currentTrack)
        console.log('Attempting to restore file from IndexedDB')
        
        const audioFile = await getAudioFile(currentTrack.id)
        if (!audioFile) {
          throw new Error(`No audio file found for id: ${currentTrack.id}`)
        }

        if (!audioFile.file) {
          throw new Error(`Audio file is null for id: ${currentTrack.id}`)
        }

        console.log('Retrieved audio file:', {
          id: currentTrack.id,
          type: audioFile.file.type,
          size: audioFile.file.size,
          isBlob: audioFile.file instanceof Blob
        })

        if (!mountedRef.current) {
          console.log('Component unmounted, aborting initialization')
          return
        }

        currentFileRef.current = audioFile.file
        
        if (!audioRef.current) {
          throw new Error('Audio element not initialized')
        }

        // Clean up previous URL if it exists
        if (audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src)
        }
        
        // Create new URL and set it
        const url = URL.createObjectURL(audioFile.file)
        console.log('Created object URL:', url)
        audioRef.current.src = url

        // Wait for the audio to be loaded
        await new Promise<void>((resolve, reject) => {
          if (!audioRef.current) {
            reject(new Error('Audio element not found'))
            return
          }

          const handleCanPlay = () => {
            console.log('Audio can play event received')
            if (mountedRef.current) {
              setIsLoading(false)
              setDuration(audioRef.current?.duration || 0)
            }
            resolve()
          }

          const handleError = (error: Event) => {
            console.error('Audio load error:', error)
            const audioError = audioRef.current?.error
            reject(new Error(`Failed to load audio: ${audioError?.message || 'Unknown error'}`))
          }
          
          audioRef.current.addEventListener('canplay', handleCanPlay, { once: true })
          audioRef.current.addEventListener('error', handleError, { once: true })
          
          // Force load
          audioRef.current.load()
        })
        
        console.log('Audio loaded successfully')
      } catch (error) {
        console.error('Error initializing audio:', error)
        setIsPlaying(false)
        if (audioRef.current?.src) {
          URL.revokeObjectURL(audioRef.current.src)
          audioRef.current.src = ''
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false)
          loadingRef.current = false
        }
      }
    }

    if (currentTrack) {
      initAudio()
    }

    return () => {
      if (audioRef.current?.src) {
        URL.revokeObjectURL(audioRef.current.src)
      }
    }
  }, [currentTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      console.log('Playing audio')
      audio.play().catch(error => {
        console.error('Error playing audio:', error)
        setIsPlaying(false)
      })
    } else {
      console.log('Pausing audio')
      audio.pause()
    }
  }, [isPlaying, setIsPlaying])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack || isLoading || loadingRef.current) return

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

  const cleanup = useCallback(() => {
    if (currentFileRef.current) {
      URL.revokeObjectURL(URL.createObjectURL(currentFileRef.current))
      currentFileRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current.load()
    }
  }, [])

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="border-t">
        <div className="container flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-4">
            {currentTrack?.coverArt && (
              <img
                src={currentTrack.coverArt}
                alt={currentTrack.title}
                width={40}
                height={40}
                className="aspect-square rounded-md object-cover"
              />
            )}
            <div className="space-y-1">
              <h3 className="text-sm font-medium leading-none">
                {currentTrack?.title || 'No track playing'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {currentTrack?.artist || 'Unknown artist'}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2 md:w-[500px]">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => setQueueVisible(!isQueueVisible)}
              >
                <ListMusic className="h-5 w-5" />
                <span className="sr-only">Toggle queue</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn('shrink-0', shuffle && 'text-primary')}
                onClick={() => setShuffle(!shuffle)}
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
                disabled={!currentTrack || isLoading}
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
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
                className={cn('shrink-0', repeat !== 'none' && 'text-primary')}
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
                  <Repeat1 className="h-5 w-5" />
                ) : (
                  <Repeat className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle repeat</span>
              </Button>
            </div>
            <div className="flex w-full items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                min={0}
                max={duration}
                step={1}
                onValueChange={([value]) => handleSeek(value)}
                className="w-full"
                disabled={!currentTrack}
              />
              <span className="text-xs text-muted-foreground">
                {formatTime(duration)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-5 w-5" />
              ) : volume < 0.5 ? (
                <Volume2 className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle mute</span>
            </Button>
            <Slider
              value={[volume]}
              min={0}
              max={1}
              step={0.1}
              onValueChange={([value]) => handleVolumeChange(value)}
              className="w-[100px]"
            />
          </div>
        </div>
      </div>
      <audio 
        ref={audioRef} 
        onTimeUpdate={handleTimeUpdate} 
        onLoadedMetadata={handleLoadedMetadata} 
        onEnded={() => {
          setIsPlaying(false)
          if (currentTrack) {
            incrementPlayCount(currentTrack.id)
          }
          if (repeat === 'one') {
            setIsPlaying(true)
          } else if (repeat === 'all' || shuffle) {
            playNextTrack()
          }
        }} 
      />
      {isQueueVisible && <PlayingQueue />}
    </div>
  )
}
