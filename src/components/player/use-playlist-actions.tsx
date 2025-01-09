import { RefObject } from "react";
import { toast } from "sonner";
import { MusicMetadata } from "@/lib/types/types";
import { usePlayerStore } from "@/lib/store";
import { deleteAudioFile } from "@/db/audio-operations";
import { updateMetadata } from "@/db/metadata-operations";
import { PrelistenAudioRef } from "./prelisten-audio-player";

export function usePlaylistActions(prelistenRef: RefObject<PrelistenAudioRef>) {
  const {
    currentTrack,
    isPlaying,
    addToQueue,
    setCurrentTrack,
    setIsPlaying,
    prelistenTrack,
    setPrelistenTrack,
    setIsPrelistening,
    isPrelistening,
  } = usePlayerStore();

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
      toast.success("Track deleted");
      return true;
    } catch (error) {
      toast.error("Failed to delete track");
      console.error(error);
      return false;
    }
  };

  const handleSaveTrack = async (track: MusicMetadata) => {
    try {
      const { id, title, artist, album } = track;
      await updateMetadata(id, { title, artist, album });
      toast.success("Track metadata updated");
      return true;
    } catch (error) {
      console.error("Error updating track:", error);
      toast.error("Failed to update track metadata");
      return false;
    }
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
    setPrelistenTrack(track);
  };

  const handlePrelistenToggle = (track: MusicMetadata) => {
    if (prelistenTrack?.id === track.id) {
      setIsPrelistening(!isPrelistening);
    } else {
      setPrelistenTrack(track);
      setIsPrelistening(true);
    }
  };

  return {
    handlePlay,
    handleDelete,
    handleSaveTrack,
    handlePrelistenTimelineClick,
    handlePrelistenToggle,
    addToQueue,
  };
}
