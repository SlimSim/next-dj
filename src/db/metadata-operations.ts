import { MusicMetadata, PlayHistoryEvent } from "@/lib/types/types";
import { initMusicDB } from "./schema";
import { usePlayerStore } from "@/lib/store";

export async function updateMetadata(
  id: string,
  metadata: {
    title?: string;
    artist?: string;
    album?: string;
    track?: number;
    year?: number;
    genre?: string[];
    bpm?: number;
    rating?: number;
    comment?: string;
    volume?: number;
    startTime?: number;
    endTimeOffset?: number;
    fadeDuration?: number;
    endTimeFadeDuration?: number;
    [key: string]: any; // Allow custom metadata fields
  }
): Promise<void> {
  const db = await initMusicDB();
  const existing = await db.get("metadata", id);
  if (existing) {
    // Merge existing and new metadata, preserving custom fields
    const updated = { ...existing };
    
    // Update all provided fields, including custom fields
    Object.entries(metadata).forEach(([key, value]) => {
      // For custom fields, ensure empty strings are saved as empty strings
      // rather than being skipped
      if (key.startsWith('custom_') && value === '') {
        updated[key] = '';
      }
      // For other fields, only update if value is defined
      else if (value !== undefined) {
        updated[key] = value;
      }
    });
    
    console.log('Saving metadata with custom fields:', updated); // Debug log
    await db.put("metadata", updated);
  }
}

export async function getAllMetadata(): Promise<MusicMetadata[]> {
  const db = await initMusicDB();
  return await db.getAll("metadata");
}

export async function incrementPlayCount(id: string): Promise<void> {
  const db = await initMusicDB();
  const metadata = await db.get("metadata", id);
  if (metadata) {
    metadata.playCount += 1;
    metadata.lastPlayed = new Date();
    await db.put("metadata", metadata);
  }
}

export async function markFileAsRemoved(filePath: string): Promise<void> {
  const db = await initMusicDB();
  const tx = db.transaction("metadata", "readwrite");
  const file = await tx.store.index("by-path").get(filePath);
  if (file) {
    file.removed = true;
    await tx.store.put(file);
  }
}

export async function recordPlayEvent(id: string): Promise<void> {
  const db = await initMusicDB();
  const tx = db.transaction("metadata", "readwrite");
  const store = tx.objectStore("metadata");

  const metadata = await store.get(id);
  if (!metadata) return;

  const newEvent: PlayHistoryEvent = {
    timestamp: new Date().toISOString(),
  };

  const updatedMetadata = {
    ...metadata,
    playCount: (metadata.playCount || 0) + 1,
    lastPlayed: new Date(),
    playHistory: [...(metadata.playHistory || []), newEvent],
  };

  await store.put(updatedMetadata);
  await tx.done;

  // Trigger a refresh to update the UI
  usePlayerStore.getState().triggerRefresh();
}
