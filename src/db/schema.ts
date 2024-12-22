import { openDB } from 'idb'
import { DB_CONFIG } from '../constants'
import { MusicPlayerDB } from '@/lib/types/dbTypes'

export async function initMusicDB() {
  return await openDB<MusicPlayerDB>(DB_CONFIG.MUSIC_DB_NAME, DB_CONFIG.MUSIC_DB_VERSION, {
    upgrade(db) {
      // Audio files store
      if (!db.objectStoreNames.contains('audioFiles')) {
        const audioStore = db.createObjectStore('audioFiles', { keyPath: 'id' })
        audioStore.createIndex('by-title', 'metadata.title')
      }

      // Metadata store
      if (!db.objectStoreNames.contains('metadata')) {
        const metadataStore = db.createObjectStore('metadata', { keyPath: 'id' })
        metadataStore.createIndex('by-title', 'title')
        metadataStore.createIndex('by-artist', 'artist')
        metadataStore.createIndex('by-album', 'album')
        metadataStore.createIndex('by-path', 'path')
      }

      // Handles store
      if (!db.objectStoreNames.contains('handles')) {
        db.createObjectStore('handles')
      }
    },
  })
}