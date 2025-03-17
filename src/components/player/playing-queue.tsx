import { useCallback, useEffect, useState } from "react";
import { usePlayerStore } from "@/lib/store";
import { MusicMetadata } from "@/lib/types/types";
import { createErrorHandler } from "@/features/audio/utils/errorUtils";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { X, Trash } from "lucide-react";
import { Button } from "../ui/button";
import { ConfirmButton } from "../ui/confirm-button";
import { QueueItem } from "./queue-item";

const handleError = createErrorHandler('PlayingQueue');

export function PlayingQueue() {
  const {
    queue,
    currentTrack,
    history,
    isQueueVisible,
    setQueueVisible,
    clearAll,
    setQueue,
    setHistory,
  } = usePlayerStore();

  // Track drag position for mobile slide
  const [dragPosition, setDragPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Handle touch drag for sliding panel
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    setDragPosition(e.touches[0].clientY);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;
      const diff = e.touches[0].clientY - dragPosition;
      // Update panel position...
      setDragPosition(e.touches[0].clientY);
    },
    [isDragging, dragPosition]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    // Snap to open/closed position based on drag distance
  }, []);

  // Configure DnD sensors
  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));

  /**
   * Handle the end of a drag operation.
   * 
   * This function updates the queue and history based on the drag operation.
   * 
   * @param event The drag end event.
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      try {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        // Get all tracks, including history, current track, and queue
        const allTracks = [...history, currentTrack, ...queue].filter(
          (track): track is NonNullable<typeof track> => Boolean(track)
        );
        const draggedTrack = allTracks.find(
          (track) => track.queueId === active.id
        );
        const targetTrack = allTracks.find((track) => track.queueId === over.id);

        if (!draggedTrack || !targetTrack) {
          throw new AudioError(
            'Invalid track for drag operation',
            AudioErrorCode.TRACK_NOT_FOUND
          );
        }

        // Get the indices of the current track, dragged track, and target track
        const currentTrackIndex = currentTrack
          ? allTracks.findIndex((track) => track.queueId === currentTrack.queueId)
          : -1;
        const draggedIndex = allTracks.findIndex(
          (track) => track.queueId === active.id
        );
        const targetIndex = allTracks.findIndex(
          (track) => track.queueId === over.id
        );

        // Special handling for moving the currently playing track
        if (currentTrack && active.id === currentTrack.queueId) {
          if (targetIndex < currentTrackIndex) {
            // Move tracks from history to queue
            const tracksToQueue = history.slice(-Math.max(0, currentTrackIndex - targetIndex));
            const remainingHistory = history.slice(0, -Math.max(0, currentTrackIndex - targetIndex));
            setHistory(remainingHistory);
            setQueue([...tracksToQueue, ...queue]);
          } else {
            // Move tracks from queue to history
            const tracksToHistory = queue.slice(0, Math.max(0, targetIndex - currentTrackIndex));
            const remainingQueue = queue.slice(Math.max(0, targetIndex - currentTrackIndex));
            setHistory([...history, ...tracksToHistory]);
            setQueue(remainingQueue);
          }
          return;
        }

        // Create new queue and history arrays
        let newQueue = [...queue];
        let newHistory = [...history];

        // Remove the dragged track from its original list
        const isFromHistory = draggedIndex < currentTrackIndex;
        if (isFromHistory) {
          newHistory = newHistory.filter(t => t.queueId !== active.id);
        } else {
          newQueue = newQueue.filter(t => t.queueId !== active.id);
        }

        // Calculate the insertion position based on the drag direction
        const isMovingUp = draggedIndex > targetIndex;
        const adjustedTargetIndex = isMovingUp ? targetIndex : targetIndex + 1;
        const isTargetInHistory = adjustedTargetIndex <= currentTrackIndex;

        // Insert the dragged track at its new position
        if (isTargetInHistory) {
          newHistory.splice(adjustedTargetIndex, 0, draggedTrack);
        } else {
          const queueTargetIndex = adjustedTargetIndex - (currentTrackIndex + 1);
          newQueue.splice(queueTargetIndex, 0, draggedTrack);
        }

        // Update the queue and history
        setHistory(newHistory);
        setQueue(newQueue);
      } catch (error) {
        console.error('Error during drag and drop:', error);
      }
    },
    [currentTrack, history, queue, setHistory, setQueue]
  );

  // Calculate the number of next songs
  const nextSongsCount = queue.length;

  if (!isQueueVisible) return null;

  return (
    <div className="absolute bottom-full w-full bg-background/80 backdrop-blur-sm border-t transform transition-transform duration-300 ease-in-out">
      <div className="container max-w-2xl mx-auto">
        <div
          className="h-8 flex items-center justify-center cursor-grab touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-16 h-1 bg-muted-foreground/25 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-3 sm:px-4 py-2">
          <h2 className="text-base sm:text-lg font-semibold">Playing Queue</h2>
          <span className="text-sm sm:text-base">Next: {nextSongsCount}</span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9"
              onClick={() => setQueueVisible(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <ConfirmButton
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9"
              onClick={() => clearAll()}
            >
              <Trash className="h-4 w-4" />
              <span className="sr-only">Clear All</span>
            </ConfirmButton>
          </div>
        </div>

        <div className="px-3 sm:px-4 pb-4 max-h-[40vh] sm:max-h-[60vh] overflow-y-auto">
          {history.length === 0 && !currentTrack && queue.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Queue is empty
            </div>
          ) : (
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <SortableContext
                items={[...history, currentTrack, ...queue]
                  .filter((track): track is NonNullable<typeof track> =>
                    Boolean(track)
                  )
                  .map((track) => ({ id: track.queueId }))}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {[...history, currentTrack, ...queue]
                    .filter((track): track is NonNullable<typeof track> =>
                      Boolean(track)
                    )
                    .map((track, index) => (
                      <QueueItem
                        key={`${track.queueId}-${index}`}
                        track={track}
                        isPlaying={currentTrack?.queueId === track.queueId}
                        isHistory={index < history.length}
                      />
                    ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}
