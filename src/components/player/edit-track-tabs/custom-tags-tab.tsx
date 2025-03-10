import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MusicMetadata } from "@/lib/types/types";
import { asCustomKey } from "@/lib/utils/metadata";
import { usePlayerStore } from "@/lib/store";
import { useEffect } from "react";
import { UseFormRegister, UseFormSetValue } from "react-hook-form";

interface CustomTagsTabProps {
  track: MusicMetadata;
  tracks: MusicMetadata[];
  isMultipleEdit: boolean;
  editedValues: Partial<MusicMetadata>;
  handleTrackChange: (changes: Partial<MusicMetadata>) => void;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
}

export function CustomTagsTab({
  track,
  tracks,
  isMultipleEdit,
  editedValues,
  handleTrackChange,
  register,
  setValue,
}: CustomTagsTabProps) {
  const { customMetadata } = usePlayerStore();

  // Initialize custom metadata values
  useEffect(() => {
    if (!isMultipleEdit) {
      customMetadata.fields.forEach((field) => {
        const customKey = asCustomKey(field.id);
        const value = track?.customMetadata?.[customKey];
        if (value) {
          setValue(customKey, value);
        }
      });
    }
  }, [customMetadata.fields, setValue, track, isMultipleEdit]);

  return (
    <div className="grid gap-4 py-4">
      {customMetadata.fields.map((field) => {
        const customKey = asCustomKey(field.id);
        const value = editedValues[customKey as keyof MusicMetadata] ?? tracks[0]?.customMetadata?.[customKey] ?? "";
        
        return (
          <div key={field.id} className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor={customKey} className="text-right">
              {field.name}
            </Label>
            <Input
              id={customKey}
              {...register(customKey)}
              value={value?.toString() ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                handleTrackChange({
                  customMetadata: {
                    ...tracks[0].customMetadata,
                    [customKey]: value,
                  },
                });
              }}
              className="col-span-3"
            />
          </div>
        );
      })}
    </div>
  );
}
