import { Button } from "@/components/ui/button";
import { InputWithDefault } from "@/components/ui/input-with-default";
import { Label } from "@/components/ui/label";
import { MusicMetadata } from "@/lib/types/types";
import { EQControls } from "../eq-controls";

interface AdvancedTabProps {
  track: MusicMetadata;
  tracks: MusicMetadata[];
  isMultipleEdit: boolean;
  editedValues: Partial<MusicMetadata>;
  handleTrackChange: (changes: Partial<MusicMetadata>) => void;
  commonValues: Partial<Record<keyof MusicMetadata, any>>;
}

export function AdvancedTab({
  track,
  tracks,
  isMultipleEdit,
  editedValues,
  handleTrackChange,
  commonValues,
}: AdvancedTabProps) {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="startTime" className="text-right">
          Start Time
        </Label>
        <div className="col-span-3 flex items-center gap-2">
          <InputWithDefault
            id="startTime"
            type="number"
            min={0}
            max={track.duration}
            step={1}
            value={editedValues.startTime ?? (commonValues.startTime === null ? "" : (commonValues.startTime || ""))}
            defaultValue={0}
            onValueChange={(val) =>
              handleTrackChange({
                startTime: Number(val),
              })
            }
          />
          <span className="text-sm text-gray-500">seconds</span>
          {commonValues.startTime === null && !editedValues.startTime && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTrackChange({ startTime: tracks[0].startTime })}
              className="whitespace-nowrap"
            >
              Apply to all
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="endTimeOffset" className="text-right">
          End Offset
        </Label>
        <div className="col-span-3 flex items-center gap-2">
          <InputWithDefault
            id="endTimeOffset"
            type="number"
            min={0}
            max={track.duration}
            step={1}
            value={editedValues.endTimeOffset ?? (commonValues.endTimeOffset === null ? "" : (commonValues.endTimeOffset || ""))}
            defaultValue={0}
            onValueChange={(val) =>
              handleTrackChange({
                endTimeOffset: Number(val),
              })
            }
          />
          <span className="text-sm text-gray-500">
            seconds from end
          </span>
          {commonValues.endTimeOffset === null && !editedValues.endTimeOffset && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTrackChange({ endTimeOffset: tracks[0].endTimeOffset })}
              className="whitespace-nowrap"
            >
              Apply to all
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="fadeDuration" className="text-right">
          Fade Duration
        </Label>
        <div className="col-span-3 flex items-center gap-2">
          <InputWithDefault
            id="fadeDuration"
            type="number"
            min={0}
            step={0.1}
            value={editedValues.fadeDuration ?? (commonValues.fadeDuration === null ? "" : (commonValues.fadeDuration || ""))}
            defaultValue={0}
            onValueChange={(val) =>
              handleTrackChange({
                fadeDuration: Number(val),
              })
            }
          />
          <span className="text-sm text-gray-500">seconds</span>
          {commonValues.fadeDuration === null && !editedValues.fadeDuration && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTrackChange({ fadeDuration: tracks[0].fadeDuration })}
              className="whitespace-nowrap"
            >
              Apply to all
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="endTimeFadeDuration" className="text-right">
          End Fade duration
        </Label>
        <div className="col-span-3 flex items-center gap-2">
          <InputWithDefault
            id="endTimeFadeDuration"
            type="number"
            min={0}
            max={track.duration}
            step={0.1}
            value={editedValues.endTimeFadeDuration ?? (commonValues.endTimeFadeDuration === null ? "" : (commonValues.endTimeFadeDuration || ""))}
            defaultValue={0}
            onValueChange={(val) =>
              handleTrackChange({
                endTimeFadeDuration: Number(val),
              })
            }
          />
          <span className="text-sm text-gray-500">
            seconds
          </span>
          {commonValues.endTimeFadeDuration === null && !editedValues.endTimeFadeDuration && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTrackChange({ endTimeFadeDuration: tracks[0].endTimeFadeDuration })}
              className="whitespace-nowrap"
            >
              Apply to all
            </Button>
          )}
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <h3 className="text-lg font-medium mb-4">EQ Controls</h3>
        <EQControls track={track} onTrackChange={handleTrackChange} />
      </div>
    </div>
  );
}
