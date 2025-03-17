import { useCallback } from "react";
import { usePlayerStore } from "@/lib/store";
import { MusicMetadata } from "@/lib/types/types";
import { formatTime } from "@/features/audio/utils/audioUtils";
import { createErrorHandler } from "@/features/audio/utils/errorUtils";
import { AudioError, AudioErrorCode } from "@/features/audio/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "../ui/button";
import { MoreVertical, GripVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { cn } from "@/lib/utils/common";

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

  const playNow = useCallback(() => {
    try {
      if (isHistory) {
        // Playing from history
        const historyIndex = history.findIndex((t) => t.queueId === track.queueId);
        
        if (historyIndex > -1) {
          // Get all tracks that should move to queue (tracks after the selected one in history)
          const tracksToQueue = history.slice(historyIndex + 1);
          
          // Remove all these tracks from history
          tracksToQueue.forEach(t => removeFromHistory(t.queueId));
          
          // Remove the selected track from history
          removeFromHistory(track.queueId);
          
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
        removeFromHistory(track.queueId);
      } else {
        removeFromQueue(track.queueId);
      }
    } catch (error) {
      handleError(error);
    }
  }, [isHistory, track.queueId, removeFromQueue, removeFromHistory]);

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
        className="cursor-grab"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </Button>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{track.title}</div>
        <div className="flex items-center flex-wrap text-sm text-muted-foreground">
          <span className="truncate">{track.artist}</span>
          <span className="mx-2">•</span>
          {track.bpm && (
            <>
              <span>
                {Math.round(track.bpm)} <span className="text-[10px]">BPM</span>
              </span>
              <span className="mx-2">•</span>
            </>
          )}
          <span>{formatTime(track.duration)}</span>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={playNow}>Play Now</DropdownMenuItem>
          <DropdownMenuItem onClick={moveToTop}>Move to Top</DropdownMenuItem>
          <DropdownMenuItem onClick={moveToBottom}>
            Move to Bottom
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleRemove}>
            Remove from {isHistory ? "History" : "Queue"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
