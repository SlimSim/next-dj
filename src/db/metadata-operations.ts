import { MusicMetadata, PlayHistoryEvent } from "@/lib/types/types";
import { initMusicDB } from "./schema";
import { usePlayerStore } from "@/lib/store";

type MetadataUpdate = {
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
  customMetadata?: { [K in `custom_${string}`]: string };
};

export async function updateMetadata(
  id: string,
  metadata: MetadataUpdate
): Promise<void> {
  const db = await initMusicDB();
  const existing = await db.get("metadata", id) as MusicMetadata;
  if (existing) {
    // Create updated metadata object
    const updated = { ...existing };
    
    // Update standard fields
    Object.entries(metadata).forEach(([key, value]) => {
      if (key === 'customMetadata' && value && typeof value === 'object') {
        // Handle custom metadata separately
        updated.customMetadata = {
          ...updated.customMetadata,
          ...(value as { [K in `custom_${string}`]: string })
        };
      } else if (value !== undefined) {
        (updated as any)[key] = value;
      }
    });
    
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

/**
 * Remove a specific play history event from a track
 * @param id The ID of the track
 * @param timestamp The timestamp of the play event to remove
 */
export async function removePlayHistoryEvent(id: string, timestamp: string): Promise<void> {
  const db = await initMusicDB();
  const tx = db.transaction("metadata", "readwrite");
  const store = tx.objectStore("metadata");

  const metadata = await store.get(id);
  if (!metadata || !metadata.playHistory) return;

  // Filter out the specific timestamp
  const filteredHistory = metadata.playHistory.filter(event => 
    event.timestamp !== timestamp
  );

  const updatedMetadata = {
    ...metadata,
    playCount: filteredHistory.length, // Update play count to match the new history length
    playHistory: filteredHistory,
  };

  await store.put(updatedMetadata);
  await tx.done;

  // Trigger a refresh to update the UI
  usePlayerStore.getState().triggerRefresh();
}
