'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePlayerStore } from '@/lib/store'
import { Button } from './ui/button'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MoreVertical, GripVertical, X, Trash } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { MusicMetadata } from '@/lib/types'

interface QueueItemProps {
  track: MusicMetadata
  isPlaying: boolean
  isHistory?: boolean
}

function QueueItem({ track, isPlaying, isHistory }: QueueItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.queueId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const removeFromQueue = usePlayerStore((state) => state.removeFromQueue)
  const moveInQueue = usePlayerStore((state) => state.moveInQueue)
  const queue = usePlayerStore((state) => state.queue)

  const moveToTop = () => {
    const fromIndex = queue.findIndex((t) => t.queueId === track.queueId)
    moveInQueue(fromIndex, 0)
  }

  const moveToBottom = () => {
    const fromIndex = queue.findIndex((t) => t.queueId === track.queueId)
    moveInQueue(fromIndex, queue.length - 1)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-2 bg-background rounded-lg',
        isDragging && 'opacity-50',
        isPlaying && 'border border-primary',
        isHistory && 'opacity-50'
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
        <div className="text-sm text-muted-foreground truncate">
          {track.artist}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={moveToTop}>
            Move to Top
          </DropdownMenuItem>
          <DropdownMenuItem onClick={moveToBottom}>
            Move to Bottom
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => removeFromQueue(track.queueId)}>
            Remove from Queue
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function PlayingQueue() {
  const {
    queue,
    currentTrack,
    history,
    isQueueVisible,
    setQueueVisible,
    clearQueue,
    setQueue,
  } = usePlayerStore()

  // Track drag position for mobile slide
  const [dragPosition, setDragPosition] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  // Handle touch drag for sliding panel
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true)
    setDragPosition(e.touches[0].clientY)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return
    const diff = e.touches[0].clientY - dragPosition
    // Update panel position...
    setDragPosition(e.touches[0].clientY)
  }, [isDragging, dragPosition])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    // Snap to open/closed position based on drag distance
  }, [])

  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor)
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = queue.findIndex((track) => track.queueId === active.id)
    const newIndex = queue.findIndex((track) => track.queueId === over.id)

    const newQueue = arrayMove(queue, oldIndex, newIndex)
    setQueue(newQueue)
  }, [queue, setQueue])

  // Calculate the number of next songs
  const nextSongsCount = queue.length;

  if (!isQueueVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-background/80 backdrop-blur-sm border-t transform transition-transform duration-300 ease-in-out">
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
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9"
              onClick={clearQueue}
            >
              <Trash className="h-4 w-4" />
              <span className="sr-only">Clear Queue</span>
            </Button>
          </div>
        </div>

        <div className="px-3 sm:px-4 pb-4 max-h-[40vh] sm:max-h-[60vh] overflow-y-auto">
          {history.length === 0 && !currentTrack && queue.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Queue is empty
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={[...history, currentTrack, ...queue].filter(Boolean)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {[...history, currentTrack, ...queue].filter(Boolean).map((track, index) => (
                    <QueueItem
                      key={`${track.id}-${index}`}
                      track={track}
                      isPlaying={currentTrack?.id === track.id}
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
  )
}
