import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface MusicMetadata {
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

interface AudioFile {
  id: string
  file: Blob
  metadata: MusicMetadata
}

interface MusicPlayerDB extends DBSchema {
  audioFiles: {
    key: string
    value: AudioFile
    indexes: { 'by-title': string }
  }
  metadata: {
    key: string
    value: MusicMetadata
    indexes: { 'by-title': string; 'by-artist': string; 'by-album': string }
  }
}

const DB_NAME = 'music-player-db'
const DB_VERSION = 1

export async function initDB(): Promise<IDBPDatabase<MusicPlayerDB>> {
  return await openDB<MusicPlayerDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Audio files store
      const audioStore = db.createObjectStore('audioFiles', { keyPath: 'id' })
      audioStore.createIndex('by-title', 'metadata.title')

      // Metadata store
      const metadataStore = db.createObjectStore('metadata', { keyPath: 'id' })
      metadataStore.createIndex('by-title', 'title')
      metadataStore.createIndex('by-artist', 'artist')
      metadataStore.createIndex('by-album', 'album')
    },
  })
}

export async function addAudioFile(file: File, metadata: Partial<MusicMetadata>): Promise<string> {
  const db = await initDB()
  const id = crypto.randomUUID()
  
  const audioFile: AudioFile = {
    id,
    file: file,
    metadata: {
      id,
      title: metadata.title || file.name,
      artist: metadata.artist || 'Unknown Artist',
      album: metadata.album || 'Unknown Album',
      duration: metadata.duration || 0,
      playCount: 0,
      path: metadata.path,
      coverArt: metadata.coverArt,
    },
  }

  await db.put('audioFiles', audioFile)
  await db.put('metadata', audioFile.metadata)

  return id
}

export async function getAudioFile(id: string): Promise<AudioFile | undefined> {
  const db = await initDB()
  return await db.get('audioFiles', id)
}

export async function updateMetadata(id: string, metadata: Partial<MusicMetadata>): Promise<void> {
  const db = await initDB()
  const existing = await db.get('metadata', id)
  if (existing) {
    const updated = { ...existing, ...metadata }
    await db.put('metadata', updated)
  }
}

export async function getAllMetadata(): Promise<MusicMetadata[]> {
  const db = await initDB()
  return await db.getAll('metadata')
}

export async function incrementPlayCount(id: string): Promise<void> {
  const db = await initDB()
  const metadata = await db.get('metadata', id)
  if (metadata) {
    metadata.playCount += 1
    metadata.lastPlayed = new Date()
    await db.put('metadata', metadata)
  }
}

export async function deleteAudioFile(id: string): Promise<void> {
  const db = await initDB()
  await db.delete('audioFiles', id)
  await db.delete('metadata', id)
}
