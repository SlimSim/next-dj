import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { MusicMetadata } from "@/lib/types/types";

interface BasicInfoTabProps {
  track: MusicMetadata;
  tracks: MusicMetadata[];
  isMultipleEdit: boolean;
  editedValues: Partial<MusicMetadata> & { genreInput?: string };
  handleTrackChange: (changes: Partial<MusicMetadata> & { genreInput?: string }) => void;
  commonValues: Partial<Record<keyof MusicMetadata, any>>;
}

export function BasicInfoTab({
  track,
  tracks,
  isMultipleEdit,
  editedValues,
  handleTrackChange,
  commonValues,
}: BasicInfoTabProps) {
  return (
    <div className="grid gap-4 py-4">
      {!isMultipleEdit && (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="title" className="text-right">
            Title
          </Label>
          <Input
            id="title"
            value={editedValues.title ?? track.title ?? ""}
            onChange={(e) =>
              handleTrackChange({
                title: e.target.value,
              })
            }
            className="col-span-3"
          />
        </div>
      )}

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="artist" className="text-right">
          Artist
        </Label>
        <div className="col-span-3 flex gap-2">
          <Input
            id="artist"
            value={editedValues.artist ?? (commonValues.artist === null ? "" : (commonValues.artist || ""))}
            placeholder={commonValues.artist === null ? "Multiple values" : ""}
            onChange={(e) =>
              handleTrackChange({
                artist: e.target.value,
              })
            }
            className="flex-1"
          />
          {commonValues.artist === null && !editedValues.artist && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTrackChange({ artist: tracks[0].artist })}
              className="whitespace-nowrap"
            >
              Apply to all
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="album" className="text-right">
          Album
        </Label>
        <div className="col-span-3 flex gap-2">
          <Input
            id="album"
            value={editedValues.album ?? (commonValues.album === null ? "" : (commonValues.album || ""))}
            placeholder={commonValues.album === null ? "Multiple values" : ""}
            onChange={(e) =>
              handleTrackChange({
                album: e.target.value,
              })
            }
            className="flex-1"
          />
          {commonValues.album === null && !editedValues.album && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTrackChange({ album: tracks[0].album })}
              className="whitespace-nowrap"
            >
              Apply to all
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="track" className="text-right">
          Track Number
        </Label>
        <div className="col-span-3 flex gap-2">
          <Input
            id="track"
            type="number"
            value={editedValues.track ?? (commonValues.track === null ? "" : (commonValues.track?.toString() || ""))}
            placeholder={commonValues.track === null ? "Multiple values" : ""}
            onChange={(e) =>
              handleTrackChange({
                track: Number(e.target.value),
              })
            }
            className="flex-1"
          />
          {commonValues.track === null && !editedValues.track && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTrackChange({ track: tracks[0].track })}
              className="whitespace-nowrap"
            >
              Apply to all
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="year" className="text-right">
          Year
        </Label>
        <div className="col-span-3 flex gap-2">
          <Input
            id="year"
            type="number"
            value={editedValues.year ?? (commonValues.year === null ? "" : (commonValues.year?.toString() || ""))}
            placeholder={commonValues.year === null ? "Multiple values" : ""}
            onChange={(e) =>
              handleTrackChange({
                year: Number(e.target.value),
              })
            }
            className="flex-1"
          />
          {commonValues.year === null && !editedValues.year && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTrackChange({ year: tracks[0].year })}
              className="whitespace-nowrap"
            >
              Apply to all
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="genre" className="text-right">
          Genre
        </Label>
        <div className="col-span-3 flex gap-2">
          <Input
            id="genre"
            value={editedValues.genreInput ?? (commonValues.genre === null ? "" : (commonValues.genre?.join(", ") || ""))}
            placeholder={commonValues.genre === null ? "Multiple values" : "Enter genres separated by commas"}
            onChange={(e) => {
              // Just store the raw input string in a temporary state
              handleTrackChange({
                genreInput: e.target.value,
                // Keep the previous genre array until blur
                genre: editedValues.genre
              });
            }}
            onBlur={(e) => {
              // On blur, process the input string into an array
              const genres = e.target.value
                .split(",")
                .map(g => g.trim()) // Only trim start/end
                .filter(g => g.length > 0);
              
              handleTrackChange({
                genre: genres
              });
            }}
            className="flex-1"
          />
          {commonValues.genre === null && !editedValues.genre && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTrackChange({ genre: tracks[0].genre })}
              className="whitespace-nowrap"
            >
              Apply to all
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="bpm" className="text-right">
          BPM
        </Label>
        <div className="col-span-3 flex gap-2">
          <Input
            id="bpm"
            type="number"
            value={editedValues.bpm ?? (commonValues.bpm === null ? "" : (commonValues.bpm?.toString() || ""))}
            placeholder={commonValues.bpm === null ? "Multiple values" : ""}
            onChange={(e) =>
              handleTrackChange({
                bpm: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="flex-1"
          />
          {commonValues.bpm === null && !editedValues.bpm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTrackChange({ bpm: tracks[0].bpm })}
              className="whitespace-nowrap"
            >
              Apply to all
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="volume" className="text-right">
          Volume
        </Label>
        <div className="col-span-3 flex items-center gap-4">
          <Slider
            id="volume"
            min={0}
            max={2}
            step={0.1}
            value={[editedValues.volume ?? (commonValues.volume === null ? 1 : (commonValues.volume || 1))]}
            onValueChange={([value]) =>
              handleTrackChange({
                volume: value,
              })
            }
          />
          <span className="w-12 text-sm">
            {(editedValues.volume ?? (commonValues.volume === null ? 1 : (commonValues.volume || 1))).toFixed(1)}
          </span>
          {commonValues.volume === null && !editedValues.volume && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTrackChange({ volume: tracks[0].volume })}
              className="whitespace-nowrap"
            >
              Apply to all
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="rating" className="text-right">
          Rating
        </Label>
        <div className="col-span-3 flex items-center gap-4">
          <Slider
            id="rating"
            min={0}
            max={5}
            step={1}
            value={[editedValues.rating ?? (commonValues.rating === null ? 0 : (Math.round((commonValues.rating || 0) * 5)))]}
            onValueChange={([value]) =>
              handleTrackChange({
                rating: value / 5,
              })
            }
          />
          <span className="w-12 text-sm">
            {editedValues.rating ?? (commonValues.rating === null ? 0 : (Math.round((commonValues.rating || 0) * 5)))}
          </span>
          {commonValues.rating === null && !editedValues.rating && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTrackChange({ rating: tracks[0].rating })}
              className="whitespace-nowrap"
            >
              Apply to all
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="comment" className="text-right">
          Comment
        </Label>
        <div className="col-span-3 flex gap-2">
          <Input
            id="comment"
            value={editedValues.comment ?? (commonValues.comment === null ? "" : (commonValues.comment || ""))}
            placeholder={commonValues.comment === null ? "Multiple values" : ""}
            onChange={(e) =>
              handleTrackChange({
                comment: e.target.value,
              })
            }
            className="flex-1"
          />
          {commonValues.comment === null && !editedValues.comment && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTrackChange({ comment: tracks[0].comment })}
              className="whitespace-nowrap"
            >
              Apply to all
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
