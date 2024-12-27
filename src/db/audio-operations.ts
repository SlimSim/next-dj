import { AudioFile, MusicMetadata } from '@/lib/types/types'
import { initMusicDB } from './schema'
import { readAudioMetadata } from '@/lib/metadata'

export async function deleteAudioFile(id: string): Promise<void> {
  const db = await initMusicDB()
  await db.delete('audioFiles', id)
  await db.delete('metadata', id)
}

export async function addAudioFile(
  file: File | FileSystemFileHandle, 
  metadata: Partial<MusicMetadata>, 
  isReference = false
): Promise<string> {
  const db = await initMusicDB()
  
  if (metadata.path) {
    const tx = db.transaction('metadata', 'readwrite')
    const existingFile = await tx.store.index('by-path').get(metadata.path)
    if (existingFile) {
      if (existingFile.removed) {
        existingFile.removed = false
        await tx.store.put(existingFile)
      }
      return existingFile.id
    }
  }

  const id = crypto.randomUUID()
  let fileMetadata: any
  let audioFile: AudioFile
  
  if (file instanceof File) {
    fileMetadata = await readAudioMetadata(file)
    audioFile = {
      id,
      file: new Blob([await file.arrayBuffer()], { type: file.type }),
      isReference: false
    }
  } else {
    const actualFile = await file.getFile()
    fileMetadata = await readAudioMetadata(actualFile)
    audioFile = {
      id,
      isReference: true,
      fileHandle: file
    }
  }

  const metadataEntry: MusicMetadata & { isReference?: boolean } = {
    id,
    title: fileMetadata.title || metadata.title || (file instanceof File ? file.name : file.name),
    artist: fileMetadata.artist || metadata.artist || 'Unknown Artist',
    album: fileMetadata.album || metadata.album || 'Unknown Album',
    duration: metadata.duration || 0,
    playCount: 0,
    path: metadata.path,
    coverArt: metadata.coverArt,
    isReference,
    removed: false
  }

  try {
    await db.put('audioFiles', audioFile)
    await db.put('metadata', metadataEntry)
    return id
  } catch (error) {
    console.error("Error adding file:", error)
    throw error
  }
}

export async function getAudioFile(id: string): Promise<AudioFile | undefined> {
  const db = await initMusicDB()
  const audioFile = await db.get('audioFiles', id)
  
  if (audioFile?.isReference && audioFile.fileHandle) {
    try {
      const file = await audioFile.fileHandle.getFile()
      return {
        ...audioFile,
        file: new Blob([await file.arrayBuffer()], { type: file.type })
      }
    } catch (error) {
      console.error('Error accessing referenced file:', error)
      return undefined
    }
  }
  
  return audioFile
}