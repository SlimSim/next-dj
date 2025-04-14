import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from './config';
import { subscribeToAuthChanges, getCurrentUser } from './auth';
import { SyncService } from './sync-service';
import { usePlayerStore } from '../store';
import { MusicMetadata } from '../types/types';
import { SongList } from '../types/player';

/**
 * Hook for Firebase authentication and sync management
 */
export const useFirebaseAuth = () => {
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  // Get reference to sync service
  const syncService = SyncService.getInstance();
  
  // Get player store methods
  const updateTrackMetadata = usePlayerStore(state => state.updateTrackMetadata);
  const setMetadata = usePlayerStore(state => state.setMetadata);
  const songLists = usePlayerStore(state => state.songLists);
  const standardMetadataFields = usePlayerStore(state => state.standardMetadataFields);
  const customMetadata = usePlayerStore(state => state.customMetadata);
  
  // Effect to handle auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (newUser) => {
      setUser(newUser);
      setLoading(false);
      
      if (newUser) {
        // User signed in, trigger sync from cloud
        try {
          setIsSyncing(true);
          setError(null);
          
          // First, sync from cloud to get latest data
          const syncResult = await syncService.syncFromCloud();
          
          if (syncResult) {
            console.log('Successfully synced data from cloud');
            setLastSyncTime(new Date());
          } else {
            console.warn('Sync from cloud completed with warnings');
          }
          
          // Set up listeners for real-time updates
          setupFirestoreListeners(newUser.uid);
          
        } catch (e) {
          console.error('Error during initial sync:', e);
          setError('Failed to sync data from cloud');
        } finally {
          setIsSyncing(false);
        }
      } else {
        // User signed out, clean up listeners and reset sync state
        setLastSyncTime(null);
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  // Effect to sync changes to cloud periodically
  useEffect(() => {
    if (!user) return;
    
    // Initial sync to cloud after loading data from cloud
    const initialSync = async () => {
      try {
        await syncService.syncToCloud();
        setLastSyncTime(new Date());
      } catch (e) {
        console.error('Error during initial sync to cloud:', e);
      }
    };
    
    // Set up periodic sync
    const syncInterval = setInterval(async () => {
      if (user && !isSyncing) {
        try {
          setIsSyncing(true);
          await syncService.syncToCloud();
          setLastSyncTime(new Date());
        } catch (e) {
          console.error('Error during periodic sync:', e);
        } finally {
          setIsSyncing(false);
        }
      }
    }, 5 * 60 * 1000); // Sync every 5 minutes
    
    // Initial sync after a delay to ensure local data is loaded
    const initialSyncTimeout = setTimeout(initialSync, 5000);
    
    return () => {
      clearInterval(syncInterval);
      clearTimeout(initialSyncTimeout);
    };
  }, [user, isSyncing]);
  
  // Set up Firestore listeners
  const setupFirestoreListeners = (userId: string) => {
    if (!db) return;
    
    // Listen for metadata changes
    const metadataQuery = query(
      collection(db, 'metadata'),
      where('userId', '==', userId)
    );
    
    const unsubscribeMetadata = onSnapshot(metadataQuery, (snapshot) => {
      if (snapshot.metadata.hasPendingWrites) {
        // Skip changes that originate locally
        return;
      }
      
      snapshot.docChanges().forEach(change => {
        const data = change.doc.data() as any;
        
        // Make sure we have valid metadata
        if (!data.id || !data.path) return;
        
        if (change.type === 'added' || change.type === 'modified') {
          // Convert to MusicMetadata format
          const metadata: MusicMetadata = {
            id: data.id,
            title: data.title || '',
            artist: data.artist || '',
            album: data.album || '',
            duration: 0, // This will be filled when file is loaded
            playCount: data.playCount || 0,
            playHistory: data.playHistory || [],
            queueId: data.id,
            path: data.path,
            bpm: data.bpm,
            tempo: data.tempo,
            rating: data.rating,
            comment: data.comment,
            customMetadata: data.customMetadata,
            lastPlayed: data.lastPlayed ? new Date(data.lastPlayed) : undefined,
          };
          
          // Update the store
          updateTrackMetadata(data.id, metadata);
        }
      });
    });
    
    // Listen for song list changes
    const songListsQuery = query(
      collection(db, 'songLists'),
      where('userId', '==', userId)
    );
    
    const unsubscribeSongLists = onSnapshot(songListsQuery, (snapshot) => {
      if (snapshot.metadata.hasPendingWrites) {
        // Skip changes that originate locally
        return;
      }
      
      const updatedLists: SongList[] = [];
      
      snapshot.docChanges().forEach(change => {
        const data = change.doc.data() as any;
        
        if (change.type === 'added' || change.type === 'modified') {
          updatedLists.push({
            id: data.id,
            name: data.name,
            songs: data.songs || [],
            created: data.created || Date.now(),
            modified: data.lastModified?.toMillis() || Date.now(),
          });
        }
      });
      
      if (updatedLists.length > 0) {
        // Update song lists in the store
        const store = usePlayerStore.getState();
        
        // Merge the updated lists with current lists
        const currentLists = [...store.songLists];
        
        updatedLists.forEach(updatedList => {
          const existingIndex = currentLists.findIndex(list => list.id === updatedList.id);
          
          if (existingIndex >= 0) {
            // Update existing list if cloud version is newer
            if (updatedList.modified > currentLists[existingIndex].modified) {
              currentLists[existingIndex] = updatedList;
            }
          } else {
            // Add new list
            currentLists.push(updatedList);
          }
        });
        
        // Update store
        usePlayerStore.setState({ songLists: currentLists });
      }
    });
    
    // Listen for user preferences changes
    const preferencesRef = doc(db, 'userPreferences', userId);
    
    const unsubscribePreferences = onSnapshot(preferencesRef, (snapshot) => {
      if (snapshot.metadata.hasPendingWrites) {
        // Skip changes that originate locally
        return;
      }
      
      const data = snapshot.data();
      if (!data) return;
      
      // Update preferences in store
      const store = usePlayerStore.getState();
      const updates: Partial<typeof store> = {};
      
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
      
      // Apply updates
      usePlayerStore.setState(updates);
    });
    
    // Return cleanup function (not used in this implementation, but good practice)
    return () => {
      unsubscribeMetadata();
      unsubscribeSongLists();
      unsubscribePreferences();
    };
  };
  
  // Function to manually trigger sync
  const syncNow = async () => {
    if (!user || isSyncing) return;
    
    try {
      setIsSyncing(true);
      setError(null);
      
      // Sync to cloud first
      await syncService.syncToCloud();
      
      // Then sync from cloud
      await syncService.syncFromCloud();
      
      setLastSyncTime(new Date());
    } catch (e) {
      console.error('Error during manual sync:', e);
      setError('Failed to sync data');
    } finally {
      setIsSyncing(false);
    }
  };
  
  return {
    user,
    loading,
    error,
    isSyncing,
    lastSyncTime,
    syncNow
  };
};

/**
 * Hook to sync metadata changes to cloud
 */
export const useSyncMetadata = () => {
  const user = getCurrentUser();
  const syncService = SyncService.getInstance();
  
  // Function to sync a single metadata update
  const syncMetadataUpdate = async (metadata: MusicMetadata) => {
    if (!user) return;
    
    try {
      await syncService.syncSingleMetadata(metadata);
    } catch (e) {
      console.error('Error syncing metadata update:', e);
    }
  };
  
  return {
    syncMetadataUpdate
  };
};
