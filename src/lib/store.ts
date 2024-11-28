import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { createJSONStorage, persist } from 'zustand/middleware'
import { MusicMetadata } from './types'

interface PlayerState {
  currentTrack: MusicMetadata | null
  isPlaying: boolean
  queue: MusicMetadata[]
  volume: number
  shuffle: boolean
  repeat: 'none' | 'one' | 'all'
  duration: number
  currentTime: number
  loading: boolean
}

interface PlayerActions {
  setCurrentTrack: (track: MusicMetadata | null) => void
  setIsPlaying: (isPlaying: boolean) => void
  setQueue: (queue: MusicMetadata[]) => void
  addToQueue: (track: MusicMetadata) => void
  removeFromQueue: (trackId: string) => void
  setVolume: (volume: number) => void
  setShuffle: (shuffle: boolean) => void
  setRepeat: (repeat: 'none' | 'one' | 'all') => void
  setDuration: (duration: number) => void
  setCurrentTime: (time: number) => void
  setLoading: (loading: boolean) => void
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
}

const storage = typeof window !== 'undefined' 
  ? createJSONStorage(() => sessionStorage)
  : undefined

export const usePlayerStore = create(
  persist(
    immer<PlayerState & PlayerActions>((set) => ({
      ...initialState,
      setCurrentTrack: (track) => set((state) => { state.currentTrack = track }),
      setIsPlaying: (isPlaying) => set((state) => { state.isPlaying = isPlaying }),
      setQueue: (queue) => set((state) => { state.queue = queue }),
      addToQueue: (track) => set((state) => { state.queue.push(track) }),
      removeFromQueue: (trackId) => set((state) => {
        state.queue = state.queue.filter((track) => track.id !== trackId)
      }),
      setVolume: (volume) => set((state) => { state.volume = volume }),
      setShuffle: (shuffle) => set((state) => { state.shuffle = shuffle }),
      setRepeat: (repeat) => set((state) => { state.repeat = repeat }),
      setDuration: (duration) => set((state) => { state.duration = duration }),
      setCurrentTime: (time) => set((state) => { state.currentTime = time }),
      setLoading: (loading) => set((state) => { state.loading = loading }),
    })),
    {
      name: 'player-store',
      storage,
      skipHydration: true,
    }
  )
)
