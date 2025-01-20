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
    loadTracks();
  }, [refreshTrigger]);

  const loadTracks = async () => {
    try {
      const metadata = await getAllMetadata();
      
      // Don't throw an error for empty library, just set empty tracks
      if (!metadata || metadata.length === 0) {
        setTracks([]);
        return;
      }

      setTracks(metadata);
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
    const trackText = `${track.title} ${track.artist} ${track.album}`.toLowerCase();
    return searchTerms.every((term) => trackText.includes(term));
  });

  return { tracks: filteredTracks, loadTracks };
}
