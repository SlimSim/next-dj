import React, { useEffect } from 'react';
import { useFirebaseAuth } from '@/lib/firebase/hooks';
import { usePlayerStore } from '@/lib/store';
import { MusicMetadata } from '@/lib/types/types';
import { SyncService } from '@/lib/firebase/sync-service';

/**
 * SyncProvider component handles Firebase synchronization in the background
 * without adding any UI elements.
 */
export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get auth and sync status
  const { user, isSyncing, syncNow } = useFirebaseAuth();
  
  // Get store selectors and actions for data to be synced
  const updateTrackMetadata = usePlayerStore(state => state.updateTrackMetadata);
  const addSongList = usePlayerStore(state => state.addSongList);
  const removeSongList = usePlayerStore(state => state.removeSongList);
  const renameSongList = usePlayerStore(state => state.renameSongList);
  const addSongToList = usePlayerStore(state => state.addSongToList);
  const removeSongFromList = usePlayerStore(state => state.removeSongFromList);

  // Listen for store changes and trigger sync when needed
  useEffect(() => {
    if (!user) return; // Skip if not authenticated
    
    const syncService = SyncService.getInstance();
    
    // Subscribe to store changes
    const unsubscribe = usePlayerStore.subscribe((state, prevState) => {
      // Only sync when user is authenticated and not already syncing
      if (!user || isSyncing) return;
      
      // Check for metadata changes
      if (state.metadata !== prevState.metadata) {
        // Find changed metadata items by comparing current and previous state
        const changedItems = state.metadata.filter(item => {
          const prevItem = prevState.metadata.find(p => p.id === item.id);
          if (!prevItem) return true; // New item
          
          // Compare relevant fields to detect changes
          return (
            item.rating !== prevItem.rating ||
            item.playCount !== prevItem.playCount ||
            item.lastPlayed !== prevItem.lastPlayed ||
            item.playHistory !== prevItem.playHistory ||
            item.bpm !== prevItem.bpm ||
            item.tempo !== prevItem.tempo ||
            item.comment !== prevItem.comment ||
            JSON.stringify(item.customMetadata) !== JSON.stringify(prevItem.customMetadata)
          );
        });
        
        // Sync only the changed items
        if (changedItems.length > 0) {
          // Debounce the sync to avoid too many Firestore operations
          const debouncedSync = setTimeout(() => {
            changedItems.forEach(item => {
              syncService.syncSingleMetadata(item).catch(error => {
                console.error(`Failed to sync metadata for ${item.title}:`, error);
              });
            });
          }, 2000); // Wait 2 seconds before syncing
          
          return () => clearTimeout(debouncedSync);
        }
      }
      
      // Check for song list changes
      if (state.songLists !== prevState.songLists) {
        // Trigger a full sync of song lists
        // Debounce to avoid excessive writes
        const debouncedSync = setTimeout(() => {
          syncService.syncToCloud().catch(error => {
            console.error('Failed to sync song lists:', error);
          });
        }, 2000); // Wait 2 seconds before syncing
        
        return () => clearTimeout(debouncedSync);
      }
      
      // Check for preferences changes
      if (
        state.customMetadata !== prevState.customMetadata ||
        state.standardMetadataFields !== prevState.standardMetadataFields ||
        state.showMetadataBadgesInLists !== prevState.showMetadataBadgesInLists ||
        state.showMetadataBadgesInFooter !== prevState.showMetadataBadgesInFooter ||
        state.showPlayHistoryInLists !== prevState.showPlayHistoryInLists ||
        state.showPlayHistoryInFooter !== prevState.showPlayHistoryInFooter
      ) {
        // Debounce preference syncs
        const debouncedSync = setTimeout(() => {
          syncService.syncToCloud().catch(error => {
            console.error('Failed to sync preferences:', error);
          });
        }, 2000); // Wait 2 seconds before syncing
        
        return () => clearTimeout(debouncedSync);
      }
    });
    
    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, [user, isSyncing]);

  // Patch store methods to automatically sync changes
  useEffect(() => {
    if (!user) return;
    
    const originalUpdateTrackMetadata = updateTrackMetadata;
    const syncService = SyncService.getInstance();
    
    // Override updateTrackMetadata to also sync to Firebase
    usePlayerStore.setState({
      updateTrackMetadata: (trackId: string, updates: Partial<MusicMetadata>) => {
        // Call the original function to update local state
        originalUpdateTrackMetadata(trackId, updates);
        
        // Get the updated metadata and sync it
        const metadata = usePlayerStore.getState().metadata.find(m => m.id === trackId);
        if (metadata && user) {
          setTimeout(() => {
            syncService.syncSingleMetadata(metadata).catch(e => {
              console.error('Error syncing metadata change:', e);
            });
          }, 500);
        }
      }
    });
    
    // Restore original methods when unmounting
    return () => {
      usePlayerStore.setState({
        updateTrackMetadata: originalUpdateTrackMetadata
      });
    };
  }, [user, updateTrackMetadata]);

  // This component doesn't render anything itself
  return <>{children}</>;
};
