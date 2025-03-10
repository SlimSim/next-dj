import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlayerStore } from "@/lib/store";
import { MusicMetadata } from "@/lib/types/types";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { BasicInfoTab } from "./edit-track-tabs/basic-info-tab";
import { CustomTagsTab } from "./edit-track-tabs/custom-tags-tab";
import { AdvancedTab } from "./edit-track-tabs/advanced-tab";
import { asCustomKey } from "@/lib/utils/metadata";


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
              <BasicInfoTab
                track={track}
                tracks={tracks}
                isMultipleEdit={isMultipleEdit}
                editedValues={editedValues}
                handleTrackChange={handleTrackChange}
                commonValues={commonValues}
              />
            </TabsContent>
            <TabsContent value="custom" className="mt-0 border-0">
              <CustomTagsTab
                track={track}
                tracks={tracks}
                isMultipleEdit={isMultipleEdit}
                editedValues={editedValues}
                handleTrackChange={handleTrackChange}
                register={register}
                setValue={setValue}
              />
            </TabsContent>
            <TabsContent value="details" className="mt-0 border-0">
              <AdvancedTab
                track={track}
                tracks={tracks}
                isMultipleEdit={isMultipleEdit}
                editedValues={editedValues}
                handleTrackChange={handleTrackChange}
                commonValues={commonValues}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button type="submit" onClick={handleSave}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
