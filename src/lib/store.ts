import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { createJSONStorage, persist } from 'zustand/middleware'
import { MusicMetadata } from './types'

interface PlayerState {
  currentTrack: MusicMetadata | null
  isPlaying: boolean
  queue: (MusicMetadata & { queueId: string })[]
  volume: number
  shuffle: boolean
  repeat: 'none' | 'one' | 'all'
  duration: number
  currentTime: number
  loading: boolean
  isQueueVisible: boolean
  refreshTrigger: number
}

interface PlayerActions {
  setCurrentTrack: (track: MusicMetadata | null) => void
  setIsPlaying: (isPlaying: boolean) => void
  setQueue: (queue: (MusicMetadata & { queueId: string })[]) => void
  addToQueue: (track: MusicMetadata) => void
  removeFromQueue: (queueId: string) => void
  moveInQueue: (fromIndex: number, toIndex: number) => void
  playNext: (track: MusicMetadata) => void
  playLast: (track: MusicMetadata) => void
  clearQueue: () => void
  setVolume: (volume: number) => void
  setShuffle: (shuffle: boolean) => void
  setRepeat: (repeat: 'none' | 'one' | 'all') => void
  setDuration: (duration: number) => void
  setCurrentTime: (time: number) => void
  setLoading: (loading: boolean) => void
  setQueueVisible: (visible: boolean) => void
  playNextTrack: () => void
  playPreviousTrack: () => void
  triggerRefresh: () => void
}

const initialState: PlayerState = {
  currentTrack: null,
  isPlaying: false,
  queue: [],
  volume: 1,
  shuffle: false,
  repeat: 'none',
  duration: 0,
  currentTime: 0,
  loading: false,
  isQueueVisible: false,
  refreshTrigger: 0,
}

const storage = typeof window !== 'undefined' 
  ? createJSONStorage(() => sessionStorage)
  : undefined

export const usePlayerStore = create(
  persist<PlayerState & PlayerActions>(
    immer((set) => ({
      ...initialState,

      // Queue management
      addToQueue: (track) => set((state) => {
        const queueItem = { ...track, queueId: crypto.randomUUID() }
        state.queue.push(queueItem)
        // If this is the first track, set it as current
        if (!state.currentTrack) {
          state.currentTrack = track
        }
      }),

      playNext: (track) => set((state) => {
        const currentIndex = state.currentTrack 
          ? state.queue.findIndex((t) => t.id === state.currentTrack?.id)
          : -1
        state.queue.splice(currentIndex + 1, 0, track)
      }),

      playLast: (track) => set((state) => {
        state.queue.push(track)
      }),

      removeFromQueue: (queueId) => set((state) => {
        const track = state.queue.find(t => t.queueId === queueId)
        state.queue = state.queue.filter((t) => t.queueId !== queueId)
        // If we removed the current track, set the next one as current
        if (track && state.currentTrack?.id === track.id) {
          const nextTrack = state.queue[0] || null
          state.currentTrack = nextTrack ? { ...nextTrack } : null
          state.isPlaying = false
        }
      }),

      setCurrentTrack: (track) => set((state) => { state.currentTrack = track }),
      setIsPlaying: (isPlaying) => set((state) => { state.isPlaying = isPlaying }),
      setQueue: (queue) => set({ queue }),
      moveInQueue: (fromIndex, toIndex) => set((state) => {
        const track = state.queue[fromIndex]
        state.queue.splice(fromIndex, 1)
        state.queue.splice(toIndex, 0, track)
      }),
      clearQueue: () => set((state) => {
        state.queue = []
        state.currentTrack = null
        state.isPlaying = false
      }),
      setVolume: (volume) => set((state) => { state.volume = volume }),
      setShuffle: (shuffle) => set((state) => { state.shuffle = shuffle }),
      setRepeat: (repeat) => set((state) => { state.repeat = repeat }),
      setDuration: (duration) => set((state) => { state.duration = duration }),
      setCurrentTime: (time) => set((state) => { state.currentTime = time }),
      setLoading: (loading) => set((state) => { state.loading = loading }),
      setQueueVisible: (visible) => set({ isQueueVisible: visible }),
      playNextTrack: () => set((state) => {
        if (state.queue.length === 0) return

        const currentIndex = state.currentTrack 
          ? state.queue.findIndex((track) => track.id === state.currentTrack?.id)
          : -1

        let nextIndex
        if (state.shuffle) {
          // Get random track excluding current
          const availableIndices = state.queue
            .map((_, index) => index)
            .filter(index => index !== currentIndex)
          nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)]
        } else {
          nextIndex = currentIndex + 1
          // Handle repeat all
          if (nextIndex >= state.queue.length && state.repeat === 'all') {
            nextIndex = 0
          }
        }

        if (nextIndex >= 0 && nextIndex < state.queue.length) {
          state.currentTrack = state.queue[nextIndex]
          state.isPlaying = true
        }
      }),
      playPreviousTrack: () => set((state) => {
        if (state.queue.length === 0) return

        const currentIndex = state.currentTrack 
          ? state.queue.findIndex((track) => track.id === state.currentTrack?.id)
          : -1

        let prevIndex = currentIndex - 1
        // Handle repeat all
        if (prevIndex < 0 && state.repeat === 'all') {
          prevIndex = state.queue.length - 1
        }

        if (prevIndex >= 0 && prevIndex < state.queue.length) {
          state.currentTrack = state.queue[prevIndex]
          state.isPlaying = true
        }
      }),
      triggerRefresh: () => set((state) => {
        state.refreshTrigger = Date.now()
      }),
    })),
    {
      name: 'player-store',
      storage,
      skipHydration: true,
    }
  )
)
