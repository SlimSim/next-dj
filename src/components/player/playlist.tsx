'use client';

import { useEffect, useState, RefObject, useMemo } from "react";
import { usePlayerStore } from "@/lib/store";
import { useSettings } from "../settings/settings-context";
import { MusicMetadata } from "@/lib/types/types";
import { PrelistenAudioRef } from "./prelisten-audio-player";
import { TrackItem } from "./track-item";
import { EditTrackDialog } from "./edit-track-dialog";
import { usePlaylistActions } from "./use-playlist-actions";
import { useTrackList } from "./use-track-list";
import { FileUpload } from "../common/file-upload";
import { GearIcon } from "@radix-ui/react-icons";
import { SortField, SortOrder, FilterCriteria, FilterValue } from "./playlist-controls";
import { createErrorHandler } from "@/features/audio/utils/errorUtils";
import { asCustomKey } from "@/lib/utils/metadata";

const handleError = createErrorHandler('Playlist');

interface PlaylistProps {
  searchQuery: string;
  prelistenRef: RefObject<PrelistenAudioRef>;
  sortField: SortField;
  sortOrder: SortOrder;
  filters: FilterCriteria;
}

export function Playlist({
  searchQuery,
  prelistenRef,
  sortField,
  sortOrder,
  filters,
}: PlaylistProps) {
  const [editingTrack, setEditingTrack] = useState<MusicMetadata | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [prelistenCurrentTime, setPrelistenCurrentTime] = useState(0);
  const selectedListId = usePlayerStore((state) => state.selectedListId);
  const songLists = usePlayerStore((state) => state.songLists);

  const { currentTrack, prelistenTrack, isPrelistening, queue, history, customMetadata } =
    usePlayerStore();

  const { showPreListenButtons } = useSettings();
  const { tracks, loadTracks } = useTrackList(searchQuery);

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
      if (filters.advanced) {
        const { recentPlayHours, monthlyPlayCount, totalPlayCount, rating, tempo } = filters.advanced;

        // Check recent play hours
        if (filters.advanced?.recentPlayHours?.enabled) {
          const hoursAgo = new Date();
          hoursAgo.setHours(hoursAgo.getHours() - filters.advanced.recentPlayHours.withinHours);
          
          const playsInPeriod = track.playHistory?.filter(play => {
            const playDate = new Date(play.timestamp);
            return playDate > hoursAgo;
          }).length ?? 0;

          if (playsInPeriod > filters.advanced.recentPlayHours.maxPlays) {
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
      for (const [key, filter] of Object.entries(filters)) {
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
    filters,
    selectedListId,
    songLists,
  ]);

  // Apply sorting
  const processedTracks = useMemo(() => {
    return filteredTracks.sort((a, b) => {
      const aValue = a[sortField as keyof MusicMetadata];
      const bValue = b[sortField as keyof MusicMetadata];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [
    filteredTracks,
    sortField,
    sortOrder,
  ]);

  const {
    handlePlay,
    handleDelete,
    handleSaveTrack,
    handlePrelistenTimelineClick,
    handlePrelistenToggle,
    addToQueue,
  } = usePlaylistActions(prelistenRef);

  useEffect(() => {
    const updateTime = () => {
      if (prelistenRef.current) {
        setPrelistenCurrentTime(prelistenRef.current.getCurrentTime());
      }
    };

    const interval = setInterval(updateTime, 100);
    return () => clearInterval(interval);
  }, [prelistenRef]);

  const handleEditTrack = (track: MusicMetadata) => {
    setEditingTrack(track);
    setIsEditing(true);
  };

  const handleSaveTrackAndRefresh = async (track: MusicMetadata) => {
    try {
      const success = await handleSaveTrack(track);
      if (success) {
        setIsEditing(false);
        setEditingTrack(null);
        await loadTracks();
      }
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col container mx-auto p-0">
      <div className="w-full h-full">
        {processedTracks.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-8 text-muted-foreground">
            <p>No tracks found</p>
            <p>
              Add tracks in the settings (<GearIcon className="inline-block" />
              ) or with this button:
            </p>
            <FileUpload onlyFolderUpload />
          </div>
        ) : (
          processedTracks.map((track) => (
            <TrackItem
              key={track.id}
              track={track}
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
            />
          ))
        )}
      </div>

      <EditTrackDialog
        isOpen={isEditing}
        onOpenChange={(open) => !open && setIsEditing(false)}
        track={editingTrack}
        onTrackChange={setEditingTrack}
        onSave={handleSaveTrackAndRefresh}
      />
    </div>
  );
}

function getHoursSinceLastPlay(track: MusicMetadata) {
  const lastPlayed = track.lastPlayed ? new Date(track.lastPlayed) : null;
  const hoursAgo = lastPlayed 
    ? (Date.now() - lastPlayed.getTime()) / (1000 * 60 * 60)
    : Infinity;
  return hoursAgo;
}
