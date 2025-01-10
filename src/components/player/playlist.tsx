import { useEffect, useState, RefObject } from "react";
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

interface PlaylistProps {
  searchQuery: string;
  prelistenRef: RefObject<PrelistenAudioRef>;
}

export function Playlist({ searchQuery, prelistenRef }: PlaylistProps) {
  const [editingTrack, setEditingTrack] = useState<MusicMetadata | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [prelistenCurrentTime, setPrelistenCurrentTime] = useState(0);

  const { currentTrack, prelistenTrack, isPrelistening, queue, history } =
    usePlayerStore();

  const { showPreListenButtons } = useSettings();
  const { filteredTracks, loadTracks } = useTrackList(searchQuery);
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
        {filteredTracks.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-8 text-muted-foreground">
            <p>No tracks found</p>
            <p>
              Add tracks in the settings (<GearIcon className="inline-block" />)
              or with this button:
            </p>
            <FileUpload onlyFolderUpload />
          </div>
        ) : (
          filteredTracks.map((track) => (
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
