// src/utils/library/import-track-to-db.ts

import { DBChangeRecord, notifyAboutDatabaseChanges } from '@/utils/db/channel';
import {
  Album,
  Artist,
  MusicItemType,
  Track,
  UnknownTrack,
} from '@/types/entities';
import { AppDB, getDB } from '@/utils/db/get-db';
import type { IDBPTransaction } from 'idb';

type Tx = IDBPTransaction<AppDB, ('tracks' | 'albums' | 'artists')[], 'readwrite'>;

const importAlbum = async (tx: Tx, track: Track): Promise<DBChangeRecord | undefined> => {
  if (!track.album) {
    return;
  }

  const store = tx.objectStore('albums');

  const existingAlbum = await store.index('name').get(track.album);
  const updatedAlbum: Omit<Album, 'id'> = existingAlbum
    ? {
        ...existingAlbum,
        year: existingAlbum.year ?? track.year,
        image: existingAlbum.image ?? track.images?.full,
      }
    : {
        type: MusicItemType.Album,
        name: track.album,
        artists: track.artists,
        year: track.year,
        image: track.images?.full,
      };

  // Id will be auto-generated
  const albumId = await store.put(updatedAlbum as Album);

  const change: DBChangeRecord = {
    storeName: 'albums',
    key: albumId,
    value: { ...updatedAlbum, id: albumId },
    operation: existingAlbum ? 'update' : 'add',
  };

  return change;
};

const importArtist = async (tx: Tx, track: Track): Promise<DBChangeRecord[]> => {
  const store = tx.objectStore('artists');
  const changes: DBChangeRecord[] = [];

  for (const artist of track.artists) {
    const existingArtist = await store.index('name').get(artist);

    if (existingArtist) {
      continue;
    }

    const newArtist: Omit<Artist, 'id'> = {
      type: MusicItemType.Artist,
      name: artist,
    };

    const artistId = await store.put(newArtist as Artist);

    const change: DBChangeRecord = {
      storeName: 'artists',
      key: artistId,
      value: { ...newArtist, id: artistId },
      operation: 'add',
    };

    changes.push(change);
  }

  return changes;
};

export const importTrackToDb = async (
  metadata: UnknownTrack,
  existingTrackId: number | undefined
): Promise<void> => {
  const db = await getDB();

  const tx = db.transaction(['tracks', 'albums', 'artists'], 'readwrite');
  const tracksStore = tx.objectStore('tracks');

  const trackId = await tracksStore.put(metadata as Track, existingTrackId);

  const track: Track = {
    ...metadata,
    id: trackId,
  };

  const [albumChange, artistsChanges] = await Promise.all([
    importAlbum(tx, track),
    importArtist(tx, track),
    tx.done,
  ]);

  // TODO: Check if track already exists.

  notifyAboutDatabaseChanges([
    {
      storeName: 'tracks',
      key: trackId,
      value: track,
      operation: 'add',
    },
    ...(albumChange ? [albumChange] : []),
    ...artistsChanges,
  ].filter((change): change is DBChangeRecord => change !== undefined));
};