import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import { MusicMetadata } from "@/lib/types/types";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Slider } from "../ui/slider";
import { updateMetadata } from "@/db/metadata-operations";
import { usePlayerStore } from "@/lib/store";

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
  const { triggerRefresh } = usePlayerStore();

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
      });

      // Trigger UI refresh
      triggerRefresh();
      onSave(track);
    } catch (error) {
      console.error("Error updating metadata:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Track Metadata</DialogTitle>
          <DialogDescription>
            Edit track information and details
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          <ScrollArea className="h-[60vh] sm:h-[50vh]">
            <TabsContent value="basic" className="mt-0 border-0">
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Title
                  </label>
                  <Input
                    id="title"
                    value={track.title}
                    onChange={(e) =>
                      onTrackChange({ ...track, title: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="artist" className="text-sm font-medium">
                    Artist
                  </label>
                  <Input
                    id="artist"
                    value={track.artist}
                    onChange={(e) =>
                      onTrackChange({ ...track, artist: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="album" className="text-sm font-medium">
                    Album
                  </label>
                  <Input
                    id="album"
                    value={track.album}
                    onChange={(e) =>
                      onTrackChange({ ...track, album: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="track" className="text-sm font-medium">
                      Track Number
                    </label>
                    <Input
                      id="track"
                      type="number"
                      value={track.track || ""}
                      onChange={(e) =>
                        onTrackChange({
                          ...track,
                          track: parseInt(e.target.value) || undefined,
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="year" className="text-sm font-medium">
                      Year
                    </label>
                    <Input
                      id="year"
                      type="number"
                      value={track.year || ""}
                      onChange={(e) =>
                        onTrackChange({
                          ...track,
                          year: parseInt(e.target.value) || undefined,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="details" className="mt-0 border-0">
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="genre" className="text-sm font-medium">
                    Genre
                  </label>
                  <Input
                    id="genre"
                    value={track.genre?.join(", ") || ""}
                    onChange={(e) =>
                      onTrackChange({
                        ...track,
                        genre: e.target.value
                          .split(",")
                          .map((g) => g.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Jazz, Rock, Pop, Swing etc."
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="bpm" className="text-sm font-medium">
                    BPM
                  </label>
                  <Input
                    id="bpm"
                    type="number"
                    value={track.bpm || ""}
                    onChange={(e) =>
                      onTrackChange({
                        ...track,
                        bpm: parseInt(e.target.value) || undefined,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Rating (0-5)</label>
                  <Slider
                    value={[track.rating || 0]}
                    min={0}
                    max={1}
                    step={0.2}
                    onValueChange={(value) =>
                      onTrackChange({ ...track, rating: value[0] })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="comment" className="text-sm font-medium">
                    Comment
                  </label>
                  <Input
                    id="comment"
                    value={track.comment || ""}
                    onChange={(e) =>
                      onTrackChange({ ...track, comment: e.target.value })
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
