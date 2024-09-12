// src/workers/importTracksWorker.ts

import { LegacyDirectoryId, MusicItemType, Track } from '@/types/entities';
import { getDB } from '@/utils/db/get-db';
import { getFileHandlesRecursively } from '@/utils/file-system';
import { removeTrackWithTx } from '@/utils/library/tracks';
import { parseTrack } from '@/utils/library/parse-track';
import { TrackImportCount, TrackImportMessage, TrackImportOptions } from '@/types/tarckImport';
import { importTrackToDb } from '@/utils/library/import-track-to-db';


interface ImportTrackOptions {
  unwrappedFile: File;
  file: FileSystemFileHandle;
  directoryId: number;
  /** In cases when track already was imported */
  trackId?: number;
}


const importTrack = async (options: ImportTrackOptions): Promise<boolean> => {
  try {
    const metadata = await parseTrack(options.unwrappedFile);

    if (!metadata) {
      return false;
    }

    await importTrackToDb(
      {
        ...metadata,
        type: MusicItemType.Track,
        file: options.file,
        directory: options.directoryId,
        lastScanned: Date.now(),
      },
      options.trackId
    );

    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

const findTrackByFileHandle = async (handle: FileSystemFileHandle, tracks: Set<Track>): Promise<Track | null> => {
  for (const track of tracks) {
    if (track.file.name === handle.name) {
      const isSame = await handle.isSameEntry(track.file as FileSystemFileHandle);
      if (isSame) {
        return track;
      }
    }
  }
  return null;
};

const processDirectory = async (newDirHandle: FileSystemDirectoryHandle, directoryId: number): Promise<void> => {
  const db = await getDB();
  const existingTracks = await db.getAllFromIndex('tracks', 'directory');

  const handles = await getFileHandlesRecursively(newDirHandle, ['mp3']);

  const count: TrackImportCount = {
    newlyImported: 0,
    existingUpdated: 0,
    removed: 0,
    current: 0,
    total: handles.length,
  };

  const sendMsg = (finished: boolean) => {
    const message: TrackImportMessage = {
      finished,
      count,
    };
    self.postMessage(message);
  };

  const existingTrackSet = new Set(existingTracks);

  for (const handle of handles) {
    try {
      const existingTrack = await findTrackByFileHandle(handle, existingTrackSet);
      const unwrappedFile = await handle.getFile();
      let existingTrackId = undefined;

      if (existingTrack) {
        existingTrackSet.delete(existingTrack);
        if (unwrappedFile.lastModified <= existingTrack.lastScanned) {
          continue;
        }
        existingTrackId = existingTrack.id;
      }

      const success = await importTrack({
        unwrappedFile,
        file: handle,
        directoryId,
        trackId: existingTrackId,
      });

      if (success) {
        if (existingTrackId) {
          count.existingUpdated += 1;
        } else {
          count.newlyImported += 1;
        }
      }

      sendMsg(false);
      count.current += 1;
    } catch (error) {
      console.error('Error processing file:', error);
    }
  }

  const tx = db.transaction(['directories', 'tracks'], 'readwrite');
  for (const track of existingTrackSet) {
    await removeTrackWithTx(tx, track.id).catch(console.warn);
    count.removed += 1;
  }

  sendMsg(true);
};

self.addEventListener('message', async (event: MessageEvent<TrackImportOptions>) => {
  const options = event.data;

  if (options.action === 'directory-replace' || options.action === 'directory-add') {
    await processDirectory(options.dirHandle, options.dirId ?? LegacyDirectoryId.File);
  } else {
    throw new Error('Unsupported action');
  }
});

export {};