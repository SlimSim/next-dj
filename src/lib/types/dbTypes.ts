import { DBSchema } from "idb"
import { AudioFile, MusicMetadata } from "./types"

export interface MusicPlayerDB extends DBSchema {
    audioFiles: {
      key: string
      value: AudioFile
      indexes: { 'by-title': string }
    }
    metadata: {
      key: string
      value: MusicMetadata & { isReference?: boolean }
      indexes: { 'by-title': string; 'by-artist': string; 'by-album': string; 'by-path': string }
    }
    handles: {
      key: string
      value: FileSystemDirectoryHandle
    }
  }