export interface MusicMetadata {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  playCount: number
  lastPlayed?: Date
  path?: string
  coverArt?: string
}

export interface AudioFile {
  id: string
  file: Blob
  metadata: MusicMetadata
}

export type RepeatMode = 'none' | 'one' | 'all'

export interface PlaybackState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  repeat: RepeatMode
  shuffle: boolean
}
