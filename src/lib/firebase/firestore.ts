import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';
import { db } from './config';
import { MusicMetadata, AudioFile, PlayHistoryEvent } from '../types/types';
import { SongList } from '../types/player';
import { getCurrentUser } from './auth';

// Collection names
const METADATA_COLLECTION = 'metadata';
const SONG_LISTS_COLLECTION = 'songLists';
const USER_PREFERENCES_COLLECTION = 'userPreferences';

// Interface for metadata stored in Firestore
interface FirestoreMetadata {
  id: string;
  userId: string;
  path: string; // Used for matching across devices
  title: string;
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
  playCount: number;
  lastPlayed?: string;
  playHistory?: PlayHistoryEvent[];
  lastModified: Timestamp;
  customMetadata?: { [K in `custom_${string}`]: string };
}

// Interface for song lists stored in Firestore
interface FirestoreSongList {
  id: string;
  userId: string;
  name: string;
  songs: string[]; // Array of song paths
  created: number;
  lastModified: Timestamp;
}

/**
 * Sanitizes an object by removing undefined values, which Firestore doesn't support
 */
const sanitizeForFirestore = (obj: any): any => {
  // If object is null or not an object, return it directly
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // If it's an array, sanitize each element
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item));
  }

  // For objects, remove undefined values and sanitize nested objects
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip undefined values
    if (value === undefined) continue;
    
    // Sanitize nested objects/arrays
    result[key] = sanitizeForFirestore(value);
  }
  
  return result;
};

/**
 * Converts a MusicMetadata object to a FirestoreMetadata object
 */
const convertToFirestoreMetadata = (metadata: MusicMetadata, userId: string): FirestoreMetadata => {
  // Create the initial object with all fields
  const firestoreData = {
    id: metadata.id,
    userId,
    path: metadata.path,
    title: metadata.title || '',
    artist: metadata.artist,
    album: metadata.album,
    track: metadata.track,
    year: metadata.year,
    genre: metadata.genre,
    bpm: metadata.bpm,
    rating: metadata.rating,
    comment: metadata.comment,
    volume: metadata.volume,
    startTime: metadata.startTime,
    endTimeOffset: metadata.endTimeOffset,
    fadeDuration: metadata.fadeDuration,
    endTimeFadeDuration: metadata.endTimeFadeDuration,
    playCount: metadata.playCount || 0,
    lastPlayed: metadata.lastPlayed?.toISOString(),
    playHistory: metadata.playHistory,
    customMetadata: metadata.customMetadata,
    lastModified: Timestamp.now(),
  };
  
  // Sanitize to remove any undefined values
  return sanitizeForFirestore(firestoreData) as FirestoreMetadata;
};

/**
 * Converts a FirestoreMetadata object to a MusicMetadata object
 */
const convertFromFirestoreMetadata = (firestoreMetadata: FirestoreMetadata): MusicMetadata => {
  const { userId, lastModified, ...metadataWithoutUserId } = firestoreMetadata;
  
  return {
    ...metadataWithoutUserId,
    // Required properties with defaults for MusicMetadata
    artist: firestoreMetadata.artist || '',      // Default to empty string if undefined
    album: firestoreMetadata.album || '',        // Default to empty string if undefined
    title: firestoreMetadata.title || '',        // Default to empty string if undefined
    duration: 0,                                // Will be updated when audio file is loaded locally
    queueId: firestoreMetadata.id,              // Use the same ID as the track ID
    // Other properties with defaults
    lastPlayed: firestoreMetadata.lastPlayed ? new Date(firestoreMetadata.lastPlayed) : undefined,
    playCount: firestoreMetadata.playCount || 0,
    playHistory: firestoreMetadata.playHistory || [],
  };
};

/**
 * Syncs metadata to Firestore
 */
export const syncMetadataToFirestore = async (metadata: MusicMetadata[]): Promise<boolean> => {
  try {
    const user = getCurrentUser();
    if (!user || !db) {
      console.log('User not authenticated or Firestore not initialized');
      return false;
    }

    const batch = writeBatch(db);
    const userId = user.uid;
    let syncCount = 0;

    for (const item of metadata) {
      if (!item.path) continue; // Skip metadata without path
      
      try {
        const firestoreMetadata = convertToFirestoreMetadata(item, userId);
        const docRef = doc(db, METADATA_COLLECTION, `${userId}_${item.id}`);
        batch.set(docRef, firestoreMetadata);
        syncCount++;
      } catch (itemError) {
        console.warn(`Skipping item ${item.id} due to error:`, itemError);
        // Continue with other items instead of failing the entire batch
      }
    }

    if (syncCount === 0) {
      console.warn('No valid metadata items to sync');
      return false;
    }

    await batch.commit();
    console.log(`Successfully synced ${syncCount} metadata items to Firestore`);
    return true;
  } catch (error) {
    console.error('Error syncing metadata to Firestore:', error);
    return false;
  }
};

/**
 * Fetches metadata from Firestore
 */
