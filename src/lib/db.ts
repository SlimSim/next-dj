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
  isReference?: boolean
  removed?: boolean
}

interface AudioFile {
  id: string
  file?: Blob
  isReference?: boolean
  fileHandle?: FileSystemFileHandle
}

interface MusicPlayerDB extends DBSchema {
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
      metadataStore.createIndex('by-path', 'path')
    },
  })
}

export async function addAudioFile(file: File | FileSystemFileHandle, metadata: Partial<MusicMetadata>, isReference = false): Promise<string> {
  console.log("Adding audio file:", metadata.path)
  const db = await initDB()
  
  // First check if the file exists
  if (metadata.path) {
    const tx = db.transaction('metadata', 'readwrite')
    const existingFile = await tx.store.index('by-path').get(metadata.path)
    if (existingFile) {
      console.log("File already exists:", metadata.path)
      // If the file was previously marked as removed, clear that flag
      if (existingFile.removed) {
        console.log("File was previously removed, restoring:", metadata.path)
        existingFile.removed = false
        await tx.store.put(existingFile)
      }
      return existingFile.id
    }
  }

  const id = crypto.randomUUID()
  console.log("Creating new file with ID:", id)
  
  let fileMetadata: any
  let audioFile: AudioFile
  
  if (file instanceof File) {
    // For uploaded files, store the actual file
    fileMetadata = await readAudioMetadata(file)
    audioFile = {
      id,
      file: new Blob([await file.arrayBuffer()], { type: file.type }),
      isReference: false
    }
  } else {
    // For referenced files, just get metadata and store the handle
    const actualFile = await file.getFile()
    fileMetadata = await readAudioMetadata(actualFile)
    audioFile = {
      id,
      isReference: true,
      fileHandle: file
    }
  }

  // Store metadata separately
  const metadataEntry: MusicMetadata & { isReference?: boolean } = {
    id,
    title: fileMetadata.title || metadata.title || (file instanceof File ? file.name : (file as FileSystemFileHandle).name),
    artist: fileMetadata.artist || metadata.artist || 'Unknown Artist',
    album: fileMetadata.album || metadata.album || 'Unknown Album',
    duration: metadata.duration || 0,
    playCount: 0,
    path: metadata.path,
    coverArt: metadata.coverArt,
    isReference,
    removed: false // Ensure new files are not marked as removed
  }

  try {
    // Store the audio file
    const audioTx = db.transaction('audioFiles', 'readwrite')
    await audioTx.store.put(audioFile)
    await audioTx.done

    // Store the metadata
    const metadataTx = db.transaction('metadata', 'readwrite')
    await metadataTx.store.put(metadataEntry)
    await metadataTx.done

    console.log("Successfully added file:", metadata.path)
    return id
  } catch (error) {
    console.error("Error adding file:", error)
    throw error
  }
}

export async function getAudioFile(id: string): Promise<AudioFile | undefined> {
  const db = await initDB()
  const audioFile = await db.get('audioFiles', id)
  
  if (audioFile?.isReference && audioFile.fileHandle) {
    try {
      // Get the actual file from the file system for referenced files
      const file = await audioFile.fileHandle.getFile()
      return {
        ...audioFile,
        file: new Blob([await file.arrayBuffer()], { type: file.type })
      }
    } catch (error) {
      console.error('Error accessing referenced file:', error)
      return undefined;
    }
  }
  
  return audioFile
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

export async function markFileAsRemoved(filePath: string): Promise<void> {
  console.log("Marking file as removed:", filePath)
  const db = await initDB()
  const tx = db.transaction('metadata', 'readwrite')
  const file = await tx.store.index('by-path').get(filePath)
  if (file) {
    file.removed = true
    await tx.store.put(file)
    console.log("File marked as removed:", filePath)
  }
}
