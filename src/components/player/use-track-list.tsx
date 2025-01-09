import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MusicMetadata } from "@/lib/types/types";
import { getAllMetadata } from "@/db/metadata-operations";
import { usePlayerStore } from "@/lib/store";

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
      setTracks(metadata);
      // Set first track as prelistenTrack if there isn't one and there are tracks available
      if (!prelistenTrack && metadata.length > 0) {
        setPrelistenTrack(metadata[0]);
        setIsPrelistening(false);
      }
    } catch (error) {
      toast.error("Failed to load tracks");
      console.error(error);
    }
  };

  const filteredTracks = tracks.filter((track) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      track.title.toLowerCase().includes(searchLower) ||
      track.artist.toLowerCase().includes(searchLower) ||
      track.album.toLowerCase().includes(searchLower)
    );
  });

  return {
    tracks,
    filteredTracks,
    loadTracks,
  };
}
