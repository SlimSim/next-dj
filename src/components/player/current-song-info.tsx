import { MusicMetadata } from "@/lib/types/types";
import React, { useState, useCallback } from "react";
import { SongInfoCard } from "./song-info-card";
import { usePlayerStore } from "@/lib/store";
import { EditTrackDialog } from "./edit-track-dialog";

interface CurrentSongInfoProps {
  track: MusicMetadata | null;
  currentTime?: number;
  duration?: number;
  variant?: "current" | "next";
}

const CurrentSongInfo: React.FC<CurrentSongInfoProps> = ({
  track,
  duration = 0,
  currentTime = 0,
  variant = "current",
}) => {
  const isNext = variant === "next";
  const prelistenTrack = usePlayerStore((state) => state.prelistenTrack);
  const isPrelistening = usePlayerStore((state) => state.isPrelistening);
  const prelistenCurrentTime = usePlayerStore((state) => state.prelistenCurrentTime);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const setPrelistenTrack = usePlayerStore((state) => state.setPrelistenTrack);
  const setIsPrelistening = usePlayerStore((state) => state.setIsPrelistening);
  const updateTrackMetadata = usePlayerStore((state) => state.updateTrackMetadata);
  const triggerRefresh = usePlayerStore((state) => state.triggerRefresh);
  const queue = usePlayerStore((state) => state.queue);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const addToHistory = usePlayerStore((state) => state.addToHistory);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  
  // State for edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [trackToEdit, setTrackToEdit] = useState<MusicMetadata | null>(null);

  // Handle prelisten toggle for current track
  const handlePrelistenToggle = useCallback((track: MusicMetadata) => {
    // If we're already prelistening to this track, toggle it off
    if (prelistenTrack?.id === track.id && isPrelistening) {
      setIsPrelistening(false);
    } else {
      // Otherwise, start prelistening to this track
      setPrelistenTrack(track);
      setIsPrelistening(true);
    }
  }, [prelistenTrack, isPrelistening, setIsPrelistening, setPrelistenTrack]);

  // Handle prelisten timeline click
  const handlePrelistenTimelineClick = useCallback((e: React.MouseEvent<Element>, track: MusicMetadata) => {
    if (!track) return;
    
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const time = percent * (track.duration || 0);
    
    // Find the prelisten audio element and seek to the calculated time
    const prelistenAudio = document.getElementById('prelisten-audio') as HTMLAudioElement;
    if (prelistenAudio) {
      prelistenAudio.currentTime = time;
    }
  }, []);

  // Handle "Play Now" for the next track
  const handlePlayNow = useCallback(() => {
    if (!track || !isNext) return;

    try {
      // If there's a current track, add it to history
      if (currentTrack) {
        addToHistory(currentTrack);
      }
      
      // If this is the first item in the queue, remove it
      if (queue.length > 0 && queue[0].id === track.id) {
        // Remove this track from the queue
        setQueue(queue.slice(1));
      }
      
      // Set as current track and play
      setCurrentTrack(track);
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing next track:', error);
    }
  }, [track, isNext, currentTrack, queue, addToHistory, setQueue, setCurrentTrack, setIsPlaying]);

  // Handle edit track metadata
  const handleEditTrack = useCallback((track: MusicMetadata) => {
    setTrackToEdit(track);
    setShowEditDialog(true);
  }, [setTrackToEdit, setShowEditDialog]);

  // Handle saving track changes
  const handleSaveTrack = useCallback(async (updatedTracks: MusicMetadata[]) => {
    if (!updatedTracks.length) return;
    
    const updatedTrack = updatedTracks[0];
    
    try {
      // Import the database function to directly update the track in the database
      const { updateAudioMetadata } = await import('@/db/audio-operations');
      
      // First update the track in the database to ensure persistence
      await updateAudioMetadata(updatedTrack);
      
      // Then update the track in the store
      updateTrackMetadata(updatedTrack.id, updatedTrack);
      
      // Force a refresh to ensure all components reload their data
      triggerRefresh();
      
    } catch (error) {
      console.error('Error updating track metadata from footer:', error);
    }
    
    // Close dialog
    setShowEditDialog(false);
  }, [updateTrackMetadata, triggerRefresh, setShowEditDialog]);

  // If no track, don't render anything
  if (!track) return null;

  return (
    <div className="flex flex-1 items-center gap-2">
      <SongInfoCard
        track={track}
        currentTrack={currentTrack}
        prelistenTrack={prelistenTrack}
        isPrelistening={isPrelistening}
        prelistenCurrentTime={prelistenCurrentTime}
        currentTime={currentTime}
        duration={duration}
        variant={isNext ? 'next' : 'player'}
        compact={true}
        showPreListenButtons={true} /* Show pre-listen buttons for all variants */
        onPrelistenToggle={handlePrelistenToggle}
        onPrelistenTimelineClick={handlePrelistenTimelineClick}
        onPlayNow={handlePlayNow}
        onEditTrack={handleEditTrack}
      />
      
      {/* Edit Track Dialog */}
      {showEditDialog && trackToEdit && (
        <EditTrackDialog
          tracks={[trackToEdit]}
          isOpen={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open);
            if (!open) setTrackToEdit(null);
          }}
          onTrackChange={(updatedTracks) => {
            // This is called when tracks change in the dialog
          }}
          onSave={handleSaveTrack}
        />
      )}
    </div>
  );
};

export default CurrentSongInfo;
