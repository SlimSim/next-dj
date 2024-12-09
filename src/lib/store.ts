import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MusicMetadata } from './types'
import { v4 as uuidv4 } from 'uuid'

interface PlayerState {
  currentTrack: MusicMetadata | null
  queue: MusicMetadata[]
  history: MusicMetadata[]
  isPlaying: boolean
  volume: number
  shuffle: boolean
  repeat: 'none' | 'one' | 'all'
  duration: number
  currentTime: number
  isQueueVisible: boolean
  refreshTrigger: number
  audioDevices: MediaDeviceInfo[]
  selectedDeviceId: string
  prelistenDeviceId: string
  prelistenTrack: MusicMetadata | null
  isPrelistening: boolean
}

interface PlayerActions {
  setCurrentTrack: (track: MusicMetadata | null) => void
  addToQueue: (track: MusicMetadata) => void
  removeFromQueue: (id: string) => void
  clearQueue: () => void
  setQueue: (queue: MusicMetadata[]) => void
  addToHistory: (track: MusicMetadata) => void
  removeFromHistory: (id: string) => void
  clearHistory: () => void
  setHistory: (history: MusicMetadata[]) => void
  setIsPlaying: (isPlaying: boolean) => void
  setVolume: (volume: number) => void
  setShuffle: (shuffle: boolean) => void
  setRepeat: (repeat: 'none' | 'one' | 'all') => void
  setDuration: (duration: number) => void
  setCurrentTime: (currentTime: number) => void
  setQueueVisible: (isQueueVisible: boolean) => void
  playNextTrack: () => void
  playPreviousTrack: () => void
  triggerRefresh: () => void
  clearAll: () => void
  setAudioDevices: (devices: MediaDeviceInfo[]) => void
  setSelectedDeviceId: (deviceId: string) => void
  setPrelistenDeviceId: (deviceId: string) => void
  setPrelistenTrack: (track: MusicMetadata | null) => void
  setIsPrelistening: (isPrelistening: boolean) => void
}

type PlayerStore = PlayerState & PlayerActions

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      queue: [],
      history: [],
      isPlaying: false,
      volume: 1,
      shuffle: false,
      repeat: 'none',
      duration: 0,
      currentTime: 0,
      isQueueVisible: false,
      refreshTrigger: 0,
      audioDevices: [],
      selectedDeviceId: 'default',
      prelistenDeviceId: 'default',
      prelistenTrack: null,
      isPrelistening: false,

      setCurrentTrack: (track: MusicMetadata | null) => set({ 
        currentTrack: track ? { ...track, queueId: track.queueId || uuidv4() } : null 
      }),
      
      addToQueue: (track) =>
        set((state) => {
          // Ensure track has queueId
          const trackWithId = { ...track, queueId: track.queueId || uuidv4() }
          if (!state.currentTrack) {
            return { currentTrack: trackWithId, queue: [] }
          }
          return { queue: [...state.queue, trackWithId] }
        }),
      
      removeFromQueue: (id) =>
        set((state) => {
          const newQueue = state.queue.filter((track) => track.queueId !== id)
          if (state.currentTrack?.queueId === id) {
            const nextTrack = newQueue[0] || null
            return { 
              queue: newQueue, 
              currentTrack: nextTrack,
              isPlaying: nextTrack ? state.isPlaying : false 
            }
          }
          return { queue: newQueue }
        }),
      
      clearQueue: () => set((state) => ({ queue: state.currentTrack ? [state.currentTrack] : [] })),
      
      setQueue: (queue) => set({ queue }),
      
      addToHistory: (track) => set((state) => ({ 
        history: [...state.history, { ...track, queueId: track.queueId || uuidv4() }] 
      })),
      
      removeFromHistory: (id) =>
        set((state) => {
          const newHistory = state.history.filter((track) => track.queueId !== id)
          return { history: newHistory }
        }),
      
      clearHistory: () => set({ history: [] }),
      
      setHistory: (history) => set({ history }),
      
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      
      setVolume: (volume) => set({ volume }),
      
      setShuffle: (shuffle) => set({ shuffle }),
      
      setRepeat: (repeat) => set({ repeat }),
      
      setDuration: (duration) => set({ duration }),
      
      setCurrentTime: (currentTime) => set({ currentTime }),
      
      setQueueVisible: (isQueueVisible) => set({ isQueueVisible }),
      
      playNextTrack: () => {
        const { queue: currentQueue, currentTrack, shuffle, repeat } = get()
        if (!currentQueue.length) {
          if (currentTrack) {
            set((state) => ({
              history: [...state.history, currentTrack],
            }))
          }
          if (repeat === 'all' && currentTrack) {
            const trackWithQueueId = { ...currentTrack, queueId: uuidv4() }
            set({ currentTrack: trackWithQueueId, isPlaying: true })
          } else {
            set({ currentTrack: null, isPlaying: false })
          }
          return
        }

        let nextTrack
        let newQueue
        if (shuffle) {
          const randomIndex = Math.floor(Math.random() * currentQueue.length)
          nextTrack = currentQueue[randomIndex]
          newQueue = [...currentQueue]
          newQueue.splice(randomIndex, 1)
        } else {
          [nextTrack, ...newQueue] = [...currentQueue]
        }

        if (currentTrack) {
          set((state) => ({
            history: [...state.history, currentTrack],
          }))
        }

        set({ currentTrack: nextTrack, queue: newQueue, isPlaying: true })
      },

      playPreviousTrack: () => {
        const { history, currentTrack, queue } = get()
        if (!history.length) return

        const previousTrack = history[history.length - 1]
        const newHistory = history.slice(0, -1)

        if (currentTrack) {
          const trackWithQueueId = { ...currentTrack, queueId: uuidv4() }
          set((state) => ({
            queue: [trackWithQueueId, ...state.queue],
          }))
        }

        set({
          currentTrack: previousTrack,
          history: newHistory,
          isPlaying: true,
        })
      },
      
      triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
      
      clearAll: () =>
        set((state) => {
          if (state.isPlaying && state.currentTrack) {
            return { queue: [], history: [] }
          } else {
            return { queue: [], history: [], currentTrack: null, isPlaying: false }
          }
        }),
      
      setAudioDevices: (devices: MediaDeviceInfo[]) => set({ audioDevices: devices }),
      setSelectedDeviceId: (deviceId: string) => set({ selectedDeviceId: deviceId }),
      setPrelistenDeviceId: (deviceId: string) => set({ prelistenDeviceId: deviceId }),
      setPrelistenTrack: (track: MusicMetadata | null) => set({ prelistenTrack: track }),
      setIsPrelistening: (isPrelistening: boolean) => set({ isPrelistening: isPrelistening }),
    }),
    {
      name: 'player-store',
      partialize: (state) => ({
        volume: state.volume,
        shuffle: state.shuffle,
        repeat: state.repeat,
        audioDevices: state.audioDevices,
        selectedDeviceId: state.selectedDeviceId,
        prelistenDeviceId: state.prelistenDeviceId,
        prelistenTrack: state.prelistenTrack,
        isPrelistening: state.isPrelistening,
      }),
    }
  )
)
