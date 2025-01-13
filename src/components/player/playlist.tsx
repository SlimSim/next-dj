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
import { SortField, SortOrder, FilterCriteria } from "./playlist-controls";

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

  const { currentTrack, prelistenTrack, isPrelistening, queue, history } =
    usePlayerStore();

  const { showPreListenButtons } = useSettings();
  const { filteredTracks, loadTracks } = useTrackList(searchQuery);

  // Apply sorting and filtering
  const tracks = useMemo(() => {
    let processedTracks = [...filteredTracks];

    // Filter by selected list if one is selected
    if (selectedListId) {
      const selectedList = songLists.find((list) => list.id === selectedListId);
      if (selectedList) {
        processedTracks = processedTracks.filter((track) =>
          track.path ? selectedList.songs.includes(track.path) : false
        );
      }
    }

    // Apply other filters
    if (filters.artist) {
      processedTracks = processedTracks.filter(
        (track) => track.artist === filters.artist
      );
    }
    if (filters.album) {
      processedTracks = processedTracks.filter(
        (track) => track.album === filters.album
      );
    }
    if (filters.genre && typeof filters.genre === "string") {
      processedTracks = processedTracks.filter((track) =>
        track.genre ? track.genre.includes(filters.genre as string) : false
      );
    }

    // Apply sorting
    processedTracks.sort((a, b) => {
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

    return processedTracks;
  }, [
    filteredTracks,
    filters,
    sortField,
    sortOrder,
    selectedListId,
    songLists,
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
    const success = await handleSaveTrack(track);
    if (success) {
      setIsEditing(false);
      setEditingTrack(null);
      await loadTracks();
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col container mx-auto p-0">
      <div className="w-full h-full">
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-8 text-muted-foreground">
            <p>No tracks found</p>
            <p>
              Add tracks in the settings (<GearIcon className="inline-block" />)
              or with this button:
            </p>
            <FileUpload onlyFolderUpload />
          </div>
        ) : (
          tracks.map((track) => (
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
