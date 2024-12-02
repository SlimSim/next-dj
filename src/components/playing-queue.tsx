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
import { MoreVertical, GripVertical, X } from 'lucide-react'
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
}

function QueueItem({ track, isPlaying }: QueueItemProps) {
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
        isPlaying && 'border border-primary'
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
    isQueueVisible,
    setQueueVisible,
    setQueue,
  } = usePlayerStore()

  // Track drag position for mobile slide
  const [dragPosition, setDragPosition] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  // Handle touch drag for sliding panel
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setDragPosition(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const diff = e.touches[0].clientY - dragPosition
    // Update panel position...
    setDragPosition(e.touches[0].clientY)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    // Snap to open/closed position based on drag distance
  }

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
    console.log('Queue updated:', newQueue)
  }, [queue, setQueue])

  if (!isQueueVisible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-background/80 backdrop-blur-sm border-t transform transition-transform duration-300 ease-in-out">
      <div className="container max-w-2xl mx-auto">
        {/* Handle for sliding */}
        <div
          className="h-8 flex items-center justify-center cursor-grab touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-16 h-1 bg-muted-foreground/25 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2">
          <h2 className="text-base sm:text-lg font-semibold">Playing Queue</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={() => setQueueVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Queue list */}
        <div className="px-3 sm:px-4 pb-4 max-h-[40vh] sm:max-h-[60vh] overflow-y-auto">
          {queue.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Queue is empty
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={queue.map((track) => track.queueId)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {queue.map((track) => (
                    <QueueItem
                      key={track.queueId}
                      track={track}
                      isPlaying={currentTrack?.id === track.id}
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
