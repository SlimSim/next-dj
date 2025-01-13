import { AudioFile, MusicMetadata } from "@/lib/types/types";
import { initMusicDB } from "./schema";
import { readAudioMetadata } from "@/lib/metadata";

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

  const id = crypto.randomUUID();
  let fileMetadata: any;
  let audioFile: AudioFile;

  if (file instanceof File) {
    fileMetadata = await readAudioMetadata(file);
    audioFile = {
      id,
      file: new Blob([await file.arrayBuffer()], { type: file.type }),
      isReference: false,
      metadata: {
        ...fileMetadata,
        ...metadata,
        id,
        queueId: crypto.randomUUID(),
      },
    };
  } else {
    const actualFile = await file.getFile();
    fileMetadata = await readAudioMetadata(actualFile);
    audioFile = {
      id,
      isReference: true,
      fileHandle: file,
      file: new Blob([await actualFile.arrayBuffer()], {
        type: actualFile.type,
      }),
      metadata: {
        ...fileMetadata,
        ...metadata,
        id,
        queueId: crypto.randomUUID(),
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
    queueId: crypto.randomUUID(),
  };

  try {
    await db.put("audioFiles", audioFile);
    await db.put("metadata", metadataEntry);
    return id;
  } catch (error) {
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
