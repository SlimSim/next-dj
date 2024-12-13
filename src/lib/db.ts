import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { readAudioMetadata } from './metadata'

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
  file?: File
}

interface AudioFile {
  id: string
  file: Blob
  metadata: Omit<MusicMetadata, 'file'>
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
  
  // Read metadata from the file
  const fileMetadata = await readAudioMetadata(file)
  
  console.log('Adding audio file:', {
    originalType: file.type,
    originalSize: file.size,
    metadata: fileMetadata
  })
  
  // Convert File to Blob for storage
  const fileBlob = new Blob([await file.arrayBuffer()], { type: file.type })
  
  console.log('Created file blob:', {
    type: fileBlob.type,
    size: fileBlob.size
  })
  
  const audioFile: AudioFile = {
    id,
    file: fileBlob,
    metadata: {
      id,
      title: fileMetadata.title || metadata.title || file.name,
      artist: fileMetadata.artist || metadata.artist || 'Unknown Artist',
      album: fileMetadata.album || metadata.album || 'Unknown Album',
      duration: metadata.duration || 0,
      playCount: 0,
      path: metadata.path,
      coverArt: metadata.coverArt,
    },
  }

  await db.put('audioFiles', audioFile)
  console.log('Stored audio file in IndexedDB:', id)
  
  await db.put('metadata', audioFile.metadata)
  console.log('Stored metadata in IndexedDB:', id)

  return id
}

export async function getAudioFile(id: string): Promise<AudioFile | undefined> {
  console.log('Getting audio file from IndexedDB:', id)
  const db = await initDB()
  const audioFile = await db.get('audioFiles', id)
  
  console.log('Retrieved audio file:', {
    found: !!audioFile,
    hasFile: !!audioFile?.file,
    fileType: audioFile?.file ? audioFile.file.type : 'none',
    fileSize: audioFile?.file ? audioFile.file.size : 0
  })
  
  if (audioFile) {
    // Ensure the file is a proper Blob
    if (!(audioFile.file instanceof Blob)) {
      console.error('Retrieved file is not a Blob:', audioFile.file)
      return undefined
    }
    return audioFile
  }
  return undefined
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
  const db = await initDB();
  const audioFiles = await db.getAll('audioFiles');
  const metadata = await db.getAll('metadata');
  
  console.log('Retrieved audio files:', audioFiles);
  console.log('Retrieved metadata:', metadata);
  
  // Merge the file data with metadata
  const result = metadata.map(meta => {
    const audioFile = audioFiles.find(af => af.id === meta.id);
    console.log(`Merging metadata for ${meta.id}:`, { meta, audioFile });
    return {
      ...meta,
      file: audioFile?.file as File
    };
  });
  
  console.log('Final merged metadata:', result);
  return result;
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
