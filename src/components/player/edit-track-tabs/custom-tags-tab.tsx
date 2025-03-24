import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MusicMetadata } from "@/lib/types/types";
import { asCustomKey } from "@/lib/utils/metadata";
import { usePlayerStore } from "@/lib/store";
import { useEffect } from "react";
import { UseFormRegister, UseFormSetValue } from "react-hook-form";
import { Settings } from "lucide-react";
import { useSettingsDialog } from "@/components/settings/settings-dialog-context";

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
  const { openSettings } = useSettingsDialog();

  const navigateToSettings = () => {
    openSettings("metadata");
  };

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
      {customMetadata.fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="rounded-lg bg-muted/30 p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-2">No Custom Metadata Fields</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Custom metadata allows you to add your own metadata to tracks, such as "last instrument", "name of base player" or "notes".
              You need to create custom metadata fields in the settings before you can use them here.
            </p>
            <Button onClick={navigateToSettings} className="gap-2">
              <Settings className="h-4 w-4" />
              <span>Open Metadata Settings</span>
            </Button>
          </div>
        </div>
      ) : (
        customMetadata.fields.map((field) => {
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
        })
      )}
    </div>
  );
}