export const fetchMetadataFromFirestore = async (): Promise<MusicMetadata[]> => {
  try {
    const user = getCurrentUser();
    if (!user || !db) {
      console.log('User not authenticated or Firestore not initialized');
      return [];
    }

    const userId = user.uid;
    const metadataQuery = query(
      collection(db, METADATA_COLLECTION),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(metadataQuery);
    const metadata: MusicMetadata[] = [];

    querySnapshot.forEach((doc) => {
      const firestoreMetadata = doc.data() as FirestoreMetadata;
      const musicMetadata = convertFromFirestoreMetadata(firestoreMetadata);
      metadata.push(musicMetadata);
    });

    return metadata;
  } catch (error) {
    console.error('Error fetching metadata from Firestore:', error);
    return [];
  }
};

/**
 * Syncs a single metadata item to Firestore
 */
export const syncSingleMetadataToFirestore = async (metadata: MusicMetadata): Promise<boolean> => {
  try {
    const user = getCurrentUser();
    if (!user || !db) {
      console.log('User not authenticated or Firestore not initialized');
      return false;
    }

    const userId = user.uid;
    
    try {
      const firestoreMetadata = convertToFirestoreMetadata(metadata, userId);
      const docRef = doc(db, METADATA_COLLECTION, `${userId}_${metadata.id}`);
      
      await setDoc(docRef, firestoreMetadata);
      console.log(`Successfully synced metadata for track: ${metadata.title || metadata.id}`);
      return true;
    } catch (conversionError) {
      console.error('Error converting metadata for Firestore:', conversionError);
      console.warn(`Skipping sync for track: ${metadata.title || metadata.id}`);
      return false;
    }
  } catch (error) {
    console.error('Error syncing single metadata to Firestore:', error);
    return false;
  }
};

/**
 * Syncs song lists to Firestore
 */
export const syncSongListsToFirestore = async (songLists: SongList[]): Promise<boolean> => {
  try {
    const user = getCurrentUser();
    if (!user || !db) {
      console.log('User not authenticated or Firestore not initialized');
      return false;
    }

    const batch = writeBatch(db);
    const userId = user.uid;

    for (const list of songLists) {
      const firestoreSongList: FirestoreSongList = {
        id: list.id,
        userId,
        name: list.name,
        songs: list.songs,
        created: list.created,
        lastModified: Timestamp.now(),
      };
      
      const docRef = doc(db, SONG_LISTS_COLLECTION, `${userId}_${list.id}`);
      batch.set(docRef, firestoreSongList);
    }

    await batch.commit();
    console.log(`Successfully synced ${songLists.length} song lists to Firestore`);
    return true;
  } catch (error) {
    console.error('Error syncing song lists to Firestore:', error);
    return false;
  }
};

/**
 * Fetches song lists from Firestore
 */
export const fetchSongListsFromFirestore = async (): Promise<SongList[]> => {
  try {
    const user = getCurrentUser();
    if (!user || !db) {
      console.log('User not authenticated or Firestore not initialized');
      return [];
    }

    const userId = user.uid;
    const songListsQuery = query(
      collection(db, SONG_LISTS_COLLECTION),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(songListsQuery);
    const songLists: SongList[] = [];

    querySnapshot.forEach((doc) => {
      const firestoreSongList = doc.data() as FirestoreSongList;
      
      songLists.push({
        id: firestoreSongList.id,
        name: firestoreSongList.name,
        songs: firestoreSongList.songs || [], // Ensure songs is always an array
        created: firestoreSongList.created || Date.now(),
        modified: firestoreSongList.lastModified?.toMillis() || firestoreSongList.created || Date.now(), // Use lastModified timestamp or fallback to created date
      });
    });

    return songLists;
  } catch (error) {
    console.error('Error fetching song lists from Firestore:', error);
    return [];
  }
};

/**
 * Syncs user preferences to Firestore
 */
export const syncUserPreferencesToFirestore = async (
  preferences: Record<string, any>
): Promise<boolean> => {
  try {
    const user = getCurrentUser();
    if (!user || !db) {
      console.log('User not authenticated or Firestore not initialized');
      return false;
    }

    const userId = user.uid;
    const docRef = doc(db, USER_PREFERENCES_COLLECTION, userId);
    
    await setDoc(docRef, {
      ...preferences,
      userId,
      lastModified: Timestamp.now(),
    });
    
    return true;
  } catch (error) {
    console.error('Error syncing user preferences to Firestore:', error);
    return false;
  }
};

/**
 * Fetches user preferences from Firestore
 */
export const fetchUserPreferencesFromFirestore = async (): Promise<Record<string, any> | null> => {
  try {
    const user = getCurrentUser();
    if (!user || !db) {
      console.log('User not authenticated or Firestore not initialized');
      return null;
    }

    const userId = user.uid;
    const docRef = doc(db, USER_PREFERENCES_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { userId, lastModified, ...preferences } = docSnap.data();
      return preferences;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user preferences from Firestore:', error);
    return null;
  }
};
