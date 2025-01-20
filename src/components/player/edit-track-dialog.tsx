import { Button } from "@/components/ui/button";
import { PlusIcon } from "@radix-ui/react-icons";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputWithDefault } from "@/components/ui/input-with-default";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateMetadata } from "@/db/metadata-operations";
import { usePlayerStore } from "@/lib/store";
import { MusicMetadata } from "@/lib/types/types";
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

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
  const { triggerRefresh, updateTrackMetadata, customMetadata, addCustomMetadataField } = usePlayerStore();
  const [newFieldName, setNewFieldName] = useState("");

  // Initialize custom fields when track or customMetadata changes
  useEffect(() => {
    if (!track) return;

    const updates: Record<string, string> = {};
    let needsUpdate = false;

    customMetadata.fields.forEach((field) => {
      const customKey = `custom_${field.id}`;
      if ((track as any)[customKey] === undefined) {
        updates[customKey] = "";
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      const updatedTrack = { ...track, ...updates };
      onTrackChange(updatedTrack);
      
      // Save empty values to database
      updateMetadata(track.id, updates).catch(console.error);
    }
  }, [track, customMetadata.fields, onTrackChange, updateMetadata]);

  if (!track) return null;

  const handleSave = async () => {
    try {
      // Get all custom metadata keys
      const customKeys = customMetadata.fields.map(field => `custom_${field.id}`);
      
      // Create metadata object including custom fields
      const metadata: Record<string, any> = {
        ...track, // Include all existing track data
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
        endTimeFadeDuration: track.endTimeFadeDuration,
      };

      // Add custom metadata to the object
      customKeys.forEach(key => {
        const value = (track as any)[key];
        if (value !== undefined) {
          metadata[key] = value;
        }
      });

      await updateMetadata(track.id, metadata);

      // Update track metadata in store
      updateTrackMetadata(track.id, {
        ...metadata,
        __preserveRef: true,
      });

      triggerRefresh();
      onSave(track);
    } catch (error) {
      console.error("Error updating metadata:", error);
    }
  };

  const handleTrackChange = (updates: Partial<Record<string, any>>) => {
    const updatedTrack = { ...track, ...updates };
    onTrackChange(updatedTrack);

    // Update store immediately with the changes
    updateTrackMetadata(track.id, {
      ...updates,
      __preserveRef: true,
    });
  };

  const handleAddCustomField = () => {
    if (!newFieldName.trim()) return;
    
    const newField = {
      id: uuidv4(),
      name: newFieldName.trim(),
      type: 'text' as const,
    };
    
    addCustomMetadataField(newField);
    setNewFieldName("");
    
    // Initialize the custom field in the track with an empty string
    const customKey = `custom_${newField.id}`;
    handleTrackChange({
      [customKey]: "",
    });
    
    // Save the empty value immediately to ensure it exists in the database
    updateMetadata(track.id, {
      [customKey]: "",
    }).catch(console.error);
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
                    onChange={(e) =>
                      handleTrackChange({
                        genre: e.target.value.split(",").map((g) => g.trim()),
                      })
                    }
                    className="col-span-3"
                  />
                </div>

                {/* Custom Metadata Fields */}
                {customMetadata.fields.map((field) => {
                  const customKey = `custom_${field.id}`;
                  const value = (track as any)[customKey];
                  
                  return (
                    <div key={field.id} className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor={customKey} className="text-right">
                        {field.name}
                      </Label>
                      <Input
                        id={customKey}
                        value={value ?? ""}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          handleTrackChange({
                            [customKey]: newValue,
                          });
                        }}
                        className="col-span-3"
                      />
                    </div>
                  );
                })}

                {/* Add New Custom Field */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Add Field</Label>
                  <div className="col-span-3 flex gap-2">
                    <Input
                      placeholder="New field name"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleAddCustomField}
                      type="button"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </div>
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
                    <InputWithDefault
                      id="startTime"
                      type="number"
                      min={0}
                      max={track.duration}
                      step={1}
                      value={track.startTime || ""}
                      defaultValue={0}
                      onValueChange={(val) =>
                        handleTrackChange({
                          startTime: Number(val),
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
                    <InputWithDefault
                      id="fadeDuration"
                      type="number"
                      min={0}
                      step={0.1}
                      value={track.fadeDuration || ""}
                      defaultValue={0}
                      onValueChange={(val) =>
                        handleTrackChange({
                          fadeDuration: Number(val),
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
                    <InputWithDefault
                      id="endTimeOffset"
                      type="number"
                      min={0}
                      max={track.duration}
                      step={1}
                      value={track.endTimeOffset || ""}
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
                      value={track.endTimeFadeDuration || ""}
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
