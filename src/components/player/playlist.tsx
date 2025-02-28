'use client';

import { useEffect, useState, RefObject, useMemo, forwardRef, useImperativeHandle } from "react";
import { usePlayerStore } from "@/lib/store";
import { useSettings } from "../settings/settings-context";
import { MusicMetadata } from "@/lib/types/types";
import { PrelistenAudioRef } from "./prelisten-audio-player";
import { TrackItem } from "./track-item";
import { EditTrackDialog } from "./edit-track-dialog";
import { usePlaylistActions } from "./use-playlist-actions";
import { useTrackList } from "./use-track-list";
import { SortField, SortOrder, FilterCriteria, FilterValue } from "./playlist-controls";
import { createErrorHandler } from "@/features/audio/utils/errorUtils";
import { Button } from "../ui/button";
import {
  MoreVertical,
  Play,
  Pause,
  Pencil,
  Trash,
  MessageSquare,
  ListMusic,
  CheckSquare,
} from "lucide-react";

const handleError = createErrorHandler('Playlist');

interface PlaylistProps {
  searchQuery: string;
  prelistenRef: RefObject<PrelistenAudioRef>;
  sortField: SortField;
  sortOrder: SortOrder;
  filters: FilterCriteria;
}

export const Playlist = forwardRef((props: PlaylistProps, ref) => {
  const [editingTrack, setEditingTrack] = useState<MusicMetadata | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [prelistenCurrentTime, setPrelistenCurrentTime] = useState(0);
  const selectedListId = usePlayerStore((state) => state.selectedListId);
  const songLists = usePlayerStore((state) => state.songLists);
  const selectedTracks = usePlayerStore((state) => state.selectedTracks || []);
  const setSelectedTracks = usePlayerStore((state) => state.setSelectedTracks);

  const { currentTrack, prelistenTrack, isPrelistening, queue, history, customMetadata } =
    usePlayerStore();

  const { showPreListenButtons } = useSettings();
  const { tracks, loadTracks } = useTrackList(props.searchQuery);

  // Filter tracks based on filter criteria
  const filteredTracks = useMemo(() => {
    // First filter by selected song list
    let tracksToFilter = tracks;
    if (selectedListId) {
      const selectedList = songLists.find(list => list.id === selectedListId);
      if (selectedList) {
        tracksToFilter = tracks.filter(track => track.path && selectedList.songs.includes(track.path));
      }
    }

    return tracksToFilter.filter((track) => {
      // Check advanced filters first
      if (props.filters.advanced) {
        const { recentPlayHours, monthlyPlayCount, totalPlayCount, rating, tempo } = props.filters.advanced;

        // Check recent play hours
        if (props.filters.advanced?.recentPlayHours?.enabled) {
          const hoursAgo = new Date();
          hoursAgo.setHours(hoursAgo.getHours() - props.filters.advanced.recentPlayHours.withinHours);
          
          const playsInPeriod = track.playHistory?.filter(play => {
            const playDate = new Date(play.timestamp);
            return playDate > hoursAgo;
          }).length ?? 0;

          if (playsInPeriod > props.filters.advanced.recentPlayHours.maxPlays) {
            return false;
          }
        }

        // Check monthly play count
        if (monthlyPlayCount?.enabled) {
          const daysAgo = new Date();
          daysAgo.setDate(daysAgo.getDate() - monthlyPlayCount.withinDays);
          
          const playsInPeriod = track.playHistory?.filter(play => {
            const playDate = new Date(play.timestamp);
            return playDate > daysAgo;
          }).length ?? 0;

          if (playsInPeriod > monthlyPlayCount.maxPlays) {
            return false;
          }
        }

        // Check total play count
        if (totalPlayCount?.enabled) {
          const plays = track.playCount ?? 0;
          if (
            (totalPlayCount.min !== undefined && plays < totalPlayCount.min) ||
            (totalPlayCount.max !== undefined && plays > totalPlayCount.max)
          ) {
            return false;
          }
        }

        // Check rating
        if (rating?.enabled) {
          const trackRating = track.rating ?? 0;
          if (
            (rating.min !== undefined && trackRating < rating.min / 5) ||
            (rating.max !== undefined && trackRating > rating.max / 5)
          ) {
            return false;
          }
        }

        // Check tempo
        if (tempo?.enabled) {
          const trackTempo = track.tempo ?? track.bpm ?? 0;
          if (
            (tempo.min !== undefined && trackTempo < tempo.min) ||
            (tempo.max !== undefined && trackTempo > tempo.max)
          ) {
            return false;
          }
        }
      }

      // Check each filter criteria
      for (const [key, filter] of Object.entries(props.filters)) {
        if (key === 'advanced') continue;
        
        const filterValue = filter as FilterValue | undefined;
        // Ensure filter is defined and has values
        if (!filterValue || !filterValue.values || filterValue.values.length === 0) continue;

        let matches = false;
        const isCustomMetadata = key.startsWith('custom_');
        const trackValue = isCustomMetadata
          ? track.customMetadata?.[key as `custom_${string}`]
          : track[key as keyof typeof track];

        // Handle arrays (like genre)
        if (Array.isArray(trackValue)) {
          matches = filterValue.values.some(value => 
            trackValue.some(v => v?.toString().toLowerCase() === value.toLowerCase())
          );
        }
        // Handle undefined/empty values
        else if (trackValue === undefined || trackValue === '') {
          matches = filterValue.values.includes('(Empty)');
        }
        // Handle regular values
        else {
          matches = filterValue.values.some(value => 
            trackValue?.toString().toLowerCase() === value.toLowerCase()
          );
        }

        // If exclude mode is true, invert the match
        if (filterValue.exclude) {
          if (matches) return false;
        } else {
          if (!matches) return false;
        }
      }

      return true;
    });
  }, [
    tracks,
    props.filters,
    selectedListId,
    songLists,
  ]);

  // Apply sorting
  const filteredAndSortedTracks = useMemo(() => {
    return filteredTracks.sort((a, b) => {
      const aValue = a[props.sortField as keyof MusicMetadata];
      const bValue = b[props.sortField as keyof MusicMetadata];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return props.sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return props.sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [
    filteredTracks,
    props.sortField,
    props.sortOrder,
  ]);

  const {
    handlePlay,
    handleDelete,
    handleSaveTrack,
    handlePrelistenTimelineClick,
    handlePrelistenToggle,
    addToQueue,
  } = usePlaylistActions(props.prelistenRef);

  useEffect(() => {
    const updateTime = () => {
      if (props.prelistenRef.current) {
        setPrelistenCurrentTime(props.prelistenRef.current.getCurrentTime());
      }
    };

    const interval = setInterval(updateTime, 100);
    return () => clearInterval(interval);
  }, [props.prelistenRef]);

  useEffect(() => {
    const playlistElement = document.querySelector('[data-testid="playlist-component"]');
    if (!playlistElement) return;

    const handleSelectAllEvent = () => {
      const trackIds = filteredAndSortedTracks.map(track => track.id);
      setSelectedTracks(trackIds);
    };

    playlistElement.addEventListener('selectAll', handleSelectAllEvent);
    return () => {
      playlistElement.removeEventListener('selectAll', handleSelectAllEvent);
    };
  }, [filteredAndSortedTracks, setSelectedTracks]);

  const handleEditTrack = (track: MusicMetadata) => {
    setEditingTrack(track);
    setIsEditing(true);
  };

  const handleSaveTrackAndRefresh = async (tracks: MusicMetadata | MusicMetadata[]) => {
    try {
      const tracksToSave = Array.isArray(tracks) ? tracks : [tracks];

      const results = await Promise.all(
        tracksToSave.map(async (track) => {
          return await handleSaveTrack(track);
        })
      );

      const allSuccessful = results.every(success => success);
      if (allSuccessful) {
        setIsEditing(false);
        setEditingTrack(null);
        setSelectedTracks([]);
        await loadTracks();
      }
    } catch (error) {
      console.error('Error saving tracks:', error); // Debug log
      handleError(error);
    }
  };

  const handleEditSelectedTracks = () => {
    const tracksToEdit = filteredAndSortedTracks.filter(track => selectedTracks.includes(track.id));
    if (tracksToEdit.length > 0) {
      setEditingTrack(tracksToEdit[0]); // Set first track for backward compatibility
      setIsEditing(true);
    }
  };

  const handleAddSelectedToQueue = () => {
    const tracksToAdd = filteredAndSortedTracks.filter(track => selectedTracks.includes(track.id));
    tracksToAdd.forEach(track => addToQueue(track));
    setSelectedTracks([]);
  };

  const handleTrackSelect = (track: MusicMetadata) => {
    const currentSelected = selectedTracks || [];
    const isSelected = currentSelected.includes(track.id);
    
    if (isSelected) {
      setSelectedTracks(currentSelected.filter(id => id !== track.id));
    } else {
      setSelectedTracks([...currentSelected, track.id]);
    }
  };

  // const handleSelectAll = () => {
  //   const trackIds = filteredAndSortedTracks.map(track => track.id);
  //   setSelectedTracks(trackIds);
  // };

  useImperativeHandle(ref, () => ({
    handleSelectAll: () => {
      const trackIds = filteredAndSortedTracks.map(track => track.id);
      setSelectedTracks(trackIds);
    }
  }));

  return (
    <div className="relative" data-testid="playlist-component">
      {/* Track List */}
      <div className="pb-0">
        {filteredAndSortedTracks.map((track) => (
          <TrackItem
            key={track.id}
            track={track}
            data-track-id={track.id}
            currentTrack={currentTrack}
            prelistenTrack={prelistenTrack}
            isPrelistening={isPrelistening}
            prelistenCurrentTime={prelistenCurrentTime}
            showPreListenButtons={showPreListenButtons}
            isInQueue={
              currentTrack?.id === track.id ||
              queue?.some((t) => t.id === track.id) ||
              history?.some((t) => t.id === track.id)
            }
            onPrelistenTimelineClick={handlePrelistenTimelineClick}
            onPrelistenToggle={handlePrelistenToggle}
            onAddToQueue={addToQueue}
            onEditTrack={handleEditTrack}
            onDeleteTrack={handleDelete}
            isSelected={Array.isArray(selectedTracks) && selectedTracks.includes(track.id)}
            onSelect={() => handleTrackSelect(track)}
          />
        ))}
      </div>

      {/* Selection Controls - Only show when tracks are selected */}
      {selectedTracks.length > 0 && (
        <div className="sticky bottom-[-2px] z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTracks([]);
                }}
              >
                Clear Selection
              </Button>
              <span className="text-sm font-medium">
                {selectedTracks.length} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleEditSelectedTracks}
                disabled={selectedTracks.length === 0}
              >
                Edit {selectedTracks.length} Track{selectedTracks.length !== 1 && 's'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddSelectedToQueue}
              >
                Add to Queue
              </Button>
            </div>
          </div>
        </div>
      )}

      <EditTrackDialog
        isOpen={isEditing}
        onOpenChange={(open) => {
          setIsEditing(open);
          if (!open) {
            setEditingTrack(null);
            setSelectedTracks([]);
          }
        }}
        track={editingTrack}
        tracks={selectedTracks.length > 0 ? filteredAndSortedTracks.filter(track => selectedTracks.includes(track.id)) : undefined}
        onTrackChange={(updatedTracks) => {
          // Update the first track in the editing state for backward compatibility
          if (updatedTracks.length > 0) {
            setEditingTrack(updatedTracks[0]);
          }
        }}
        onSave={handleSaveTrackAndRefresh}
      />
    </div>
  );
});

function getHoursSinceLastPlay(track: MusicMetadata) {
  const lastPlayed = track.lastPlayed ? new Date(track.lastPlayed) : null;
  const hoursAgo = lastPlayed 
    ? (Date.now() - lastPlayed.getTime()) / (1000 * 60 * 60)
    : Infinity;
  return hoursAgo;
}
