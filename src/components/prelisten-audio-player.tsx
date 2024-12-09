'use client'

import { useEffect, useRef, useState } from 'react'
import { usePlayerStore } from '@/lib/store'
import { getAudioFile } from '@/lib/db'

export const PrelistenAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const currentFileRef = useRef<Blob | null>(null)
  const loadingRef = useRef(false)
  const mountedRef = useRef(true)
  const [isLoading, setIsLoading] = useState(false)

  const {
    prelistenTrack,
    isPrelistening,
    prelistenDeviceId,
    setIsPrelistening,
    setPrelistenTrack,
  } = usePlayerStore()

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
    const loadAudio = async () => {
      if (!prelistenTrack?.id || loadingRef.current) return
      
      loadingRef.current = true
      setIsLoading(true)

      try {
        console.log('Loading prelisten audio for track:', prelistenTrack.id)
        const audioFile = await getAudioFile(prelistenTrack.id)
        
        if (!audioFile || !audioFile.file) {
          throw new Error(`No audio file found for id: ${prelistenTrack.id}`)
        }

        if (!mountedRef.current) return

        // Clean up previous URL if it exists
        if (audioRef.current?.src) {
          URL.revokeObjectURL(audioRef.current.src)
        }

        currentFileRef.current = audioFile.file
        
        if (!audioRef.current) {
          throw new Error('Audio element not initialized')
        }

        // Create new URL and set it
        const url = URL.createObjectURL(audioFile.file)
        console.log('Created prelisten object URL:', url)
        audioRef.current.src = url

        // Wait for the audio to be loaded
        await new Promise<void>((resolve, reject) => {
          if (!audioRef.current) {
            reject(new Error('Audio element not found'))
            return
          }

          const handleCanPlay = () => {
            console.log('Prelisten audio can play')
            if (mountedRef.current) {
              setIsLoading(false)
            }
            resolve()
          }

          const handleError = (error: Event) => {
            console.error('Prelisten audio load error:', error)
            const audioError = audioRef.current?.error
            reject(new Error(`Failed to load prelisten audio: ${audioError?.message || 'Unknown error'}`))
          }
          
          audioRef.current.addEventListener('canplay', handleCanPlay, { once: true })
          audioRef.current.addEventListener('error', handleError, { once: true })
          
          // Force load
          audioRef.current.load()
        })

        console.log('Prelisten audio loaded successfully')
      } catch (error) {
        console.error('Error loading prelisten audio:', error)
        setIsPrelistening(false)
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

    loadAudio()
  }, [prelistenTrack?.id]) // Only re-run when prelistenTrack.id changes

  useEffect(() => {
    if (!audioRef.current || isLoading) return

    if (isPrelistening) {
      audioRef.current.play().catch(error => {
        console.error('Error playing prelisten audio:', error)
        setIsPrelistening(false)
      })
    } else {
      audioRef.current.pause()
    }
  }, [isPrelistening, isLoading, setIsPrelistening])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = () => {
      setIsPrelistening(false)
    }

    audio.addEventListener('ended', handleEnded)
    return () => {
      audio.removeEventListener('ended', handleEnded)
    }
  }, [setIsPrelistening])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      if (prelistenTrack) {
        const newCurrentTime = audio.currentTime;
        const newDuration = audio.duration;

        // Only update if there's a significant change
        if (
          Math.abs(newCurrentTime - (prelistenTrack.currentTime || 0)) > 0.1 ||
          newDuration !== prelistenTrack.duration
        ) {
          setPrelistenTrack({
            ...prelistenTrack,
            currentTime: newCurrentTime,
            duration: newDuration
          });
        }
      }
    };

    const handleLoadedMetadata = () => {
      if (prelistenTrack) {
        setPrelistenTrack({
          ...prelistenTrack,
          duration: audio.duration
        })
      }
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [prelistenTrack, setPrelistenTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !prelistenTrack) return

    // Only update currentTime if the difference is significant
    const timeDifference = Math.abs(audio.currentTime - (prelistenTrack.currentTime || 0))
    if (timeDifference > 1) { // Update only if difference is greater than 1 second
      audio.currentTime = prelistenTrack.currentTime || 0
    }
  }, [prelistenTrack?.currentTime])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !('setSinkId' in audio)) return

    const setAudioDevice = async () => {
      try {
        // @ts-ignore - setSinkId is not in the HTMLAudioElement type yet
        await audio.setSinkId(prelistenDeviceId)
      } catch (error) {
        console.error('Error switching prelisten audio output:', error)
      }
    }

    setAudioDevice()
  }, [prelistenDeviceId])

  return (
    <audio
      ref={audioRef}
      id="prelisten-audio"
      preload="auto"
    />
  )
}
