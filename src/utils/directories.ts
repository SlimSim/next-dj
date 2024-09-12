// src/utils/directories.ts

// import { snackbar } from '@/components/snackbar/snackbar';
// import { snackbar } from '@/components/snackbar/snackbarLogic';
import { notifyAboutDatabaseChanges } from '@/utils/db/channel';
import type { Directory } from '@/types/entities';
import { getDB } from '@/utils/db/get-db';
import type { TrackImportOptions } from '@/types/tarckImport';
import { removeTrackWithTx } from '@/utils/library/tracks';
import { snackbar } from '@/components/snackbar/snackbar';

export interface DirectoryStatus {
  status: 'child' | 'existing' | 'parent';
  existingDir: Directory;
  newDirHandle: FileSystemDirectoryHandle;
}

export const checkNewDirectoryStatus = async (
  existingDir: Directory,
  newDirHandle: FileSystemDirectoryHandle
): Promise<DirectoryStatus | undefined> => {
  const paths = await existingDir.handle.resolve(newDirHandle);

  let status: 'child' | 'existing' | 'parent' | undefined;
  if (paths) {
    status = paths.length === 0 ? 'existing' : 'child';
  } else {
    const parent = await newDirHandle.resolve(existingDir.handle);

    if (parent) {
      status = 'parent';
    }
  }

  if (status) {
    return {
      status,
      existingDir,
      newDirHandle,
    };
  }

  return undefined;
};

class DirectoriesStore {
  private inProgress = new Set<number>();

  isInProgress = (id: number): boolean => this.inProgress.has(id);

  markAsInProgress = (id: number): void => {
    this.inProgress.add(id);
  };

  markAsDone = (id: number): void => {
    this.inProgress.delete(id);
  };
}

export const directoriesStore: DirectoriesStore = new DirectoriesStore();

const importTracksFromDirectory = async (options: TrackImportOptions) => {
  const { importTracksFromDirectory: importDir } = await import(
    '@/utils/library/import-tracks/import-tracks'
  );

  await importDir(options);
};

export const importDirectory = async (newDirectory: FileSystemDirectoryHandle): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction('directories', 'readwrite');

  const [id] = await Promise.all([
    tx.objectStore('directories').add({
      handle: newDirectory,
    } as Directory),
    tx.done,
  ]);

  directoriesStore.markAsInProgress(id);

  notifyAboutDatabaseChanges([
    {
      key: id,
      storeName: 'directories',
      operation: 'add',
      value: {
        handle: newDirectory,
        id,
      },
    },
  ]);

  await importTracksFromDirectory({
    action: 'directory-add',
    dirId: id,
    dirHandle: newDirectory,
  });

  directoriesStore.markAsDone(id);
};

export const importReplaceDirectory = async (
  directoryId: number,
  newDirHandle: FileSystemDirectoryHandle
): Promise<void> => {
  directoriesStore.markAsInProgress(directoryId);

  const db = await getDB();
  const tx = db.transaction('directories', 'readwrite');

  const newDir = {
    id: directoryId,
    handle: newDirHandle,
  } as Directory;

  await Promise.all([tx.objectStore('directories').put(newDir), tx.done]);

  notifyAboutDatabaseChanges([
    {
      key: directoryId,
      storeName: 'directories',
      operation: 'update',
      value: newDir,
    },
  ]);

  await importTracksFromDirectory({
    action: 'directory-replace',
    dirId: directoryId,
    dirHandle: newDirHandle,
  });

  directoriesStore.markAsDone(directoryId);
};

export const removeDirectory = async (directoryId: number): Promise<void> => {
  const db = await getDB();

  directoriesStore.markAsInProgress(directoryId);
  const tx = db.transaction(['directories', 'tracks', 'albums', 'artists'], 'readwrite');

  const [directoryName, tracksToBeRemoved] = await Promise.all([
    tx
      .objectStore('directories')
      .get(directoryId)
      .then((dir) => dir?.handle.name),
    tx.objectStore('tracks').index('directory').getAllKeys(directoryId),
  ]);

  for (const trackId of tracksToBeRemoved) {
    await removeTrackWithTx(tx, trackId);
  }

  await Promise.all([tx.objectStore('directories').delete(directoryId), tx.done]);

  directoriesStore.markAsDone(directoryId);

  notifyAboutDatabaseChanges([
    {
      key: directoryId,
      storeName: 'directories',
      operation: 'delete',
    },
  ]);

  snackbar({
    id: `dir-removed-${directoryId}`,
    message: directoryName ? `Directory "${directoryName}" removed.` : 'Directory removed.',
  });
};