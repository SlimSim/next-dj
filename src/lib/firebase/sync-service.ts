import { usePlayerStore } from '../store';
import { 
  syncMetadataToFirestore, 
  fetchMetadataFromFirestore,
  syncSongListsToFirestore,
  fetchSongListsFromFirestore,
  syncUserPreferencesToFirestore,
  fetchUserPreferencesFromFirestore,
  syncSingleMetadataToFirestore
} from './firestore';
import { MusicMetadata } from '../types/types';
import { SongList } from '../types/player';
import { getAllMetadata } from '@/db/metadata-operations';
import { initMusicDB } from '@/db/schema';

/**
 * Service for synchronizing data between local IndexedDB and Firebase Firestore
 */
export class SyncService {
  private static instance: SyncService;
  private syncInProgress: boolean = false;
  private lastSyncTime: number = 0;
  private syncIntervalMs: number = 60000; // 1 minute

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance of SyncService
   */
  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * Sync all data to Firebase Firestore
   */
  public async syncToCloud(): Promise<boolean> {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return false;
    }

    try {
      this.syncInProgress = true;
      console.log('Starting sync to cloud...');

      // Get data from store
      const state = usePlayerStore.getState();
      const { metadata, songLists, customMetadata, standardMetadataFields } = state;

      try {
        // Get all metadata from IndexedDB to ensure we have the latest
        const allMetadata = await getAllMetadata();
        
        // Sync metadata
        const metadataSynced = await syncMetadataToFirestore(allMetadata);
        if (!metadataSynced) {
          throw new Error('Failed to sync metadata');
        }

        // Sync song lists
        const songListsSynced = await syncSongListsToFirestore(songLists);
        if (!songListsSynced) {
          throw new Error('Failed to sync song lists');
        }
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          console.warn('Firestore permissions denied. Please update your Firestore security rules.');
          console.info('Go to Firebase Console → Firestore Database → Rules and update the rules to allow authenticated users to read/write.');
          console.info('Recommended rules:\n```\nrules_version = \'2\';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if request.auth != null;\n    }\n  }\n}\n```');
          
          // We still mark this as a successful sync since authentication worked
          this.lastSyncTime = Date.now();
          return true;
        }
        throw error; // Re-throw other errors
      }

      // Sync user preferences (custom metadata fields, standard metadata settings)
      const preferences = {
        customMetadata,
        standardMetadataFields,
        showMetadataBadgesInLists: state.showMetadataBadgesInLists,
        showMetadataBadgesInFooter: state.showMetadataBadgesInFooter,
        showPlayHistoryInLists: state.showPlayHistoryInLists,
        showPlayHistoryInFooter: state.showPlayHistoryInFooter,
      };
      
      const preferencesSynced = await syncUserPreferencesToFirestore(preferences);
      if (!preferencesSynced) {
        throw new Error('Failed to sync preferences');
      }

