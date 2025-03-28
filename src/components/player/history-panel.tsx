"use client";

import { usePlayerStore } from "@/lib/store";
import { SongInfoCard } from "./song-info-card";
import { cn } from "@/lib/utils/common";
import { MusicMetadata } from "@/lib/types/types";

interface HistoryPanelProps {
  className?: string;
}

export function HistoryPanel({ className }: HistoryPanelProps) {
  // Access the player store to get history data
  const history = usePlayerStore((state) => state.history);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const addToQueue = usePlayerStore((state) => state.addToQueue);
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const removeFromHistory = usePlayerStore((state) => state.removeFromHistory);

  const handlePlayNow = (track: MusicMetadata) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const handleAddToQueue = (track: MusicMetadata) => {
    addToQueue(track);
  };

  const handleRemove = (track: MusicMetadata) => {
    // We need to pass both queueId and timestamp to removeFromHistory
    // Since we don't have the specific timestamp in this context, we'll remove all history entries for this track
    if (track.queueId && track.playHistory && track.playHistory.length > 0) {
      // Get the latest timestamp for this track
      const latestTimestamp = track.playHistory[track.playHistory.length - 1].timestamp;
      removeFromHistory(track.queueId, latestTimestamp);
    }
  };

  if (history.length === 0) {
    return (
      <div className={cn("p-4 text-center text-muted-foreground", className)}>
        No play history yet. Songs will appear here after they've been played.
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col space-y-1 p-2", className)}>
      <div className="text-sm font-medium text-muted-foreground mb-2">
        {history.length} {history.length === 1 ? 'song' : 'songs'} in history
      </div>
      
      {history.map((track, index) => (
        <SongInfoCard
          key={`${track.id}-${index}`}
          track={track}
          currentTrack={currentTrack}
          isPlaying={isPlaying && currentTrack?.id === track.id}
          variant="history"
          onPlayNow={() => handlePlayNow(track)}
          onAddToQueue={() => handleAddToQueue(track)}
          onRemove={() => handleRemove(track)}
          showPlayHistory={false}
        />
      ))}
    </div>
  );
}
