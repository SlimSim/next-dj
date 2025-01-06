import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { usePlayerStore } from "@/lib/store";
import { useSettings } from "../settings/settings-context";
// import { getAllMetadata, deleteAudioFile, updateMetadata } from "@/db/audio-operations";
import { MusicMetadata } from "@/lib/types/types";
import { cn } from "@/lib/utils/common";
import { MoreVertical, Play, Pause, Pencil, Trash } from "lucide-react";
import { PrelistenAudioRef } from "./prelisten-audio-player";
import { getAllMetadata, updateMetadata } from "@/db/metadata-operations";
import { deleteAudioFile } from "@/db/audio-operations";
import { formatTime } from "@/lib/utils/formatting";

interface PlaylistProps {
  searchQuery: string;
  prelistenRef: PrelistenAudioRef;
}

export function Playlist({ searchQuery, prelistenRef }: PlaylistProps) {
  const [tracks, setTracks] = useState<MusicMetadata[]>([]);
  const [editingTrack, setEditingTrack] = useState<MusicMetadata | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const {
    currentTrack,
    isPlaying,
    addToQueue,
    playNext,
    playLast,
    setQueueVisible,
    setCurrentTrack,
    setIsPlaying,
    setQueue,
    refreshTrigger,
    prelistenTrack,
    isPrelistening,
    setPrelistenTrack,
    setIsPrelistening,
  } = usePlayerStore();
  const { showPreListenButtons } = useSettings();

  useEffect(() => {
    loadTracks();
  }, [refreshTrigger]); // Reload tracks when refreshTrigger changes

  const loadTracks = async () => {
    try {
      const metadata = await getAllMetadata();
      setTracks(metadata);
      // Set first track as prelistenTrack if there isn't one and there are tracks available
      if (!prelistenTrack && metadata.length > 0) {
        setPrelistenTrack({ ...metadata[0], currentTime: 0 });
        setIsPrelistening(false);
      }
    } catch (error) {
      toast.error("Failed to load tracks");
      console.error(error);
    }
  };

  const refreshMetadata = async () => {
    try {
      const metadata = await getAllMetadata();
      setTracks(metadata);
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

  const handlePlay = (track: MusicMetadata) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  const handleDelete = async (track: MusicMetadata) => {
    try {
      await deleteAudioFile(track.id);
      await loadTracks();
      toast.success("Track deleted");
    } catch (error) {
      toast.error("Failed to delete track");
      console.error(error);
    }
  };

  const handleEditTrack = async (track: MusicMetadata) => {
    setEditingTrack(track);
    setIsEditing(true);
  };

  const handleSaveTrack = async (track: MusicMetadata) => {
    try {
      const { id, title, artist, album } = track;
      await updateMetadata(id, { title, artist, album });
      setIsEditing(false);
      setEditingTrack(null);
      await refreshMetadata();
      toast.success("Track metadata updated");
    } catch (error) {
      console.error("Error updating track:", error);
      toast.error("Failed to update track metadata");
    }
  };

  const handleTrackSelect = (track: MusicMetadata) => {
    addToQueue(track);
    toast.success(`Added "${track.title}" to queue`);
  };

  const handleDeleteTrack = (track: MusicMetadata) => {
    handleDelete(track);
  };

  const handlePrelistenTimelineClick = (
    e: React.MouseEvent,
    track: MusicMetadata
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = (track.duration || 0) * percentage;

    prelistenRef.current?.seek(newTime);
    setPrelistenTrack({
      ...track,
      currentTime: newTime,
    });
  };

  return (
    <div className="h-full flex-1 flex flex-col container mx-auto p-0">
      <div className="w-full h-full">
        {filteredTracks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {tracks.length === 0 ? "No tracks added yet" : "No tracks found"}
          </div>
        ) : (
          filteredTracks.map((track) => (
            <div
              key={track.id}
              className={cn(
                "p-1 -mb-2 group flex items-center rounded-lg hover:bg-accent/50 w-full overflow-hidden",
                currentTrack?.id === track.id && "bg-accent"
              )}
            >
              <div className="flex-1 min-w-0 overflow mr-1">
                <div className="font-medium text-sm sm:text-base">
                  {track.removed ? (
                    <span style={{ color: "red" }}>removed </span>
                  ) : null}
                  {track.title}
                </div>
                {track.artist && (
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {track.artist}
                    {track.album && ` - ${track.album}`}
                  </div>
                )}
                {prelistenTrack && (
                  <div
                    className={
                      prelistenTrack.id === track.id && isPrelistening
                        ? ""
                        : "invisible"
                    }
                  >
                    <div className="flex items-center">
                      <span className="text-xs text-muted-foreground mr-2">
                        {formatTime(prelistenTrack.currentTime || 0)}
                      </span>
                      <div
                        className="relative flex-1 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full cursor-pointer"
                        onClick={(e) =>
                          handlePrelistenTimelineClick(e, prelistenTrack)
                        }
                        // onClick={(e) => {
                        //   const rect = e.currentTarget.getBoundingClientRect();
                        //   const x = e.clientX - rect.left;
                        //   const percentage = x / rect.width;
                        //   const newTime =
                        //     (prelistenTrack.duration || 0) * percentage;
                        //   setPrelistenTrack({
                        //     ...prelistenTrack,
                        //     currentTime: newTime,
                        //   });
                        // }}
                      >
                        <div
                          className="absolute inset-y-0 left-0 bg-neutral-500 dark:bg-neutral-300 rounded-full"
                          style={{
                            width: `${
                              ((prelistenTrack.currentTime || 0) /
                                (prelistenTrack.duration || 1)) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground ml-2">
                        -
                        {formatTime(
                          (prelistenTrack.duration || 0) -
                            (prelistenTrack.currentTime || 0)
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {!track.removed && showPreListenButtons && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (prelistenTrack?.id === track.id) {
                        setIsPrelistening(!isPrelistening);
                      } else {
                        setPrelistenTrack(track);
                        setIsPrelistening(true);
                      }
                    }}
                  >
                    {prelistenTrack?.id === track.id && isPrelistening ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {prelistenTrack?.id === track.id && isPrelistening
                        ? "Pause"
                        : "Play"}
                    </span>
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 sm:h-9 sm:w-9"
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      disabled={track.removed}
                      onClick={() => {
                        addToQueue(track);
                        //toast.success(`Added "${track.title}" to queue`)
                      }}
                    >
                      Add to Queue
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={track.removed}
                      onClick={() => {
                        playNext(track);
                        toast.success(`"${track.title}" will play next`);
                      }}
                    >
                      Play Next
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={track.removed}
                      onClick={() => {
                        playLast(track);
                        toast.success(`Added "${track.title}" to end of queue`);
                      }}
                    >
                      Play Last
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEditTrack(track)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit metadata
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDeleteTrack(track)}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog
        open={isEditing}
        onOpenChange={(open) => !open && setIsEditing(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Track Metadata</DialogTitle>
          </DialogHeader>
          {editingTrack && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="title"
                  value={editingTrack.title}
                  onChange={(e) =>
                    setEditingTrack({ ...editingTrack, title: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="artist" className="text-sm font-medium">
                  Artist
                </label>
                <Input
                  id="artist"
                  value={editingTrack.artist}
                  onChange={(e) =>
                    setEditingTrack({ ...editingTrack, artist: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="album" className="text-sm font-medium">
                  Album
                </label>
                <Input
                  id="album"
                  value={editingTrack.album}
                  onChange={(e) =>
                    setEditingTrack({ ...editingTrack, album: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => editingTrack && handleSaveTrack(editingTrack)}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
