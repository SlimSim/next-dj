import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MusicMetadata } from './types'

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
}

interface PlayerActions {
  setCurrentTrack: (track: MusicMetadata | null) => void
  addToQueue: (track: MusicMetadata) => void
  removeFromQueue: (id: string) => void
  clearQueue: () => void
  setQueue: (queue: MusicMetadata[]) => void
  addToHistory: (track: MusicMetadata) => void
  clearHistory: () => void
  setIsPlaying: (isPlaying: boolean) => void
  setVolume: (volume: number) => void
  setShuffle: (shuffle: boolean) => void
  setRepeat: (repeat: 'none' | 'one' | 'all') => void
  setDuration: (duration: number) => void
  setCurrentTime: (time: number) => void
  setQueueVisible: (visible: boolean) => void
  playNextTrack: () => void
  playPreviousTrack: () => void
  triggerRefresh: () => void
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

      setCurrentTrack: (track) => set({ currentTrack: track }),
      
      addToQueue: (track) =>
        set((state) => {
          const newQueue = [...state.queue, track]
          if (!state.currentTrack) {
            return { queue: newQueue, currentTrack: track }
          }
          return { queue: newQueue }
        }),
      
      removeFromQueue: (id) =>
        set((state) => {
          const newQueue = state.queue.filter((track) => track.id !== id)
          if (state.currentTrack?.id === id) {
            const nextTrack = newQueue[0] || null
            return { 
              queue: newQueue, 
              currentTrack: nextTrack,
              isPlaying: nextTrack ? state.isPlaying : false 
            }
          }
          return { queue: newQueue }
        }),
      
      clearQueue: () => set({ queue: [] }),
      
      setQueue: (queue) => set({ queue }),
      
      addToHistory: (track) =>
        set((state) => ({ history: [...state.history, track] })),
      
      clearHistory: () => set({ history: [] }),
      
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      
      setVolume: (volume) => set({ volume }),
      
      setShuffle: (shuffle) => set({ shuffle }),
      
      setRepeat: (repeat) => set({ repeat }),
      
      setDuration: (duration) => set({ duration }),
      
      setCurrentTime: (currentTime) => set({ currentTime }),
      
      setQueueVisible: (isQueueVisible) => set({ isQueueVisible }),
      
      playNextTrack: () => {
        const { queue, currentTrack, shuffle, repeat } = get()
        if (!queue.length) {
          if (repeat === 'all' && currentTrack) {
            set({ currentTrack, isPlaying: true })
          } else {
            set({ currentTrack: null, isPlaying: false })
          }
          return
        }

        let nextTrack
        if (shuffle) {
          const randomIndex = Math.floor(Math.random() * queue.length)
          nextTrack = queue[randomIndex]
          const newQueue = [...queue]
          newQueue.splice(randomIndex, 1)
          set({ queue: newQueue })
        } else {
          [nextTrack, ...queue] = queue
          set({ queue })
        }

        if (currentTrack) {
          set((state) => ({
            history: [...state.history, currentTrack],
          }))
        }

        set({ currentTrack: nextTrack, isPlaying: true })
      },

      playPreviousTrack: () => {
        const { history, currentTrack } = get()
        if (!history.length) return

        const previousTrack = history[history.length - 1]
        const newHistory = history.slice(0, -1)

        if (currentTrack) {
          set((state) => ({
            queue: [currentTrack, ...state.queue],
          }))
        }

        set({
          currentTrack: previousTrack,
          history: newHistory,
          isPlaying: true,
        })
      },
      
      triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
    }),
    {
      name: 'player-store',
      partialize: (state) => ({
        currentTrack: state.currentTrack,
        queue: state.queue,
        history: state.history,
        volume: state.volume,
        shuffle: state.shuffle,
        repeat: state.repeat,
      }),
    }
  )
)
