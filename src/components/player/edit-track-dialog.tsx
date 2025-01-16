import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateMetadata } from "@/db/metadata-operations";
import { usePlayerStore } from "@/lib/store";
import { MusicMetadata } from "@/lib/types/types";

interface EditTrackDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  track: MusicMetadata | null;
  onTrackChange: (track: MusicMetadata) => void;
  onSave: (track: MusicMetadata) => void;
}

export function EditTrackDialog({
  isOpen,
  onOpenChange,
  track,
  onTrackChange,
  onSave,
}: EditTrackDialogProps) {
  const { triggerRefresh, updateTrackMetadata } = usePlayerStore();

  if (!track) return null;

  const handleSave = async () => {
    try {
      await updateMetadata(track.id, {
        title: track.title,
        artist: track.artist,
        album: track.album,
        track: track.track,
        year: track.year,
        genre: track.genre,
        bpm: track.bpm,
        rating: track.rating,
        comment: track.comment,
        volume: track.volume,
        startTime: track.startTime,
        endTimeOffset: track.endTimeOffset,
        fadeDuration: track.fadeDuration,
        fadeOutDuration: track.fadeOutDuration,
      });

      // Always preserve reference when saving to prevent restart
      updateTrackMetadata(track.id, {
        ...track,
        __preserveRef: true,
      });

      triggerRefresh();
      onSave(track);
    } catch (error) {
      console.error("Error updating metadata:", error);
    }
  };

  const handleTrackChange = (updates: Partial<MusicMetadata>) => {
    const updatedTrack = { ...track, ...updates };
    onTrackChange(updatedTrack);

    // Mark all metadata updates from dialog as non-restarting
    updateTrackMetadata(track.id, {
      ...updates,
      __preserveRef: true, // Special flag to prevent track restart
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Track Metadata</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Advanced</TabsTrigger>
          </TabsList>
          <ScrollArea className="h-[60vh] sm:h-[50vh]">
            <TabsContent value="basic" className="mt-0 border-0">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={track.title}
                    className="col-span-3"
                    onChange={(e) =>
                      handleTrackChange({ title: e.currentTarget.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="artist" className="text-right">
                    Artist
                  </Label>
                  <Input
                    id="artist"
                    value={track.artist}
                    className="col-span-3"
                    onChange={(e) =>
                      handleTrackChange({ artist: e.currentTarget.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="album" className="text-right">
                    Album
                  </Label>
                  <Input
                    id="album"
                    value={track.album}
                    className="col-span-3"
                    onChange={(e) =>
                      handleTrackChange({ album: e.currentTarget.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="track" className="text-right">
                    Track Number
                  </Label>
                  <Input
                    id="track"
                    type="number"
                    value={track.track || ""}
                    className="col-span-3"
                    onChange={(e) =>
                      handleTrackChange({
                        track: parseInt(e.currentTarget.value) || undefined,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="year" className="text-right">
                    Year
                  </Label>
                  <Input
                    id="year"
                    type="number"
                    value={track.year || ""}
                    className="col-span-3"
                    onChange={(e) =>
                      handleTrackChange({
                        year: parseInt(e.currentTarget.value) || undefined,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="genre" className="text-right">
                    Genre
                  </Label>
                  <Input
                    id="genre"
                    value={track.genre?.join(", ") || ""}
                    className="col-span-3"
                    onChange={(e) =>
                      handleTrackChange({
                        genre: e.currentTarget.value
                          .split(",")
                          .map((g) => g.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Jazz, Rock, Pop, Swing etc."
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="details" className="mt-0 border-0">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bpm" className="text-right">
                    BPM
                  </Label>
                  <Input
                    id="bpm"
                    type="number"
                    value={track.bpm || ""}
                    className="col-span-3"
                    onChange={(e) =>
                      handleTrackChange({
                        bpm: parseInt(e.currentTarget.value) || undefined,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="volume" className="text-right">
                    Volume
                  </Label>
                  <div className="col-span-3">
                    <Slider
                      id="volume"
                      min={0.1}
                      max={2}
                      step={0.05}
                      value={[track.volume ?? 0.75]}
                      onValueChange={([value]) =>
                        handleTrackChange({ volume: value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="startTime" className="text-right">
                    Start Time
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="startTime"
                      type="number"
                      min={0}
                      max={track.duration}
                      step={1}
                      value={track.startTime ?? 0}
                      onChange={(e) =>
                        handleTrackChange({
                          startTime: parseFloat(e.currentTarget.value),
                        })
                      }
                    />
                    <span className="text-sm text-gray-500">seconds</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="endTimeOffset" className="text-right">
                    End Offset
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="endTimeOffset"
                      type="number"
                      min={0}
                      max={track.duration}
                      step={1}
                      value={track.endTimeOffset ?? 0}
                      onChange={(e) =>
                        handleTrackChange({
                          endTimeOffset: parseFloat(e.currentTarget.value),
                        })
                      }
                    />
                    <span className="text-sm text-gray-500">
                      seconds from end
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fadeOutDuration" className="text-right">
                    Fade Out Duration
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="fadeOutDuration"
                      type="number"
                      min={0}
                      step={0.1}
                      value={track.fadeOutDuration ?? 0}
                      onChange={(e) =>
                        handleTrackChange({
                          fadeOutDuration: parseFloat(e.currentTarget.value),
                        })
                      }
                    />
                    <span className="text-sm text-gray-500">seconds</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="fadeDuration" className="text-right">
                    Fade Duration
                  </Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input
                      id="fadeDuration"
                      type="number"
                      min={0}
                      step={0.1}
                      value={track.fadeDuration ?? 0}
                      onChange={(e) =>
                        handleTrackChange({
                          fadeDuration: parseFloat(e.currentTarget.value),
                        })
                      }
                    />
                    <span className="text-sm text-gray-500">seconds</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="rating" className="text-right">
                    Rating
                  </Label>
                  <div className="col-span-3">
                    <Slider
                      id="rating"
                      min={0}
                      max={1}
                      step={0.2}
                      value={[track.rating || 0]}
                      onValueChange={([value]) =>
                        handleTrackChange({ rating: value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="comment" className="text-right">
                    Comment
                  </Label>
                  <Input
                    id="comment"
                    value={track.comment || ""}
                    className="col-span-3"
                    onChange={(e) =>
                      handleTrackChange({ comment: e.currentTarget.value })
                    }
                  />
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
