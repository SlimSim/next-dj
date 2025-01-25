import { openDB } from 'idb'
import { DB_CONFIG } from '../constants'
import { MusicPlayerDB } from '@/lib/types/dbTypes'
import type { IDBPDatabase } from 'idb';

let dbInstance: Promise<IDBPDatabase<MusicPlayerDB>> | null = null;

export async function initMusicDB(): Promise<IDBPDatabase<MusicPlayerDB>> {
  // Only initialize in browser environment
  if (typeof window === 'undefined') {
    // Return a dummy DB during SSR
    return {
      get: async () => undefined,
      getAll: async () => [],
      put: async () => undefined,
      delete: async () => undefined,
      transaction: (storeNames: string | string[], mode?: 'readonly' | 'readwrite' | 'versionchange') => ({
        objectStore: (name: string) => ({
          put: async () => undefined,
          delete: async () => undefined,
          index: (name: string) => ({
            get: async () => undefined,
            getAll: async () => []
          }),
          getAll: async () => []
        }),
        done: Promise.resolve(),
        commit: () => Promise.resolve(),
        abort: () => undefined,
        db: {} as IDBPDatabase<MusicPlayerDB>,
        store: {
          put: async () => undefined,
          delete: async () => undefined,
          index: (name: string) => ({
            get: async () => undefined,
            getAll: async () => []
          }),
          getAll: async () => []
        }
      }),
      objectStoreNames: {
        contains: () => false,
        item: () => null,
        length: 0
      },
      close: () => undefined,
      createObjectStore: () => ({} as any),
      deleteObjectStore: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => true,
      version: 1,
      name: DB_CONFIG.MUSIC_DB_NAME
    } as unknown as IDBPDatabase<MusicPlayerDB>;
  }

  // Return existing instance if available
  if (dbInstance) {
    return dbInstance;
  }

  // Create new instance
  dbInstance = openDB<MusicPlayerDB>(DB_CONFIG.MUSIC_DB_NAME, DB_CONFIG.MUSIC_DB_VERSION, {
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
  });

  return dbInstance;
}