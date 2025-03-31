import { useCallback, useState } from "react";
import { usePlayerStore } from "@/lib/store";
import { MusicMetadata } from "@/lib/types/types";
import { AudioError, AudioErrorCode } from "@/features/audio/types";
import { createErrorHandler } from "@/features/audio/utils/errorUtils";
import { SongInfoCard } from "./song-info-card";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "../ui/button";
import { MoreVertical, GripVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { cn } from "@/lib/utils/common";
import { EditTrackDialog } from "./edit-track-dialog";

const handleError = createErrorHandler('QueueItem');

interface QueueItemProps {
  track: MusicMetadata;
  isPlaying: boolean;
  isHistory?: boolean;
}

export function QueueItem({ track, isPlaying, isHistory }: QueueItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.queueId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const removeFromQueue = usePlayerStore((state) => state.removeFromQueue);
  const removeFromHistory = usePlayerStore((state) => state.removeFromHistory);
  const moveInQueue = usePlayerStore((state) => state.moveInQueue);
  const queue = usePlayerStore((state) => state.queue);
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const addToHistory = usePlayerStore((state) => state.addToHistory);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const history = usePlayerStore((state) => state.history);
  const prelistenTrack = usePlayerStore((state) => state.prelistenTrack);
  const isPrelistening = usePlayerStore((state) => state.isPrelistening);
  const prelistenCurrentTime = usePlayerStore((state) => state.prelistenCurrentTime);
  const setPrelistenTrack = usePlayerStore((state) => state.setPrelistenTrack);
  const setIsPrelistening = usePlayerStore((state) => state.setIsPrelistening);

  const playNow = useCallback(() => {
    try {
      if (isHistory) {
        // Playing from history
        const historyIndex = history.findIndex((t) => t.queueId === track.queueId);
        
        if (historyIndex > -1) {
          // Get all tracks that should move to queue (tracks after the selected one in history)
          const tracksToQueue = history.slice(historyIndex + 1);
          
          // Remove all these tracks from history
          tracksToQueue.forEach(t => removeFromHistory(t.queueId, t.playHistory[t.playHistory.length - 1].timestamp));
          
          // Remove the selected track from history
          removeFromHistory(track.queueId, track.playHistory[track.playHistory.length - 1].timestamp);
          
          // If there's a current track, add it to the tracks that will go to queue
          const newQueueTracks = currentTrack ? [...tracksToQueue, currentTrack] : tracksToQueue;
          
          // Update queue with the new tracks at the start
          setQueue([...newQueueTracks, ...queue]);
          
          // Set as current track and play
          setCurrentTrack(track);
          setIsPlaying(true);
        }
      } else {
        // Playing from queue (keep existing behavior)
        const trackIndex = queue.findIndex((t) => t.queueId === track.queueId);
        if (trackIndex > -1) {
          // If we have a current track, move it to history
          if (currentTrack) {
            addToHistory(currentTrack);
          }
          
          // Add all tracks before this one to history
          queue.slice(0, trackIndex).forEach(t => addToHistory(t));
          
          // Update queue to only include tracks after the selected one
          const newQueue = queue.slice(trackIndex + 1);
          setQueue(newQueue);
          
          // Set this track as current and start playing
          setCurrentTrack(track);
          setIsPlaying(true);
        }
      }
    } catch (error) {
      handleError(error);
    }
  }, [track, currentTrack, queue, history, isHistory, setCurrentTrack, setIsPlaying, addToHistory, setQueue, removeFromHistory]);

  const moveToTop = useCallback(() => {
    try {
      const fromIndex = queue.findIndex((t) => t.queueId === track.queueId);
      if (fromIndex === -1) {
        throw new AudioError(
          'Track not found in queue',
          AudioErrorCode.TRACK_NOT_FOUND
        );
      }
      moveInQueue(fromIndex, 0);
    } catch (error) {
      handleError(error);
    }
  }, [queue, track.queueId, moveInQueue]);

  const moveToBottom = useCallback(() => {
    try {
      const fromIndex = queue.findIndex((t) => t.queueId === track.queueId);
      if (fromIndex === -1) {
        throw new AudioError(
          'Track not found in queue',
          AudioErrorCode.TRACK_NOT_FOUND
        );
      }
      moveInQueue(fromIndex, queue.length - 1);
    } catch (error) {
      handleError(error);
    }
  }, [queue, track.queueId, moveInQueue]);

  const handleRemove = useCallback(() => {
    try {
      if (isHistory) {
        removeFromHistory(track.queueId, track.playHistory[track.playHistory.length - 1].timestamp);
      } else {
        removeFromQueue(track.queueId);
      }
    } catch (error) {
      handleError(error);
    }
  }, [isHistory, track.queueId, removeFromQueue, removeFromHistory]);

  // Handle prelisten toggle
  const handlePrelistenToggle = useCallback((track: MusicMetadata) => {
    // If we're already prelistening to this track, toggle it off
    if (prelistenTrack?.id === track.id && isPrelistening) {
      setIsPrelistening(false);
    } else {
      // Otherwise, start prelistening to this track
      setPrelistenTrack(track);
      setIsPrelistening(true);
    }
  }, [prelistenTrack, isPrelistening, setPrelistenTrack, setIsPrelistening]);

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

  const [editingTrack, setEditingTrack] = useState<MusicMetadata | null>(null);
  const updateTrackMetadata = usePlayerStore((state) => state.updateTrackMetadata);
  const triggerRefresh = usePlayerStore((state) => state.triggerRefresh);
  
  const handleSaveTrack = useCallback(async (updatedTracks: MusicMetadata | MusicMetadata[]) => {
    // Handle both single track and multiple tracks update
    const tracksArray = Array.isArray(updatedTracks) ? updatedTracks : [updatedTracks];
    
    try {
      // Update each track in the database first
      for (const updatedTrack of tracksArray) {
        if (updatedTrack && updatedTrack.id) {
          
          // Import on demand to avoid circular dependencies
          const { updateAudioMetadata } = await import('@/db/audio-operations');
          await updateAudioMetadata(updatedTrack);
          
          // Then update the global store
          updateTrackMetadata(updatedTrack.id, updatedTrack);
        }
      }
      
      // Trigger a refresh to ensure all components reload data from DB
      triggerRefresh();
      
      // Close dialog
      setEditingTrack(null);
    } catch (error) {
      console.error('Error updating track metadata:', error);
    }
  }, [updateTrackMetadata, triggerRefresh]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 bg-background rounded-lg",
        isDragging && "opacity-50",
        isPlaying && "border border-primary",
        isHistory && "opacity-50"
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="cursor-grab flex-shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </Button>
      <div className="flex-1 min-w-0">
        <SongInfoCard
          track={track}
          currentTrack={currentTrack}
          prelistenTrack={prelistenTrack}
          isPrelistening={isPrelistening}
          prelistenCurrentTime={prelistenCurrentTime}
          variant={isHistory ? 'history' : 'queue'}
          isPlaying={isPlaying}
          draggable={false}
          showPreListenButtons={true}
          onPrelistenToggle={handlePrelistenToggle}
          onPrelistenTimelineClick={handlePrelistenTimelineClick}
          onPlayNow={playNow}
          onMoveToTop={!isHistory ? moveToTop : undefined}
          onMoveToBottom={!isHistory ? moveToBottom : undefined}
          onRemove={handleRemove}
          onEditTrack={() => setEditingTrack(track)}
        />
      </div>
      
      {/* Edit dialog for track */}
      <EditTrackDialog
        isOpen={editingTrack !== null}
        onOpenChange={(open: boolean) => {
          if (!open) setEditingTrack(null);
        }}
        track={editingTrack}
        onTrackChange={(updatedTracks) => {
          // This is called when tracks are modified in the dialog but not yet saved
          if (Array.isArray(updatedTracks) && updatedTracks.length > 0) {
            // Just use the first track for preview if multiple are selected
          }
        }}
        onSave={handleSaveTrack}
      />
    </div>
  );
}
