import { MusicMetadata, PlayHistoryEvent } from "@/lib/types/types";
import { updateMetadata, getAllMetadata, incrementPlayCount, recordPlayEvent, removePlayHistoryEvent } from "./metadata-operations";
import { useAuthStore } from "@/lib/firebase/auth-store";
import { syncSingleMetadataToFirestore } from "@/lib/firebase/firestore";
import { SyncService } from "@/lib/firebase/sync-service";

/**
 * Enhanced version of updateMetadata that also syncs to cloud if user is authenticated
 */
export async function updateMetadataWithSync(
  id: string,
  metadata: Record<string, any>
): Promise<void> {
  // First update local metadata
  await updateMetadata(id, metadata);
  
  // Then sync to cloud if user is authenticated
  const user = useAuthStore.getState().user;
  if (user) {
    // Get the updated metadata
    const db = await import('./schema').then(m => m.initMusicDB());
    const updatedTrack = await db.get("metadata", id) as MusicMetadata;
    if (updatedTrack) {
      // Sync this single track to the cloud
      await syncSingleMetadataToFirestore(updatedTrack);
    }
  }
}

/**
 * Enhanced version of incrementPlayCount that also syncs to cloud if user is authenticated
 */
export async function incrementPlayCountWithSync(id: string): Promise<void> {
  // First update local play count
  await incrementPlayCount(id);
  
  // Then sync to cloud if user is authenticated
  const user = useAuthStore.getState().user;
  if (user) {
    // Get the updated metadata
    const db = await import('./schema').then(m => m.initMusicDB());
    const updatedTrack = await db.get("metadata", id) as MusicMetadata;
    if (updatedTrack) {
      // Sync this single track to the cloud
      await syncSingleMetadataToFirestore(updatedTrack);
    }
  }
}

/**
 * Enhanced version of recordPlayEvent that also syncs to cloud if user is authenticated
 */
export async function recordPlayEventWithSync(id: string): Promise<void> {
  // First record play event locally
  await recordPlayEvent(id);
  
  // Then sync to cloud if user is authenticated
  const user = useAuthStore.getState().user;
  if (user) {
    // Get the updated metadata
    const db = await import('./schema').then(m => m.initMusicDB());
    const updatedTrack = await db.get("metadata", id) as MusicMetadata;
    if (updatedTrack) {
      // Sync this single track to the cloud
      await syncSingleMetadataToFirestore(updatedTrack);
    }
  }
}

/**
 * Enhanced version of removePlayHistoryEvent that also syncs to cloud if user is authenticated
 */
export async function removePlayHistoryEventWithSync(id: string, timestamp: string): Promise<void> {
  // First remove play history event locally
  await removePlayHistoryEvent(id, timestamp);
  
  // Then sync to cloud if user is authenticated
  const user = useAuthStore.getState().user;
  if (user) {
    // Get the updated metadata
    const db = await import('./schema').then(m => m.initMusicDB());
    const updatedTrack = await db.get("metadata", id) as MusicMetadata;
    if (updatedTrack) {
      // Sync this single track to the cloud
      await syncSingleMetadataToFirestore(updatedTrack);
    }
  }
}

/**
 * Sync all metadata to cloud
 */
export async function syncAllMetadataToCloud(): Promise<boolean> {
  const user = useAuthStore.getState().user;
  if (!user) {
    console.log('User not authenticated, skipping cloud sync');
    return false;
  }
  
  try {
    const syncService = SyncService.getInstance();
    return await syncService.syncToCloud();
  } catch (error) {
    console.error('Error syncing all metadata to cloud:', error);
    return false;
  }
}

/**
 * Trigger a full metadata sync from cloud
 */
export async function syncAllMetadataFromCloud(): Promise<boolean> {
  const user = useAuthStore.getState().user;
  if (!user) {
    console.log('User not authenticated, skipping cloud sync');
    return false;
  }
  
  try {
    const syncService = SyncService.getInstance();
    return await syncService.syncFromCloud();
  } catch (error) {
    console.error('Error syncing metadata from cloud:', error);
    return false;
  }
}
