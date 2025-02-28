import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputWithDefault } from "@/components/ui/input-with-default";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlayerStore } from "@/lib/store";
import { MusicMetadata } from "@/lib/types/types";
import { useEffect, useMemo, useState } from "react";
import { asCustomKey } from "@/lib/utils/metadata";
import { useForm } from "react-hook-form";
import { EQControls } from "./eq-controls";

interface EditTrackDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tracks?: MusicMetadata[];
  track?: MusicMetadata | null;  // Keep for backward compatibility
  onTrackChange: (tracks: MusicMetadata[]) => void;
  onSave: (tracks: MusicMetadata[]) => void;
}

export function EditTrackDialog({
  isOpen,
  onOpenChange,
  tracks: propTracks,
  track: singleTrack, // For backward compatibility
  onTrackChange,
  onSave,
}: EditTrackDialogProps) {
  const { 
    triggerRefresh, 
    updateTrackMetadata, 
    customMetadata,
    currentTrack,
    setCurrentTrack,
  } = usePlayerStore();

  // Convert single track to array if needed
  const tracks = useMemo(() => {
    if (propTracks) return propTracks;
    if (singleTrack) return [singleTrack];
    return [];
  }, [propTracks, singleTrack]);

  interface EditedValues extends Partial<MusicMetadata> {
    genreInput?: string;
  }

  // Track the edited values separately from the original tracks
  const [editedValues, setEditedValues] = useState<EditedValues>({});
  
  const { register, setValue } = useForm();
  const isMultipleEdit = tracks.length > 1;

  // Get common values across tracks, considering edited values
  const commonValues = useMemo(() => {
    return tracks.reduce((acc, track) => {
      Object.entries(track).forEach(([key, value]) => {
        // If we have an edited value, use that instead
        const effectiveValue = editedValues[key as keyof MusicMetadata] ?? value;
        
        if (acc[key as keyof MusicMetadata] === undefined) {
          acc[key as keyof MusicMetadata] = effectiveValue;
        } else if (acc[key as keyof MusicMetadata] !== effectiveValue) {
          acc[key as keyof MusicMetadata] = null; // null indicates different values
        }
      });
      return acc;
    }, {} as Partial<Record<keyof MusicMetadata, any>>);
  }, [tracks, editedValues]);

  // Initialize custom metadata values at component level
  useEffect(() => {
    if (!isMultipleEdit) {
      customMetadata.fields.forEach((field) => {
        const customKey = asCustomKey(field.id);
        const value = tracks[0]?.customMetadata?.[customKey];
        if (value) {
          setValue(customKey, value);
        }
      });
    }
  }, [customMetadata.fields, setValue, tracks, isMultipleEdit]);

  const handleTrackChange = (changes: Partial<MusicMetadata>) => {
    if (tracks.length === 0) return;
    
    setEditedValues(prev => ({
      ...prev,
      ...changes
    }));

    // Update all tracks in the store immediately
    tracks.forEach(track => {
      const updatedTrack = {
        ...track,
        ...editedValues,
        ...changes
      };
      updateTrackMetadata(track.id, changes);
    });

    // Update parent with the changes
    const updatedTracks = tracks.map(track => ({
      ...track,
      ...editedValues,
      ...changes,
    }));
    onTrackChange(updatedTracks);
  };

  // Reset edited values when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setEditedValues({});
    } else if (tracks.length > 0) {
      // Initialize genreInput with the current genre string when dialog opens
      const currentGenres = tracks[0].genre;
      if (currentGenres) {
        setEditedValues(prev => ({
          ...prev,
          genreInput: currentGenres.join(", ")
        }));
      }
    }
  }, [isOpen, tracks]);

  const handleSave = async () => {
    if (tracks.length === 0) return;
    
    try {
      // Apply edited values to all tracks
      const updatedTracks = tracks.map(track => ({
        ...track,
        ...editedValues, // Apply all edited values
      }));

      console.log('Saving tracks with edited values:', {
        editedValues,
        updatedTracks
      }); // Debug log

      onSave(updatedTracks);
      onOpenChange(false);
      setEditedValues({}); // Reset edited values
    } catch (error) {
      console.error('Error saving metadata:', error);
    }
  };

  if (tracks.length === 0) return null;

  const track = tracks[0]; // Use first track for single edit mode

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="flex flex-row items-center justify-between flex-wrap">
          <DialogTitle>
            {isMultipleEdit ? `Edit ${tracks.length} Tracks` : 'Edit Track Metadata'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground ml-4 truncate">
            {isMultipleEdit ? `${tracks.length} tracks selected` : (track.title || 'Untitled Track')}
          </DialogDescription>
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
                        setEditedValues(prev => ({
                          ...prev,
                          genreInput: e.target.value,
                          // Keep the previous genre array until blur
                          genre: prev.genre
                        }));
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
                          bpm: Number(e.target.value),
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
            </TabsContent>

            <TabsContent value="custom" className="mt-0 border-0">
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
                        value={value?.toString() ?? ""}
                        onChange={(e) => handleTrackChange({
                          customMetadata: {
                            ...tracks[0].customMetadata,
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
