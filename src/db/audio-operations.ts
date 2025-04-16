import { AudioFile, MusicMetadata } from "@/lib/types/types";
import { initMusicDB } from "./schema";
import { readAudioMetadata } from "@/lib/metadata";
import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a consistent ID based on file properties
 * This ensures the same file gets the same ID across different devices
 */
function generateConsistentId(source: string): string {
  try {
    // We need to generate a deterministic ID that's compatible with UUID format
    // but is completely derived from the source string
    
    // First, normalize the source string (trim and lowercase)
    const normalizedSource = source.trim().toLowerCase();
    
    // Generate multiple hash values from the same source using different seeds
    // This gives us enough pseudo-random but deterministic values for a UUID
    function hashWithSeed(str: string, seed: number): number {
      let hash = seed;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return Math.abs(hash);
    }
    
    // Generate 5 different hash segments with different seeds
    const hash1 = hashWithSeed(normalizedSource, 1).toString(16).padStart(8, '0');
    const hash2 = hashWithSeed(normalizedSource, 2).toString(16).padStart(4, '0');
    const hash3 = hashWithSeed(normalizedSource, 3).toString(16).padStart(4, '0');
    const hash4 = hashWithSeed(normalizedSource, 4).toString(16).padStart(4, '0');
    const hash5 = hashWithSeed(normalizedSource, 5).toString(16).padStart(12, '0');
    
    // Format as UUID (8-4-4-4-12)
    return `${hash1}-${hash2}-${hash3}-${hash4}-${hash5}`;
  } catch (error) {
    console.error('Error generating consistent ID:', error);
    // Fallback to random UUID if hashing fails
    return uuidv4();
  }
}

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

  // Instead of random UUID, generate a consistent hash based on file properties
  let fileMetadata: any;
  let hashSource = '';
  let audioFile: AudioFile;

  try {
    if (file instanceof File) {
      // For regular files (from Add Files button), store the full content
      fileMetadata = await readAudioMetadata(file);
      
      // Create a hash source from stable file properties
      hashSource = `${file.name}-${file.size}-${fileMetadata.duration}-${fileMetadata.artist || ''}-${fileMetadata.album || ''}-${fileMetadata.title || ''}`;
      console.log('Hash source (File):', hashSource);
      
      // Generate a consistent ID based on file properties
      const fileId = generateConsistentId(hashSource);
      console.log('Generated ID from hash:', fileId);
      
      audioFile = {
        id: fileId,
        file: new Blob([await file.arrayBuffer()], { type: file.type }),
        isReference: false,
        metadata: {
          ...fileMetadata,
          ...metadata,
          id: fileId,
          queueId: fileId, // Use the same ID for consistency
        },
      };
    } else {
      // For files from the file system, only store the reference
      const actualFile = await file.getFile();
      fileMetadata = await readAudioMetadata(actualFile);
      
      // Create a hash source from stable file properties
      // Use path if available as it's the most stable identifier for file system files
      hashSource = metadata.path ? 
        metadata.path : 
        `${actualFile.name}-${actualFile.size}-${fileMetadata.duration}-${fileMetadata.artist || ''}-${fileMetadata.album || ''}-${fileMetadata.title || ''}`;
      
      console.log('Hash source (FileSystemHandle):', hashSource);
      
      // Generate a consistent ID based on file properties
      const fileId = generateConsistentId(hashSource);
      console.log('Generated ID from hash:', fileId);
      
      // Create a minimal empty blob as a placeholder (for type compatibility)
      const emptyBlob = new Blob([], { type: actualFile.type });
      
      audioFile = {
        id: fileId,
        isReference: true,
        fileHandle: file,
        file: emptyBlob, // Just a placeholder, not the actual content
        metadata: {
          ...fileMetadata,
          ...metadata,
          id: fileId,
          queueId: fileId, // Use the same ID for consistency
        },
      };
    }

    const metadataEntry: MusicMetadata & { isReference?: boolean } = {
      id: audioFile.id,
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
      queueId: audioFile.id, // Use the same ID for consistency
    };

    try {
      await db.put("audioFiles", audioFile);
      await db.put("metadata", metadataEntry);
      return audioFile.id;
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
  const db = await initMusicDB();
  const audioFile = await db.get("audioFiles", id);

  if (audioFile?.isReference && audioFile.fileHandle) {
    try {
      const file = await audioFile.fileHandle.getFile();
      
      // Check if the stored blob is empty (reference-only mode)
      const isEmptyBlob = audioFile.file && audioFile.file.size === 0;
      
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
  const db = await initMusicDB();
  
  try {
    const metadata = await db.getAll("metadata");
    
    const nonRemovedTracks = metadata.filter(track => !track.removed);
    
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

    await tx.store.put(updatedTrack);
    await tx.done; // Wait for transaction to complete
  } catch (error) {
    console.error('Error updating track:', metadata.id, error); // Debug log
    await tx.abort(); // Abort transaction on error
    throw error;
  }
}
