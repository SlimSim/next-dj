import { AudioFile, MusicMetadata } from "@/lib/types/types";
import { initMusicDB } from "./schema";
import { readAudioMetadata } from "@/lib/metadata";
import { v4 as uuidv4 } from 'uuid';

export async function deleteAudioFile(id: string): Promise<void> {
  const db = await initMusicDB();
  await db.delete("audioFiles", id);
  await db.delete("metadata", id);
}

export async function addAudioFile(
  file: File | FileSystemFileHandle,
  metadata: Partial<MusicMetadata>,
  isReference = false
): Promise<string> {
  const db = await initMusicDB();

  if (metadata.path) {
    const tx = db.transaction("metadata", "readwrite");
    const existingFile = await tx.store.index("by-path").get(metadata.path);
    if (existingFile) {
      if (existingFile.removed) {
        existingFile.removed = false;
        await tx.store.put(existingFile);
      }
      return existingFile.id;
    }
  }

  const id = uuidv4();
  let fileMetadata: any;
  let audioFile: AudioFile;

  try {
    if (file instanceof File) {
      // For regular files (from Add Files button), store the full content
      fileMetadata = await readAudioMetadata(file);
      audioFile = {
        id,
        file: new Blob([await file.arrayBuffer()], { type: file.type }),
        isReference: false,
        metadata: {
          ...fileMetadata,
          ...metadata,
          id,
          queueId: uuidv4(),
        },
      };
    } else {
      // For files from the file system, only store the reference
      const actualFile = await file.getFile();
      fileMetadata = await readAudioMetadata(actualFile);
      
      // Create a minimal empty blob as a placeholder (for type compatibility)
      const emptyBlob = new Blob([], { type: actualFile.type });
      
      audioFile = {
        id,
        isReference: true,
        fileHandle: file,
        file: emptyBlob, // Just a placeholder, not the actual content
        metadata: {
          ...fileMetadata,
          ...metadata,
          id,
          queueId: uuidv4(),
        },
      };
    }

    const metadataEntry: MusicMetadata & { isReference?: boolean } = {
      id,
      title:
        fileMetadata.title ||
        metadata.title ||
        (file instanceof File ? file.name : "Unknown Title"),
      artist: fileMetadata.artist || metadata.artist || "Unknown Artist",
      album: fileMetadata.album || metadata.album || "Unknown Album",
      duration: fileMetadata.duration || metadata.duration || 0,
      tempo: fileMetadata.tempo || metadata.tempo,
      rating: fileMetadata.rating || metadata.rating,
      comment: fileMetadata.comment || metadata.comment,
      track: fileMetadata.track || metadata.track,
      bpm: fileMetadata.bpm || metadata.bpm,
      year: fileMetadata.year || metadata.year,
      genre: fileMetadata.genre || metadata.genre,
      playCount: 0,
      playHistory: [],  // Initialize empty play history
      path: metadata.path,
      coverArt: metadata.coverArt,
      isReference,
      removed: false,
      queueId: uuidv4(),
    };

    try {
      await db.put("audioFiles", audioFile);
      await db.put("metadata", metadataEntry);
      return id;
    } catch (error: any) {
      console.error("Error adding file:", error);
      throw error;
    }
  } catch (error: any) {
    console.error("Error adding file:", error);
    throw error;
  }
}

