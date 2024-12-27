import { MusicMetadata } from '@/lib/types/types'
import { initMusicDB } from './schema'

export async function updateMetadata(id: string, metadata: Partial<MusicMetadata>): Promise<void> {
  const db = await initMusicDB()
  const existing = await db.get('metadata', id)
  if (existing) {
    const updated = { ...existing, ...metadata }
    await db.put('metadata', updated)
  }
}

export async function getAllMetadata(): Promise<MusicMetadata[]> {
  const db = await initMusicDB()
  return await db.getAll('metadata')
}

export async function incrementPlayCount(id: string): Promise<void> {
  const db = await initMusicDB()
  const metadata = await db.get('metadata', id)
  if (metadata) {
    metadata.playCount += 1
    metadata.lastPlayed = new Date()
    await db.put('metadata', metadata)
  }
}

export async function markFileAsRemoved(filePath: string): Promise<void> {
  const db = await initMusicDB()
  const tx = db.transaction('metadata', 'readwrite')
  const file = await tx.store.index('by-path').get(filePath)
  if (file) {
    file.removed = true
    await tx.store.put(file)
  }
}