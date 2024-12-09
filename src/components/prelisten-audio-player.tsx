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
  }, [prelistenTrack, setIsPrelistening])

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

  // Handle audio device selection
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