export async function getAudioFile(id: string): Promise<AudioFile | undefined> {
  console.log("Getting audio file for id:", id);
  const db = await initMusicDB();
  const audioFile = await db.get("audioFiles", id);
  console.log("Found audio file:", audioFile);

  if (audioFile?.isReference && audioFile.fileHandle) {
    try {
      console.log("Attempting to access referenced file");
      const file = await audioFile.fileHandle.getFile();
      console.log("Successfully accessed file:", file.name);
      
      // Check if the stored blob is empty (reference-only mode)
      const isEmptyBlob = audioFile.file && audioFile.file.size === 0;
      
      if (isEmptyBlob) {
        console.log("File was stored in reference-only mode, loading content from file system");
      }
      
      // Always return a fresh blob from the file system for referenced files
      return {
        ...audioFile,
        file: new Blob([await file.arrayBuffer()], { type: file.type }),
      };
    } catch (error) {
      console.error("Error accessing referenced file:", error);
      // When file is not found, mark it as removed in metadata
      const metadata = await db.get("metadata", id);
      if (metadata && !metadata.removed) {
        console.log("Marking file as removed in metadata");
        metadata.removed = true;
        const tx = db.transaction("metadata", "readwrite");
        await tx.store.put(metadata);
        // Trigger a refresh in the player store
        const { usePlayerStore } = await import("@/lib/store");
        usePlayerStore.getState().triggerRefresh();
      }
      return undefined;
    }
  }

  return audioFile;
}

export async function getRemovedSongs(): Promise<MusicMetadata[]> {
  const db = await initMusicDB();
  const metadata = await db.getAll("metadata");
  return metadata.filter((entry) => entry.removed);
}

export async function getAllMetadata(): Promise<MusicMetadata[]> {
  console.log("getAllMetadata: Starting to fetch all metadata");
  const db = await initMusicDB();
  console.log("getAllMetadata: Database initialized");
  
  try {
    const metadata = await db.getAll("metadata");
    console.log(`getAllMetadata: Retrieved ${metadata.length} total tracks from database`);
    
    const nonRemovedTracks = metadata.filter(track => !track.removed);
    console.log(`getAllMetadata: Filtered to ${nonRemovedTracks.length} non-removed tracks`);
    
    return nonRemovedTracks;
  } catch (error) {
    console.error("getAllMetadata: Error fetching metadata:", error);
    return [];
  }
}

export async function getUniqueValues(): Promise<{
  artists: string[];
  albums: string[];
  genres: string[];
}> {
  const db = await initMusicDB();
  const metadata = await db.getAll("metadata");
  
  const artists = new Set<string>();
  const albums = new Set<string>();
  const genres = new Set<string>();

  metadata.forEach((item) => {
    if (!item.removed) {
      if (item.artist) artists.add(item.artist);
      if (item.album) albums.add(item.album);
      if (item.genre) {
        item.genre.forEach(genre => {
          if (genre) genres.add(genre);
        });
      }
    }
  });

  return {
    artists: Array.from(artists).sort(),
    albums: Array.from(albums).sort(),
    genres: Array.from(genres).sort(),
  };
}

export async function updateAudioMetadata(metadata: MusicMetadata): Promise<void> {
  console.log('Updating metadata for track:', metadata.id); // Debug log
  
  if (!metadata?.id) {
    console.error('Invalid metadata: missing id', metadata); // Debug log
    throw new Error('Invalid metadata: missing id');
  }

  const db = await initMusicDB();
  const tx = db.transaction("metadata", "readwrite");
  
  try {
    // Check if track exists
    const existingTrack = await tx.store.get(metadata.id);
    if (!existingTrack) {
      console.error('Track not found:', metadata.id); // Debug log
      throw new Error(`Track not found: ${metadata.id}`);
    }

    const updatedTrack = {
      ...existingTrack,
      ...metadata,
      // Preserve these fields from the existing track
      playCount: existingTrack.playCount,
      playHistory: existingTrack.playHistory,
      isReference: existingTrack.isReference,
      path: existingTrack.path,
      removed: existingTrack.removed,
    };

    console.log('Updating track with data:', updatedTrack); // Debug log
    await tx.store.put(updatedTrack);
    await tx.done; // Wait for transaction to complete
    console.log('Successfully updated track:', metadata.id); // Debug log
  } catch (error) {
    console.error('Error updating track:', metadata.id, error); // Debug log
    await tx.abort(); // Abort transaction on error
    throw error;
  }
}
