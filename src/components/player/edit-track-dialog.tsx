import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
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
  if (!track) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Track Metadata</DialogTitle>
        </DialogHeader>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSave(track)}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
