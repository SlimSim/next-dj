"use client";

import { useState, useMemo, useEffect } from "react";
import { usePlayerStore } from "@/lib/store";
import { SongInfoCard } from "./song-info-card";
import { Button } from "../ui/button";
import { SortAsc, SortDesc } from "lucide-react";
import { PlayHistoryEvent, MusicMetadata } from "@/lib/types/types";
import { cn } from "@/lib/utils/common";
import { EditTrackDialog } from "./edit-track-dialog";

// Helper functions for date formatting
const formatDistanceToNow = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffMonth / 12);

  if (diffYear > 0) return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`;
  if (diffMonth > 0) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  return 'just now';
};

const formatDate = (date: Date): string => {
  return date.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

interface HistoryEntry {
  track: MusicMetadata;
  timestamp: string;
}

export interface PlayHistoryViewProps {
  searchQuery: string;
}

export function PlayHistoryView({ searchQuery }: PlayHistoryViewProps) {
  // Add state for selected tracks
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // Edit track dialog state
  const [editingTrack, setEditingTrack] = useState<MusicMetadata | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Use the store values directly instead of local state
  const historySortOrder = usePlayerStore((state) => state.historySortOrder);
  const historyTimeFilter = usePlayerStore((state) => state.historyTimeFilter);
  
  // Get all metadata and current track from store
  const allSongs = usePlayerStore((state) => state.metadata);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const addToQueue = usePlayerStore((state) => state.addToQueue);
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  // Add removeFromHistory action
  const removeFromHistory = usePlayerStore((state) => state.removeFromHistory);
  const updateTrackMetadata = usePlayerStore((state) => state.updateTrackMetadata);

  // Collate all play history events across all songs
  const allHistoryEvents = useMemo<HistoryEntry[]>(() => {
    const events: HistoryEntry[] = [];
    
    allSongs.forEach(track => {
      if (track.playHistory && track.playHistory.length > 0) {
        track.playHistory.forEach(event => {
          events.push({
            track: { ...track },
            timestamp: event.timestamp
          });
        });
      }
    });
    
    return events;
  }, [allSongs]);

  // Apply filtering and sorting
  const filteredHistory = useMemo(() => {
    let filtered = [...allHistoryEvents];
    
    // Apply time filter
    if (historyTimeFilter !== "all") {
      const days = parseInt(historyTimeFilter);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      filtered = filtered.filter(entry => 
        new Date(entry.timestamp) > cutoffDate
      );
    }
    
    // Apply search filter
    if (searchQuery?.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.track.title?.toLowerCase().includes(query) || 
        entry.track.artist?.toLowerCase().includes(query) || 
        entry.track.album?.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return historySortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });
    
    return filtered;
  }, [allHistoryEvents, searchQuery, historySortOrder, historyTimeFilter]);

  const handlePlayNow = (track: MusicMetadata) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const handleAddToQueue = (track: MusicMetadata) => {
    addToQueue(track);
  };

  // Add a remove from history handler
  const handleRemoveFromHistory = (track: MusicMetadata, timestamp: string) => {
    removeFromHistory(track.queueId, timestamp);
  };
  
  // Add edit track handler
  const handleEditTrack = (track: MusicMetadata) => {
    setEditingTrack(track);
    setIsEditing(true);
  };
  
  // Handle saving track metadata
  const handleSaveTrack = (tracks: MusicMetadata[]) => {
    tracks.forEach(track => {
      updateTrackMetadata(track.id, track);
    });
    setIsEditing(false);
    setEditingTrack(null);
  };
  
  // Handle track selection
  const handleTrackSelect = (track: MusicMetadata) => {
    setSelectedItems(prev => {
      const isSelected = prev.includes(track.id);
      if (isSelected) {
        return prev.filter(id => id !== track.id);
      } else {
        return [...prev, track.id];
      }
    });
  };
  
  // Handle select all
  const handleSelectAll = () => {
    if (selectedItems.length === filteredHistory.length) {
      // Deselect all
      setSelectedItems([]);
    } else {
      // Select all
      setSelectedItems(filteredHistory.map(entry => entry.track.id));
    }
  };
  
  // Listen for the selectAll event from the header
  useEffect(() => {
    const handleSelectAllEvent = () => {
      handleSelectAll();
    };
    
    window.addEventListener('selectAllHistory', handleSelectAllEvent);
    
    return () => {
      window.removeEventListener('selectAllHistory', handleSelectAllEvent);
    };
  }, [filteredHistory.length]);

  return (
    <div className="container mx-auto px-1 py-0">
      <div className="flex flex-col">

        <div className="bg-card rounded-md px-4 py-2 text-sm flex justify-between items-center">
          <div className="font-medium">
            {filteredHistory.length} {filteredHistory.length === 1 ? 'play' : 'plays'} found
            {selectedItems.length > 0 && ` (${selectedItems.length} selected)`}
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {allHistoryEvents.length === 0 
              ? "No play history found. Songs will appear here once you play them."
              : "No results match your search criteria."}
          </div>
        ) : (
          <div className="flex flex-col space-y-1">
            {filteredHistory.map((entry) => (
              <div key={`${entry.track.id}-${entry.timestamp}`} className="flex flex-col">
                <SongInfoCard
                  track={entry.track}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying && currentTrack?.id === entry.track.id}
                  variant="history"
                  extraInfo={`${formatDistanceToNow(new Date(entry.timestamp))} • ${formatDate(new Date(entry.timestamp))}`}
                  onPlayNow={() => handlePlayNow(entry.track)}
                  onAddToQueue={() => handleAddToQueue(entry.track)}
                  onRemove={() => handleRemoveFromHistory(entry.track, entry.timestamp)}
                  onEditTrack={() => handleEditTrack(entry.track)}
                  showPlayHistory={false}
                  moreSpace={true}
                  isSelected={selectedItems.includes(entry.track.id)}
                  onSelect={() => handleTrackSelect(entry.track)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Add Edit Track Dialog */}
      <EditTrackDialog
        isOpen={isEditing}
        onOpenChange={(open) => setIsEditing(open)}
        track={editingTrack}
        onTrackChange={() => {}}
        onSave={handleSaveTrack}
      />
    </div>
  );
}
