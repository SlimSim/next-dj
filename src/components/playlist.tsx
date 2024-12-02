import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { usePlayerStore } from '@/lib/store'
import { getAllMetadata, deleteAudioFile, updateMetadata } from '@/lib/db'
import { MusicMetadata } from '@/lib/types'
import { formatTime, cn } from '@/lib/utils'
import { MoreVertical, Play, Pencil, Trash } from 'lucide-react'

export function Playlist() {
  const [tracks, setTracks] = useState<MusicMetadata[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [editingTrack, setEditingTrack] = useState<MusicMetadata | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  
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
  } = usePlayerStore()

  useEffect(() => {
    loadTracks()
  }, [])

  const loadTracks = async () => {
    try {
      const metadata = await getAllMetadata()
      setTracks(metadata)
    } catch (error) {
      toast.error('Failed to load tracks')
      console.error(error)
    }
  }

  const refreshMetadata = async () => {
    try {
      const metadata = await getAllMetadata()
      setTracks(metadata)
    } catch (error) {
      toast.error('Failed to load tracks')
      console.error(error)
    }
  }

  const filteredTracks = tracks.filter((track) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      track.title.toLowerCase().includes(searchLower) ||
      track.artist.toLowerCase().includes(searchLower) ||
      track.album.toLowerCase().includes(searchLower)
    )
  })

  const handlePlay = (track: MusicMetadata) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying)
    } else {
      setCurrentTrack(track)
      setIsPlaying(true)
    }
  }

  const handleDelete = async (track: MusicMetadata) => {
    try {
      await deleteAudioFile(track.id)
      await loadTracks()
      toast.success('Track deleted')
    } catch (error) {
      toast.error('Failed to delete track')
      console.error(error)
    }
  }

  const handleEditTrack = async (track: MusicMetadata) => {
    setEditingTrack(track)
    setIsEditing(true)
  }

  const handleSaveTrack = async (updatedTrack: MusicMetadata) => {
    try {
      await updateMetadata(updatedTrack)
      setIsEditing(false)
      setEditingTrack(null)
      await refreshMetadata()
    } catch (error) {
      console.error('Error updating track:', error)
    }
  }

  const handleTrackSelect = (track: MusicMetadata) => {
    addToQueue(track)
    toast.success(`Added "${track.title}" to queue`)
  }

  const handleDeleteTrack = (track: MusicMetadata) => {
    handleDelete(track)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search tracks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-16rem)] rounded-md border">
        <div className="space-y-1 p-2">
          {filteredTracks.map((track) => (
            <div
              key={track.id}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 sm:px-3 py-2 hover:bg-accent/50 cursor-pointer",
                currentTrack?.id === track.id && "bg-accent"
              )}
              onClick={() => handleTrackSelect(track)}
            >
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium text-sm sm:text-base">
                  {track.title}
                </div>
                {track.artist && (
                  <div className="truncate text-xs sm:text-sm text-muted-foreground">
                    {track.artist}
                    {track.album && ` - ${track.album}`}
                  </div>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => {
                    addToQueue(track)
                    toast.success(`Added "${track.title}" to queue`)
                  }}>
                    Add to Queue
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    playNext(track)
                    toast.success(`"${track.title}" will play next`)
                  }}>
                    Play Next
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    playLast(track)
                    toast.success(`Added "${track.title}" to end of queue`)
                  }}>
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
          ))}

          {filteredTracks.length === 0 && (
            <div className="px-4 py-8 text-center text-muted-foreground">
              {tracks.length === 0
                ? "No tracks added yet. Add some music to get started!"
                : "No tracks found matching your search."}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
