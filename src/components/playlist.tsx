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
import { MoreVertical, Play, Pause, Pencil, Trash } from 'lucide-react'

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
    refreshTrigger,
    prelistenTrack,
    isPrelistening,
    setPrelistenTrack,
    setIsPrelistening,
  } = usePlayerStore()

  useEffect(() => {
    loadTracks()
  }, [refreshTrigger]) // Reload tracks when refreshTrigger changes

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
    <div className="h-full flex flex-col container mx-auto px-3 sm:px-4 py-2">
      <div className="flex-none mb-4">
        <Input
          type="search"
          placeholder="Search tracks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-2 pr-4">
          {filteredTracks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {tracks.length === 0 ? 'No tracks added yet' : 'No tracks found'}
            </div>
          ) : (
            filteredTracks.map((track) => (
              <div
                key={track.id}
                className={cn(
                  'group flex items-center justify-between p-2 rounded-lg hover:bg-accent/50',
                  currentTrack?.id === track.id && 'bg-accent'
                )}
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
                  {prelistenTrack?.id === track.id && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatTime(prelistenTrack.currentTime || 0)}</span>
                        <span>-{formatTime((prelistenTrack.duration || 0) - (prelistenTrack.currentTime || 0))}</span>
                      </div>
                      <div 
                        className="relative h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full cursor-pointer"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = e.clientX - rect.left;
                          const percentage = x / rect.width;
                          const newTime = (prelistenTrack.duration || 0) * percentage;
                          setPrelistenTrack({ ...prelistenTrack, currentTime: newTime });
                        }}
                      >
                        <div 
                          className="absolute inset-y-0 left-0 bg-neutral-900 dark:bg-neutral-100 rounded-full" 
                          style={{ width: `${((prelistenTrack.currentTime || 0) / (prelistenTrack.duration || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
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
                      {prelistenTrack?.id === track.id && isPrelistening ? 'Pause' : 'Play'}
                    </span>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleTrackSelect(track)}>
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
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
