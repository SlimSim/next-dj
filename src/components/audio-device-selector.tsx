'use client'

import { useEffect, useState } from 'react'
import { usePlayerStore } from '@/lib/store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

export const AudioDeviceSelector = () => {
  const { 
    audioDevices, 
    selectedDeviceId, 
    setAudioDevices, 
    setSelectedDeviceId, 
    prelistenDeviceId, 
    setPrelistenDeviceId 
  } = usePlayerStore()
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt')

  useEffect(() => {
    const requestPermissionAndGetDevices = async () => {
      try {
        // First request microphone permission to trigger device access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // Stop the stream immediately as we don't need it
        stream.getTracks().forEach(track => track.stop())
        
        setPermissionStatus('granted')

        // Now enumerate devices
        const devices = await navigator.mediaDevices.enumerateDevices()
        const audioOutputDevices = devices.filter(device => device.kind === 'audiooutput')
        setAudioDevices(audioOutputDevices)
        
        // Set default device if none selected
        if (!selectedDeviceId && audioOutputDevices.length > 0) {
          setSelectedDeviceId(audioOutputDevices[0].deviceId || 'default')
        }
      } catch (error) {
        console.error('Error accessing audio devices:', error)
        setPermissionStatus('denied')
      }
    }

    requestPermissionAndGetDevices()

    // Listen for device changes only if we have permission
    const handleDeviceChange = async () => {
      if (permissionStatus === 'granted') {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const audioOutputDevices = devices.filter(device => device.kind === 'audiooutput')
        setAudioDevices(audioOutputDevices)
      }
    }

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
    }
  }, [setAudioDevices, selectedDeviceId, setSelectedDeviceId, permissionStatus])

  const handleDeviceChange = async (deviceId: string) => {
    try {
      const audioElement = document.querySelector('#main-audio')
      if (audioElement && 'setSinkId' in audioElement) {
        // @ts-ignore - setSinkId is not in the HTMLAudioElement type yet
        await audioElement.setSinkId(deviceId)
        setSelectedDeviceId(deviceId)
      }
    } catch (error) {
      console.error('Error switching audio output:', error)
    }
  }

  const handlePrelistenDeviceChange = async (deviceId: string) => {
    try {
      const audioElement = document.querySelector('#prelisten-audio')
      if (audioElement && 'setSinkId' in audioElement) {
        // @ts-ignore - setSinkId is not in the HTMLAudioElement type yet
        await audioElement.setSinkId(deviceId)
        setPrelistenDeviceId(deviceId)
      }
    } catch (error) {
      console.error('Error switching prelisten audio output:', error)
    }
  }

  if (permissionStatus === 'denied') {
    return (
      <div className="flex flex-col gap-2 px-4">
        <p className="text-sm text-red-500">
          Permission to access audio devices was denied. Please allow access in your browser settings.
        </p>
      </div>
    )
  }

  if (audioDevices.length === 0) {
    return (
      <div className="flex flex-col gap-2 px-4">
        <p className="text-sm text-muted-foreground">
          No audio output devices found
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 px-4">
      <label className="text-sm font-medium">Main Audio Output</label>
      <Select value={selectedDeviceId || 'default'} onValueChange={handleDeviceChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select main audio output" />
        </SelectTrigger>
        <SelectContent>
          {audioDevices.map((device) => (
            <SelectItem key={device.deviceId} value={device.deviceId}>
              {device.label || 'Unnamed device'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <label className="text-sm font-medium mt-4">Prelisten Audio Output</label>
      <Select value={prelistenDeviceId || 'default'} onValueChange={handlePrelistenDeviceChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select prelisten audio output" />
        </SelectTrigger>
        <SelectContent>
          {audioDevices.map((device) => (
            <SelectItem key={device.deviceId} value={device.deviceId}>
              {device.label || 'Unnamed device'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