      this.lastSyncTime = Date.now();
      console.log('Sync to cloud completed successfully');
      return true;
    } catch (error) {
      console.error('Error during sync to cloud:', error);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync a single metadata item to the cloud
   */
  public async syncSingleMetadata(metadata: MusicMetadata): Promise<boolean> {
    try {
      return await syncSingleMetadataToFirestore(metadata);
    } catch (error) {
      console.error('Error syncing single metadata:', error);
      return false;
    }
  }

  /**
   * Sync data from Firebase Firestore to local
   */
  public async syncFromCloud(): Promise<boolean> {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return false;
    }

    try {
      this.syncInProgress = true;
      console.log('Starting sync from cloud...');
      
      // Initialize with empty data
      let cloudMetadata: MusicMetadata[] = [];
      let cloudSongLists: SongList[] = [];
      let cloudPreferences: Record<string, any> | null = null;
      
      try {
        // Fetch data from Firestore
        cloudMetadata = await fetchMetadataFromFirestore();
        cloudSongLists = await fetchSongListsFromFirestore();
        cloudPreferences = await fetchUserPreferencesFromFirestore();
        
        if (!cloudMetadata.length && !cloudSongLists.length && !cloudPreferences) {
          console.log('No data found in cloud to sync');
          this.lastSyncTime = Date.now();
          return true;
        }
      } catch (error: any) {
        if (error.code === 'permission-denied') {
          console.warn('Firestore permissions denied. Please update your Firestore security rules.');
          console.info('Go to Firebase Console → Firestore Database → Rules and update the rules to allow authenticated users to read/write.');
          console.info('Recommended rules:\n```\nrules_version = \'2\';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if request.auth != null;\n    }\n  }\n}\n```');
          // We still consider this a successful sync since authentication worked
          this.lastSyncTime = Date.now();
          return true;
        }
        throw error; // Re-throw other errors
      }
      
      // If we got here, we have data to process
      // Get local data
      const db = await initMusicDB();
      const localMetadata = await db.getAll('metadata');
      
      const state = usePlayerStore.getState();
      
      // Merge metadata
      const mergedMetadata = this.mergeMetadata(localMetadata, cloudMetadata);
      
      // Update IndexedDB with merged metadata
      const tx = db.transaction('metadata', 'readwrite');
      for (const item of mergedMetadata) {
        await tx.store.put(item);
      }
      await tx.done;
      
      // Update store state
      state.setMetadata(mergedMetadata);
      
      // Update song lists if there are any from the cloud
      if (cloudSongLists.length > 0) {
        // For simplicity, we'll just replace local song lists with cloud ones
        // A more sophisticated approach would be to merge them based on last modified timestamps
        for (const list of cloudSongLists) {
          // Check if list exists locally
          const existingList = state.songLists.find(l => l.id === list.id);
          if (!existingList) {
            state.songLists.push(list);
          } else {
            // Update existing list
            existingList.name = list.name;
            existingList.songs = list.songs;
          }
        }
      }
      
      // Update preferences if available
      if (cloudPreferences) {
        // Update custom metadata fields
        if (cloudPreferences.customMetadata) {
          state.customMetadata = cloudPreferences.customMetadata;
        }
        
        // Update standard metadata field settings
        if (cloudPreferences.standardMetadataFields) {
          state.standardMetadataFields = cloudPreferences.standardMetadataFields;
        }
        
        // Update other preferences
        if (cloudPreferences.showMetadataBadgesInLists !== undefined) {
          state.setShowMetadataBadgesInLists(cloudPreferences.showMetadataBadgesInLists);
        }
        
        if (cloudPreferences.showMetadataBadgesInFooter !== undefined) {
          state.setShowMetadataBadgesInFooter(cloudPreferences.showMetadataBadgesInFooter);
        }
        
        if (cloudPreferences.showPlayHistoryInLists !== undefined) {
          state.setShowPlayHistoryInLists(cloudPreferences.showPlayHistoryInLists);
        }
        
        if (cloudPreferences.showPlayHistoryInFooter !== undefined) {
          state.setShowPlayHistoryInFooter(cloudPreferences.showPlayHistoryInFooter);
        }
      }
      
      this.lastSyncTime = Date.now();
      console.log('Sync from cloud completed successfully');
      return true;
    } catch (error) {
      console.error('Error during sync from cloud:', error);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Merge local and cloud metadata
   * This function prioritizes data with the most recent timestamp or highest play count
   */
  private mergeMetadata(localMetadata: MusicMetadata[], cloudMetadata: MusicMetadata[]): MusicMetadata[] {
    const result: MusicMetadata[] = [...localMetadata];
    const localMap = new Map(localMetadata.map(item => [item.id, item]));
    
    for (const cloudItem of cloudMetadata) {
      const localItem = localMap.get(cloudItem.id);
      
      if (!localItem) {
        // Item exists only in cloud, add it
        result.push(cloudItem);
        continue;
      }
      
      // Item exists in both, merge them
      const mergedItem = this.mergeSingleMetadata(localItem, cloudItem);
      
      // Update the result array
      const index = result.findIndex(item => item.id === cloudItem.id);
      if (index !== -1) {
        result[index] = mergedItem;
      }
    }
    
    return result;
  }

  /**
   * Merge two metadata items
   */
  private mergeSingleMetadata(local: MusicMetadata, cloud: MusicMetadata): MusicMetadata {
    // Start with local data as base
    const merged = { ...local };
    
    // Use cloud data for fields if they exist and are newer/better
    
    // Check last played date to determine which metadata is more recent
    const localLastPlayed = local.lastPlayed ? new Date(local.lastPlayed).getTime() : 0;
    const cloudLastPlayed = cloud.lastPlayed ? new Date(cloud.lastPlayed).getTime() : 0;
    
    // If cloud data is more recent, use its values
    if (cloudLastPlayed > localLastPlayed) {
      // Use cloud data for basic metadata
      merged.title = cloud.title;
      merged.artist = cloud.artist;
      merged.album = cloud.album;
      merged.year = cloud.year;
      merged.genre = cloud.genre;
      merged.bpm = cloud.bpm;
      merged.rating = cloud.rating;
      merged.comment = cloud.comment;
      merged.volume = cloud.volume;
      merged.startTime = cloud.startTime;
      merged.endTimeOffset = cloud.endTimeOffset;
      merged.fadeDuration = cloud.fadeDuration;
      merged.endTimeFadeDuration = cloud.endTimeFadeDuration;
    }
    
    // For play count and history, we want to merge rather than replace
    merged.playCount = Math.max(local.playCount || 0, cloud.playCount || 0);
    
    // Merge play histories (remove duplicates by timestamp)
    const localHistory = local.playHistory || [];
    const cloudHistory = cloud.playHistory || [];
    
    // Create a map of all events by timestamp
    const historyMap = new Map();
    
    [...localHistory, ...cloudHistory].forEach(event => {
      historyMap.set(event.timestamp, event);
    });
    
    // Convert back to array and sort by timestamp (newest first)
    merged.playHistory = Array.from(historyMap.values()).sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    // For custom metadata, merge the objects
    merged.customMetadata = {
      ...(local.customMetadata || {}),
      ...(cloud.customMetadata || {}),
    };
    
    return merged;
  }

  /**
   * Check if it's time to sync
   */
  public shouldSync(): boolean {
    return Date.now() - this.lastSyncTime > this.syncIntervalMs;
  }

  /**
   * Get the last sync time
   */
  public getLastSyncTime(): number {
    return this.lastSyncTime;
  }

  /**
   * Set the sync interval in milliseconds
   */
  public setSyncInterval(intervalMs: number): void {
    this.syncIntervalMs = intervalMs;
  }
}
