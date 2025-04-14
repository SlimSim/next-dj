'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { onSnapshot, collection, query, where, doc } from 'firebase/firestore';
import { useAuthStore } from './auth-store';
import { subscribeToAuthChanges, getCurrentUser } from './auth';
import { SyncService } from './sync-service';
import { db } from './config';
import { usePlayerStore } from '../store';
import { MusicMetadata } from '../types/types';
import { SongList } from '../types/player';
import { initMusicDB } from '@/db/schema';
import React from 'react';

// Create a context for Firebase-related functionality
export interface FirebaseContextType {
  syncToCloud: () => Promise<void>;
  syncFromCloud: () => Promise<void>;
  forceSyncToCloud: () => Promise<boolean>;
}

const FirebaseContext = createContext<FirebaseContextType>({
  syncToCloud: async () => {},
  syncFromCloud: async () => {},
  forceSyncToCloud: async () => false,
});

// Custom hook to use Firebase context
export const useFirebase = () => useContext(FirebaseContext);

// Helper function to find which metadata items changed between states
function findChangedMetadataItems(newMetadata: MusicMetadata[], oldMetadata: MusicMetadata[]): string[] {
  const changedIds: string[] = [];
  
  // Check for modified items
  newMetadata.forEach(newItem => {
    const oldItem = oldMetadata.find(old => old.id === newItem.id);
    
    // If item is new or has been modified
    if (!oldItem || JSON.stringify(newItem) !== JSON.stringify(oldItem)) {
      changedIds.push(newItem.id);
    }
  });
  
  // Check for removed items
  oldMetadata.forEach(oldItem => {
    if (!newMetadata.some(newItem => newItem.id === oldItem.id)) {
      changedIds.push(oldItem.id);
    }
  });
  
  return changedIds;
}

