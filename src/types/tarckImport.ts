// src/types/trackImport.ts

export interface TrackImportCount {
    /** Count of how many tracks were newly added */
    newlyImported: number;
    /** Count of how many existing tracks were updated */
    existingUpdated: number;
    /** Count of how many tracks were removed */
    removed: number;
    /** Index of currently scanned track */
    current: number;
    /** Total count of tracks */
    total: number;
  }
  
  export interface TrackImportMessage {
    finished: boolean;
    count: TrackImportCount;
  }
  
  export type TrackImportOptions =
    | {
        action: 'directory-replace';
        dirId: number;
        dirHandle: FileSystemDirectoryHandle;
      }
    | {
        action: 'directory-add';
        dirId: number;
        dirHandle: FileSystemDirectoryHandle;
      }
    | {
        action: 'file-handles-add';
        files: FileSystemFileHandle[];
      }
    | {
        action: 'files-add';
        files: File[];
      };