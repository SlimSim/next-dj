import { useEffect, useState } from "react";
import { toast } from "sonner";
import { usePlayerStore } from "@/lib/store";
import { MusicMetadata } from "@/lib/types/types";
import { getAllMetadata } from "@/db/audio-operations";
import { AudioError, AudioErrorCode, createErrorHandler } from "@/features/audio/utils/errorUtils";

const handleError = createErrorHandler('TrackList');

export function useTrackList(searchQuery: string) {
  const [tracks, setTracks] = useState<MusicMetadata[]>([]);
  const { refreshTrigger, setPrelistenTrack, setIsPrelistening, prelistenTrack } =
    usePlayerStore();

  useEffect(() => {
    // Load tracks on component mount and when refresh is triggered
    loadTracks();
  }, [refreshTrigger]);

  const loadTracks = async () => {
    try {
      console.log('Loading tracks from database');
      
      // Always get fresh metadata directly from the database, don't use cached data
      const metadata = await getAllMetadata();
      
      console.log('Loaded tracks:', metadata?.length || 0);
      
      // Don't throw an error for empty library, just set empty tracks
      if (!metadata || metadata.length === 0) {
        setTracks([]);
        return;
      }

      // Update the tracks in state to refresh the UI
      setTracks(metadata);
      
      // Update the global store's metadata array to ensure consistency
      const { setMetadata } = usePlayerStore.getState();
      if (typeof setMetadata === 'function') {
        setMetadata(metadata);
      }
      
      // Set first track as prelistenTrack if there isn't one and there are tracks available
      if (!prelistenTrack && metadata.length > 0) {
        setPrelistenTrack(metadata[0]);
        setIsPrelistening(false);
      }
    } catch (error) {
      // Only handle unexpected errors
      if (error instanceof AudioError && error.code === AudioErrorCode.FILE_NOT_FOUND) {
        setTracks([]);
      } else {
        handleError(error, true, true); // Show toast for unexpected errors
      }
    }
  };

  const filteredTracks = tracks.filter((track) => {
    const searchTerms = searchQuery.toLowerCase().split(" ");
    const store = usePlayerStore.getState();
    
    // Get searchable standard fields
    const searchableStandardFields = store.standardMetadataFields
      .filter(field => field.showInSearch)
      .map(field => track[field.key]);

    // Get searchable custom fields
    const searchableCustomFields = store.customMetadata.fields
      .filter(field => field.showInSearch)
      .map(field => track.customMetadata?.[`custom_${field.id}`]);

    // Combine title (always searchable) with other searchable fields
    const searchText = [
      track.title, // Always include title
      ...searchableStandardFields,
      ...searchableCustomFields
    ]
      .filter(Boolean)  // Remove null/undefined values
      .join(" ")
      .toLowerCase();

    return searchTerms.every((term) => searchText.includes(term));
  });

  return { tracks: filteredTracks, loadTracks };
}