// Helper to detect significant metadata changes that should be synced to cloud
function hasSignificantChanges(newItem: MusicMetadata, oldItem: MusicMetadata): boolean {
  // Check specific fields that we care about syncing
  return (
    newItem.artist !== oldItem.artist ||
    newItem.album !== oldItem.album ||
    newItem.rating !== oldItem.rating ||
    newItem.playCount !== oldItem.playCount ||
    newItem.bpm !== oldItem.bpm ||
    newItem.tempo !== oldItem.tempo ||
    newItem.comment !== oldItem.comment ||
    JSON.stringify(newItem.customMetadata) !== JSON.stringify(oldItem.customMetadata) ||
    JSON.stringify(newItem.playHistory) !== JSON.stringify(oldItem.playHistory)
  );
}

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const { user, isSyncing } = useAuthStore();

  // Track active listeners
  const [activeListeners, setActiveListeners] = useState<(() => void)[]>([]);

  // Set up auth state listener
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((authUser) => {
      useAuthStore.setState({ user: authUser });
      
      // If user logs in, set up listeners
      if (authUser) {
        setupRealtimeListeners(authUser.uid);
      } else {
        // Clean up listeners when user logs out
        cleanupListeners();
      }
    });

    return () => {
      unsubscribe();
      cleanupListeners();
    };
  }, []);

  // Set up periodic sync (every 5 minutes) if user is authenticated
  useEffect(() => {
    if (!user) return;

    const syncService = SyncService.getInstance();
    
    // We don't need to perform initial sync here anymore
    // It's now handled in the auth-store after sign-in
    
    // Set up interval for periodic syncs
    const intervalId = setInterval(async () => {
      // Check if we should sync and we're not already syncing
      if (syncService.shouldSync() && !useAuthStore.getState().isSyncing) {
        try {
          useAuthStore.setState({ isSyncing: true });
          await syncService.syncToCloud();
          useAuthStore.setState({ 
            lastSync: syncService.getLastSyncTime(),
            isSyncing: false 
          });
        } catch (error: any) {
          console.error('Error during periodic sync:', error);
          useAuthStore.setState({ 
            error: error.message || 'Failed to sync to cloud',
            isSyncing: false 
          });
        }
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(intervalId);
  }, [user]);

  // Function to force an immediate sync to the cloud
  const forceSyncToCloud = async () => {
    if (!user) return false;
    
    try {
      console.log('Forcing immediate sync to cloud...');
      const syncService = SyncService.getInstance();
      await syncService.syncToCloud();
      console.log('Forced sync completed successfully');
      return true;
    } catch (error) {
      console.error('Error during forced sync:', error);
      return false;
    }
  };

  // Firebase context value
  const contextValue = {
    syncToCloud: async () => {
      if (!user) {
        useAuthStore.setState({ error: 'User not authenticated' });
        return;
      }

      try {
        useAuthStore.setState({ isSyncing: true });
        const syncService = SyncService.getInstance();
        await syncService.syncToCloud();
        useAuthStore.setState({ 
          lastSync: syncService.getLastSyncTime(),
          isSyncing: false 
        });
      } catch (error: any) {
        console.error('Error syncing to cloud:', error);
        useAuthStore.setState({ 
          error: error.message || 'Failed to sync to cloud',
          isSyncing: false 
        });
      }
    },
    syncFromCloud: async () => {
      if (!user) {
        useAuthStore.setState({ error: 'User not authenticated' });
        return;
      }

      try {
        useAuthStore.setState({ isSyncing: true });
        const syncService = SyncService.getInstance();
        await syncService.syncFromCloud();
        useAuthStore.setState({ 
          lastSync: syncService.getLastSyncTime(),
          isSyncing: false 
        });
      } catch (error: any) {
        console.error('Error syncing from cloud:', error);
        useAuthStore.setState({ 
          error: error.message || 'Failed to sync from cloud',
          isSyncing: false 
        });
      }
    },
    forceSyncToCloud,
  };

  // Set up real-time listeners for Firestore data
  const setupRealtimeListeners = (userId: string) => {
    console.log("setupRealtimeListeners -> userId", userId)
    console.log("db", db);
    if (!db) return;
    
    // Clean up any existing listeners
    cleanupListeners();
    
    const newListeners: (() => void)[] = [];
    
    // 1. Listen for metadata changes
    const metadataQuery = query(
      collection(db, 'metadata'),
      where('userId', '==', userId)
    );
    
    const metadataUnsubscribe = onSnapshot(metadataQuery, (snapshot) => {
      console.log("metadataUnsubscribe -> snapshot", snapshot);
      console.log("snapshot hasPendingWrites", snapshot.metadata.hasPendingWrites);
      // Skip local writes
      if (snapshot.metadata.hasPendingWrites) return;
      
      snapshot.docChanges().forEach(change => {
        console.log("metadataUnsubscribe -> change", change);
        const data = change.doc.data() as any;
        console.log("metadataUnsubscribe -> data", data);
        
        if (!data.id || !data.path) return;
        
        if (change.type === 'added' || change.type === 'modified') {
          // Convert to app's metadata format
          const metadata: MusicMetadata = {
            id: data.id,
            title: data.title || '',
            artist: data.artist || '',
            album: data.album || '',
            duration: 0, // This will be filled when the file is loaded
            playCount: data.playCount || 0,
            playHistory: data.playHistory || [],
            queueId: data.id,
            path: data.path,
            bpm: data.bpm,
            tempo: data.tempo,
            rating: data.rating,
            comment: data.comment,
            track: data.track,
            year: data.year,
            genre: data.genre,
            customMetadata: data.customMetadata,
            lastPlayed: data.lastPlayed ? new Date(data.lastPlayed) : undefined,
          };
          
          // Get the current state
          const state = usePlayerStore.getState();
          
          // Find existing metadata to preserve any fields we don't get from Firestore
          const existingMetadata = state.metadata.find(m => m.id === data.id);
          
          // Log the actual change details
          // Simplified log
          console.log('Cloud update received for:', data.title);
          
          // Set flag to prevent automatic sync back to cloud while processing cloud updates
          cloudUpdateTracker.current.isProcessingCloudUpdate = true;
          cloudUpdateTracker.current.lastProcessedIds.add(data.id);
          cloudUpdateTracker.current.blockSyncUntil = Date.now() + 5000; // Block for 5 seconds
          
          // Simplified log
          console.log('Received cloud update for track:', data.id);
          
          try {
            // For modified documents, prioritize the cloud data over local data
            const mergedMetadata = {
              // Start with existing local metadata (for fields not stored in Firestore)
              ...existingMetadata,
              // Overwrite with cloud metadata (prioritize cloud values)
              ...metadata,
              // Preserve any local data that's critical for playback
              duration: existingMetadata?.duration || 0,
              file: existingMetadata?.file,
              coverArt: existingMetadata?.coverArt
            };
            
            // No need for detailed log
            
            // No need to log store update details
            
            // First, update IndexedDB directly to ensure the data is persisted
            (async () => {
              try {
                // Open the music database
                const musicDB = await initMusicDB();
                
                // Check if the metadata already exists in IndexedDB
                const existingMetadataFromDB = await musicDB.get('metadata', data.id);
                // No need to log DB details
                
                // Update or add the metadata in IndexedDB
                const tx = musicDB.transaction('metadata', 'readwrite');
                await tx.store.put(mergedMetadata);
                await tx.done;
                
                // No need to log every DB update
              } catch (dbError) {
                console.error('Error updating IndexedDB:', dbError);
              }
              
              // Now update the Zustand store with the original method
              const originalUpdateTrackMetadata = usePlayerStore.getState().updateTrackMetadata;
              originalUpdateTrackMetadata(data.id, mergedMetadata);
              
              // Force a refresh trigger to ensure UI updates
              setTimeout(() => {
                // Just trigger refresh without logging
                usePlayerStore.getState().triggerRefresh();
              }, 200);
            })().catch(error => {
              console.error('Error in async IndexedDB update:', error);
            });
          } finally {
            // Clear the flag after a delay to prevent immediate sync back
            setTimeout(() => {
              cloudUpdateTracker.current.isProcessingCloudUpdate = false;
              // Keep the ID in the processed set to continue blocking sync for this specific track
            }, 5000);
            
            // Remove the ID from the blocked list after a shorter period
            setTimeout(() => {
              cloudUpdateTracker.current.lastProcessedIds.delete(data.id);
              // No need to log every unblock
            }, 10000); // 10 seconds before allowing sync for this track again
          }
        }
      });
    });
    
    newListeners.push(metadataUnsubscribe);
    
    // 2. Listen for song list changes
    const songListsQuery = query(
      collection(db, 'songLists'),
      where('userId', '==', userId)
    );
    
    const songListsUnsubscribe = onSnapshot(songListsQuery, (snapshot) => {
      // Skip local writes
      if (snapshot.metadata.hasPendingWrites) return;
      
      const currentLists = [...usePlayerStore.getState().songLists];
      let listsChanged = false;
      
      snapshot.docChanges().forEach(change => {
        const data = change.doc.data() as any;
        
        if (change.type === 'added' || change.type === 'modified') {
          // Create/update song list
          const newList: SongList = {
            id: data.id,
            name: data.name,
            songs: data.songs || [],
            created: data.created || Date.now(),
            modified: data.lastModified?.toMillis() || Date.now(),
          };
          
          // Find existing list to update or add new
          const existingIndex = currentLists.findIndex(list => list.id === data.id);
          if (existingIndex >= 0) {
            // Only update if cloud version is newer
            if (newList.modified > currentLists[existingIndex].modified) {
              currentLists[existingIndex] = newList;
              listsChanged = true;
            }
          } else {
            currentLists.push(newList);
            listsChanged = true;
          }
        } else if (change.type === 'removed') {
          // Remove song list
          const existingIndex = currentLists.findIndex(list => list.id === data.id);
          if (existingIndex >= 0) {
            currentLists.splice(existingIndex, 1);
            listsChanged = true;
          }
        }
      });
      
      // Update store if lists changed
      if (listsChanged) {
        usePlayerStore.setState({ songLists: currentLists });
      }
    });
    
    newListeners.push(songListsUnsubscribe);
    
    // 3. Listen for user preferences changes
    const preferencesDoc = doc(db, 'userPreferences', userId);
    
    const preferencesUnsubscribe = onSnapshot(preferencesDoc, (snapshot) => {
      // Skip local writes
      if (snapshot.metadata.hasPendingWrites) return;
      
      const data = snapshot.data();
      if (!data) return;
      
      // Update store with preferences
      const updates: Partial<ReturnType<typeof usePlayerStore.getState>> = {};
      
      if (data.customMetadata) {
        updates.customMetadata = data.customMetadata;
      }
      
      if (data.standardMetadataFields) {
        updates.standardMetadataFields = data.standardMetadataFields;
      }
      
      if (data.showMetadataBadgesInLists !== undefined) {
        updates.showMetadataBadgesInLists = data.showMetadataBadgesInLists;
      }
      
      if (data.showMetadataBadgesInFooter !== undefined) {
        updates.showMetadataBadgesInFooter = data.showMetadataBadgesInFooter;
      }
      
      if (data.showPlayHistoryInLists !== undefined) {
        updates.showPlayHistoryInLists = data.showPlayHistoryInLists;
      }
      
      if (data.showPlayHistoryInFooter !== undefined) {
        updates.showPlayHistoryInFooter = data.showPlayHistoryInFooter;
      }
      
      // Apply updates if there are any
      if (Object.keys(updates).length > 0) {
        usePlayerStore.setState(updates);
      }
    });
    
    newListeners.push(preferencesUnsubscribe);
    
    // Save active listeners
    setActiveListeners(newListeners);
  };
  
  // Clean up all active listeners
  const cleanupListeners = () => {
    activeListeners.forEach(unsubscribe => unsubscribe());
    setActiveListeners([]);
  };

  // Reference to track if changes came from cloud to prevent sync loop
  const cloudUpdateTracker = React.useRef({
    isProcessingCloudUpdate: false,
    lastProcessedIds: new Set<string>(),
    blockSyncUntil: 0,
    lastSyncAttempt: 0, // Track last sync attempt time
    lastLogTime: 0 // Track last log time to reduce spam
  });
  
  // Listen for local store changes to sync to cloud
  useEffect(() => {
    if (!user) return;
    
    const syncService = SyncService.getInstance();
    
    // Debounce timer for batching updates
    let syncTimer: NodeJS.Timeout | null = null;
    
    // Track last subscription time to avoid excessive processing
    let lastSubscriptionProcessTime = 0;
    const subscriptionThrottleMs = 500; // Only process subscription changes every 500ms
    
    // Subscribe to store changes
    const unsubscribe = usePlayerStore.subscribe((state: any, prevState: any) => {
      // Throttle subscription processing to avoid excessive CPU usage
      const now = Date.now();
      if (now - lastSubscriptionProcessTime < subscriptionThrottleMs) {
        return;
      }
      lastSubscriptionProcessTime = now;
      
      // Skip sync if:  
      // 1. User not authenticated
      // 2. Sync already in progress
      // 3. Currently processing cloud updates
      // 4. Within the blocked time period after a cloud update
      const isBlocked = now < cloudUpdateTracker.current.blockSyncUntil;
      const authState = useAuthStore.getState();
      
      if (!user || authState.isSyncing || cloudUpdateTracker.current.isProcessingCloudUpdate || isBlocked) {
        return;
      }
      
      // Check what changed
      const metadataChanged = state.metadata !== prevState.metadata;
      const songListsChanged = state.songLists !== prevState.songLists;
      const preferencesChanged = 
        state.customMetadata !== prevState.customMetadata ||
        state.standardMetadataFields !== prevState.standardMetadataFields ||
        state.showMetadataBadgesInLists !== prevState.showMetadataBadgesInLists ||
        state.showMetadataBadgesInFooter !== prevState.showMetadataBadgesInFooter ||
        state.showPlayHistoryInLists !== prevState.showPlayHistoryInLists ||
        state.showPlayHistoryInFooter !== prevState.showPlayHistoryInFooter;
      
      // If something changed that we need to sync
      if (metadataChanged || songListsChanged || preferencesChanged) {
        // For metadata changes, we need to check if they were triggered by cloud updates
        if (metadataChanged) {
          // Get the IDs of changed metadata items
          const changedItems = findChangedMetadataItems(state.metadata, prevState.metadata);
          
          // Check if any changes are significant enough to sync
          let hasImportantChanges = false;
          const significantChanges: string[] = [];
          
          changedItems.forEach(id => {
            const newItem = state.metadata.find((item: any) => item.id === id);
            const oldItem = prevState.metadata.find((item: any) => item.id === id);
            
            // If both items exist and there are significant changes
            if (newItem && oldItem && hasSignificantChanges(newItem, oldItem)) {
              hasImportantChanges = true;
              significantChanges.push(id);
            } else if (!oldItem) {
              // New item added
              hasImportantChanges = true;
              significantChanges.push(id);
            }
          });
          
          // Filter out any items that were just updated from the cloud
          const localChangesOnly = significantChanges.filter(id => 
            !cloudUpdateTracker.current.lastProcessedIds.has(id)
          );
          
          if (significantChanges.length > 0 && localChangesOnly.length === 0) {
            // Skip silently - no need to log every time
            return;
          }
          
          if (!hasImportantChanges || localChangesOnly.length === 0) {
            // Skip silently - no need to log every time
            return;
          }
          
          // Only log when we actually have important changes to sync
          console.log('Detected LOCAL changes for sync:', localChangesOnly.length, 'items');
        }
        
        // Only log once when we're actually going to sync
        console.log('Syncing local changes to cloud');
        
        // Clear existing timer
        if (syncTimer) {
          clearTimeout(syncTimer);
        }
        
        // Only sync if we haven't tried in the last 5 seconds
        const syncDebounceTime = 5000; // 5 seconds
        
        if (now - cloudUpdateTracker.current.lastSyncAttempt > syncDebounceTime) {
          // Update last sync attempt time
          cloudUpdateTracker.current.lastSyncAttempt = now;
          
          // Set a new timer to sync changes after delay
          syncTimer = setTimeout(() => {
            syncService.syncToCloud().catch((error: any) => {
              console.error('Error syncing changes to cloud:', error);
            });
          }, 2000); // 2-second delay to batch changes
        }
      }
    });
    
    return () => {
      unsubscribe();
      if (syncTimer) {
        clearTimeout(syncTimer);
      }
    };
  }, [user]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
}
