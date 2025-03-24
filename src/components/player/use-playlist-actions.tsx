import { RefObject } from "react";
import { MusicMetadata } from "@/lib/types/types";
import { usePlayerStore } from "@/lib/store";
import { deleteAudioFile, updateAudioMetadata } from "@/db/audio-operations";
import { PrelistenAudioRef } from "./prelisten-audio-player";
import { AudioError, AudioErrorCode, createErrorHandler } from "@/features/audio/utils/errorUtils";
import { toast } from 'sonner'; 

const handleError = createErrorHandler('PlaylistActions');

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
    updateTrackMetadata,
    triggerRefresh,
  } = usePlayerStore();

  const handlePlay = (track: MusicMetadata) => {
    try {
      if (currentTrack?.id === track.id) {
        setIsPlaying(!isPlaying);
      } else {
        setCurrentTrack(track);
        setIsPlaying(true);
      }
    } catch (error) {
      handleError(error);
    }
  };

  const handleDelete = async (track: MusicMetadata) => {
    try {
      await deleteAudioFile(track.id);
    } catch (error) {
      handleError(new AudioError(
        `Failed to delete track: ${track.title}`,
        AudioErrorCode.FILE_ACCESS_DENIED
      ));
    }
  };

  const handleAddToQueue = (track: MusicMetadata) => {
    try {
      addToQueue(track);
    } catch (error) {
      handleError(error);
    }
  };

  const handlePrelistenTimelineClick = (
    e: React.MouseEvent<Element>,
    track: MusicMetadata
  ) => {
    try {
      if (!prelistenRef.current) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const time = percentage * (track.duration || 0);

      prelistenRef.current.seek(time);
    } catch (error) {
      handleError(error);
    }
  };

  const handlePrelistenToggle = (track: MusicMetadata) => {
    try {
      if (prelistenTrack?.id === track.id) {
        setIsPrelistening(!isPrelistening);
      } else {
        setPrelistenTrack(track);
        setIsPrelistening(true);
      }
    } catch (error) {
      handleError(error);
    }
  };

  const handleSaveTrack = async (updatedTrack: MusicMetadata) => {
    try {
      console.log('Saving track in usePlaylistActions:', updatedTrack.title);
      
      // First update the track in the database
      await updateAudioMetadata(updatedTrack);
      
      // Then update the store
      updateTrackMetadata(updatedTrack.id, updatedTrack);
      
      // Trigger a refresh to ensure all UI components update
      triggerRefresh();
      
      console.log('Track saved successfully');
    } catch (error) {
      console.error('Failed to save track:', error);
      handleError(new AudioError(
        `Failed to save track: ${updatedTrack.title}`,
        AudioErrorCode.FILE_ACCESS_DENIED
      ));
      toast.error('Failed to save track metadata');
    }
  };

  return {
    handlePlay,
    handleDelete,
    handleAddToQueue,
    handlePrelistenTimelineClick,
    handlePrelistenToggle,
    handleSaveTrack,
    addToQueue,
  };
}
