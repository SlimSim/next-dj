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
  VolumeX
} from 'lucide-react'

export function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
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
    setIsPlaying,
    setVolume,
    setShuffle,
    setRepeat,
    setDuration,
    setCurrentTime,
  } = usePlayerStore()

  // Load audio file when currentTrack changes
  useEffect(() => {
    if (currentTrack?.file) {
      console.log('Loading track with file:', currentTrack);
      setIsLoading(true);
      
      const loadAudio = async () => {
        try {
          if (audioRef.current) {
            // Get fresh file handle and read the file
            const file = currentTrack.file;
            const arrayBuffer = await file.arrayBuffer();
            const blob = new Blob([arrayBuffer], { type: file.type });
            const fileUrl = URL.createObjectURL(blob);
            
            console.log('Created URL:', fileUrl);
            console.log('File type:', file.type);
            
            audioRef.current.src = fileUrl;
            audioRef.current.volume = volume;
            
            // Force a reload of the audio element
            audioRef.current.load();
            console.log('Audio element after load:', {
              src: audioRef.current.src,
              readyState: audioRef.current.readyState,
              paused: audioRef.current.paused,
              volume: audioRef.current.volume,
              duration: audioRef.current.duration
            });

            // Add event listeners for debugging
            const handleCanPlay = () => {
              console.log('Audio can play event fired');
              console.log('Audio state:', {
                src: audioRef.current?.src,
                readyState: audioRef.current?.readyState,
                paused: audioRef.current?.paused,
                volume: audioRef.current?.volume,
                duration: audioRef.current?.duration
              });
              setIsLoading(false);
              // Only start playing if this is a new track
              if (isPlaying && !audioRef.current?.paused) {
                audioRef.current?.play()
                  .then(() => console.log('Playback started successfully'))
                  .catch(error => {
                    console.error('Error playing audio:', error);
                    setIsPlaying(false);
                  });
              }
            };

            const handleError = (e: Event) => {
              const error = (e.target as HTMLAudioElement).error;
              console.error('Audio error:', error?.message);
              console.error('Audio error code:', error?.code);
              console.error('Audio element state:', {
                src: audioRef.current?.src,
                readyState: audioRef.current?.readyState,
                networkState: audioRef.current?.networkState,
                error: audioRef.current?.error
              });
              setIsLoading(false);
              setIsPlaying(false);
            };

            audioRef.current.addEventListener('canplay', handleCanPlay);
            audioRef.current.addEventListener('error', handleError);
            audioRef.current.addEventListener('loadedmetadata', () => console.log('Metadata loaded'));
            audioRef.current.addEventListener('loadeddata', () => console.log('Data loaded'));
            audioRef.current.addEventListener('playing', () => console.log('Playing started'));
            audioRef.current.addEventListener('pause', () => console.log('Audio paused'));
            
            // Clean up function
            return () => {
              if (audioRef.current) {
                audioRef.current.removeEventListener('canplay', handleCanPlay);
                audioRef.current.removeEventListener('error', handleError);
                audioRef.current.removeEventListener('loadedmetadata', () => {});
                audioRef.current.removeEventListener('loadeddata', () => {});
                audioRef.current.removeEventListener('playing', () => {});
                audioRef.current.removeEventListener('pause', () => {});
                audioRef.current.pause();
                audioRef.current.src = '';
              }
              URL.revokeObjectURL(fileUrl);
            };
          }
        } catch (error) {
          console.error('Error loading audio file:', error);
          setIsLoading(false);
          setIsPlaying(false);
        }
      };

      loadAudio();
    }
  }, [currentTrack, volume]);

  // Handle play/pause state changes
  useEffect(() => {
    if (!audioRef.current || !currentTrack || isLoading) return;

    console.log('Play state changed:', isPlaying);
    if (isPlaying) {
      audioRef.current.play()
        .then(() => console.log('Playback started/resumed'))
        .catch(error => {
          console.error('Error playing audio:', error);
          setIsPlaying(false);
        });
    } else {
      audioRef.current.pause();
      console.log('Playback paused');
    }
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack || isLoading) return;
    console.log('Toggle play, current state:', isPlaying);
    setIsPlaying(!isPlaying);
  }, [currentTrack, isPlaying, isLoading]);

  // Handle play state changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      setIsPlaying(false)
      if (currentTrack) {
        incrementPlayCount(currentTrack.id)
      }
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [currentTrack])

  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    setCurrentTime(audioRef.current.currentTime)
  }

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return
    setDuration(audioRef.current.duration)
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
            <Button variant="ghost" size="icon">
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={togglePlay}>
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon">
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
    </div>
  )
}
