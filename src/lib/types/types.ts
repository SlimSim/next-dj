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
  file?: File
  queueId: string
  removed?: boolean
}

export interface AudioFile {
  id: string
  file: Blob
  metadata: MusicMetadata
  isReference?: boolean
  fileHandle?: FileSystemFileHandle
}

export type RepeatMode = 'none' | 'one' | 'all'

export interface PlaybackState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
}
