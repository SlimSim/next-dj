import { Button } from "@/components/ui/button";
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
import { usePlayerStore } from "@/lib/store";
import { MusicMetadata } from "@/lib/types/types";
import { useEffect } from "react";
import { asCustomKey } from "@/lib/utils/metadata";
import { useForm } from "react-hook-form";

interface CustomField {
  id: string;
  name: string;
  type: 'text';
}

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
  const { 
    triggerRefresh, 
    updateTrackMetadata, 
    customMetadata,
  } = usePlayerStore();

  const { register, setValue } = useForm();

  // Initialize custom metadata values at component level
  useEffect(() => {
    customMetadata.fields.forEach((field) => {
      const customKey = asCustomKey(field.id);
      const value = track?.customMetadata?.[customKey];
      if (value) {
        setValue(customKey, value);
      }
    });
  }, [customMetadata.fields, setValue, track?.customMetadata]);

  const handleSave = async () => {
    if (!track) return;
    
    try {
      // Create metadata object including custom fields
      const metadata: Partial<MusicMetadata> = {
        title: track.title || "",
        artist: track.artist || "",
        album: track.album || "",
        track: track.track,
        year: track.year,
        genre: track.genre,
        bpm: track.bpm,
        rating: track.rating,
        comment: track.comment || "",
        volume: track.volume,
        startTime: track.startTime,
        endTimeOffset: track.endTimeOffset,
        fadeDuration: track.fadeDuration,
        endTimeFadeDuration: track.endTimeFadeDuration,
        customMetadata: track.customMetadata || {},
      };

      await updateTrackMetadata(track.id, metadata);
      onSave(track);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving metadata:', error);
    }
  };

  const handleTrackChange = (changes: Partial<MusicMetadata>) => {
    if (!track) return;
    onTrackChange({ ...track, ...changes });
  };

  if (!track) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Track Metadata</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="custom">Custom Tags</TabsTrigger>
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
                    value={track.title || ""}
                    onChange={(e) =>
                      handleTrackChange({
                        title: e.target.value,
                      })
                    }
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="artist" className="text-right">
                    Artist
                  </Label>
                  <Input
                    id="artist"
                    value={track.artist || ""}
                    onChange={(e) =>
                      handleTrackChange({
                        artist: e.target.value,
                      })
                    }
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="album" className="text-right">
                    Album
                  </Label>
                  <Input
                    id="album"
                    value={track.album || ""}
                    onChange={(e) =>
                      handleTrackChange({
                        album: e.target.value,
                      })
                    }
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="track" className="text-right">
                    Track Number
                  </Label>
                  <Input
                    id="track"
                    type="number"
                    value={track.track?.toString() || ""}
                    onChange={(e) =>
                      handleTrackChange({
                        track: Number(e.target.value),
                      })
                    }
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="year" className="text-right">
                    Year
                  </Label>
                  <Input
                    id="year"
                    type="number"
                    value={track.year?.toString() || ""}
                    onChange={(e) =>
                      handleTrackChange({
                        year: Number(e.target.value),
                      })
                    }
                    className="col-span-3"
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
                        genre: e.target.value.split(", "),
                      })
                    }
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bpm" className="text-right">
                    BPM
                  </Label>
                  <Input
                    id="bpm"
                    type="number"
                    value={track.bpm?.toString() || ""}
                    onChange={(e) =>
                      handleTrackChange({
                        bpm: Number(e.target.value),
                      })
                    }
                    className="col-span-3"
                  />
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
                      value={[track.volume || 1]}
                      onValueChange={([value]) =>
                        handleTrackChange({
                          volume: value,
                        })
                      }
                    />
                    <span className="w-12 text-sm">
                      {(track.volume || 1).toFixed(1)}
                    </span>
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
                      value={[Math.round((track.rating || 0) * 5)]}
                      onValueChange={([value]) =>
                        handleTrackChange({
                          rating: value / 5,
                        })
                      }
                    />
                    <span className="w-12 text-sm">
                      {Math.round((track.rating || 0) * 5)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="comment" className="text-right">
                    Comment
                  </Label>
                  <Input
                    id="comment"
                    value={track.comment || ""}
                    onChange={(e) =>
                      handleTrackChange({
                        comment: e.target.value,
                      })
                    }
                    className="col-span-3"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="mt-0 border-0">
              <div className="grid gap-4 py-4">
                {customMetadata.fields.map((field) => {
                  const customKey = asCustomKey(field.id);
                  const value = track.customMetadata?.[customKey] ?? "";
                  
                  return (
                    <div key={field.id} className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor={customKey} className="text-right">
                        {field.name}
                      </Label>
                      <Input
                        id={customKey}
                        value={value}
                        onChange={(e) => handleTrackChange({
                          customMetadata: {
                            ...track.customMetadata,
                            [customKey]: e.target.value,
                          }
                        })}
                        className="col-span-3"
                      />
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="details" className="mt-0 border-0">
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
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
