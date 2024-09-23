import { openDB, IDBPDatabase, IDBPObjectStore, DBSchema, StoreNames, IndexNames } from 'idb';
import type { Album, Artist, Directory, Playlist, Track } from '@/types/entities';


export type DbKey<T extends StoreNames<AppDB>> = IDBValidKey & AppDB[T]['key'];

export interface AppDB extends DBSchema {
  tracks: {
    key: number;
    value: Track;
    indexes: {
      id: number;
      name: string;
      album: string;
      year: string;
      duration: number;
      artists: string[];
      directory: number;
      lastScanned: number;
    };
  };
  albums: {
    key: number;
    value: Album;
    indexes: {
      id: number;
      name: string;
      artists: string[];
      year: string;
    };
  };
  artists: {
    key: number;
    value: Artist;
    indexes: {
      id: number;
      name: string;
    };
  };
  playlists: {
    key: number;
    value: Playlist;
    indexes: {
      id: number;
      name: string;
      created: number;
    };
  };
  playlistsTracks: {
    key: [number, number];
    value: {
      playlistId: number;
      trackId: number;
    };
    indexes: {
      playlistId: number;
      trackId: number;
    };
  };
  directories: {
    key: number;
    value: Directory;
    indexes: {
      id: number;
    };
  };
}

export type AppStoreNames = StoreNames<AppDB>;

export const getDB = async (): Promise<IDBPDatabase<AppDB>> => {
  return openDB<AppDB>('app-storage', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('tracks')) {
        const store = db.createObjectStore('tracks', { keyPath: 'id', autoIncrement: true });
        store.createIndex('name', 'name');
        store.createIndex('album', 'album');
        store.createIndex('year', 'year');
        store.createIndex('duration', 'duration');
        store.createIndex('artists', 'artists', { multiEntry: true });
        store.createIndex('directory', 'directory');
        store.createIndex('lastScanned', 'lastScanned');
      }

      if (!db.objectStoreNames.contains('albums')) {
        const store = db.createObjectStore('albums', { keyPath: 'id', autoIncrement: true });
        store.createIndex('name', 'name', { unique: true });
        store.createIndex('artists', 'artists', { multiEntry: true });
        store.createIndex('year', 'year');
      }

      if (!db.objectStoreNames.contains('artists')) {
        const store = db.createObjectStore('artists', { keyPath: 'id', autoIncrement: true });
        store.createIndex('name', 'name', { unique: true });
      }

      if (!db.objectStoreNames.contains('playlists')) {
        const store = db.createObjectStore('playlists', { keyPath: 'id', autoIncrement: true });
        store.createIndex('name', 'name', { unique: true });
        store.createIndex('created', 'created');
      }

      if (!db.objectStoreNames.contains('playlistsTracks')) {
        const store = db.createObjectStore('playlistsTracks', { keyPath: ['playlistId', 'trackId'] });
        store.createIndex('playlistId', 'playlistId');
        store.createIndex('trackId', 'trackId');
      }

      if (!db.objectStoreNames.contains('directories')) {
        db.createObjectStore('directories', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};