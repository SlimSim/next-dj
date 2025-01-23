"use client";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Settings,
  ChevronDown,
  ChevronUp,
  Folder,
  X,
  Music,
  Music2,
} from "lucide-react";
import { FileUpload } from "../common/file-upload";
import { ThemeToggle } from "../common/theme-toggle";
import { AudioDeviceSelector } from "../player/audio-device-selector";
import { useSettings } from "./settings-context";
import { useCallback, useEffect, useState } from "react";
import { usePlayerStore } from "@/lib/store";
import { ConfirmButton } from "../ui/confirm-button";
import { getRemovedSongs } from "@/db/audio-operations";
import { Input } from "../ui/input";
import { InputWithDefault } from "../ui/input-with-default";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Cross2Icon } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';

interface SettingsContentProps {
  hasRemovedSongs: boolean;
  setHasRemovedSongs: (hasRemovedSongs: boolean) => void;
}

interface CustomMetadataField {
  id: string;
  name: string;
  type: 'text';
}

interface CustomMetadata {
  fields: CustomMetadataField[];
}

const initialCustomMetadata: CustomMetadata = {
  fields: [],
};

export function SettingsContent({
  hasRemovedSongs,
  setHasRemovedSongs,
}: SettingsContentProps) {
  const {
    selectedFolderNames,
    removeFolder,
    clearSelectedFolders,
    removeRemovedSongs,
    addCustomMetadataField,
    removeCustomMetadataField: removeField,
    customMetadata,
  } = usePlayerStore();
  const [newFieldName, setNewFieldName] = useState("");

  const recentPlayHours = useSettings((state) => state.recentPlayHours);
  const setRecentPlayHours = useSettings((state) => state.setRecentPlayHours);
  const monthlyPlayDays = useSettings((state) => state.monthlyPlayDays);
  const setMonthlyPlayDays = useSettings((state) => state.setMonthlyPlayDays);

  const [showFolderList, setShowFolderList] = useState(false);
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const triggerRefresh = usePlayerStore((state) => state.triggerRefresh);

  const checkForRemovedSongs = useCallback(async () => {
    const removedSongs = await getRemovedSongs();
    setHasRemovedSongs(removedSongs.length > 0);
  }, [setHasRemovedSongs]);

  useEffect(() => {
    checkForRemovedSongs();
  }, [checkForRemovedSongs]);

  useEffect(() => {
    const checkAudioPermission = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputDevices = devices.filter(
          (device) => device.kind === "audiooutput"
        );
        // If we can see device labels, we have permission
        const hasAccess = audioOutputDevices.some(
          (device) => device.label !== ""
        );
        setHasAudioPermission(hasAccess);

        // Listen for device changes
        navigator.mediaDevices.addEventListener("devicechange", async () => {
          const updatedDevices =
            await navigator.mediaDevices.enumerateDevices();
          const updatedOutputDevices = updatedDevices.filter(
            (device) => device.kind === "audiooutput"
          );
          const hasUpdatedAccess = updatedOutputDevices.some(
            (device) => device.label !== ""
          );
          setHasAudioPermission(hasUpdatedAccess);
        });
      } catch (error) {
        setHasAudioPermission(false);
      }
    };

    checkAudioPermission();
  }, []);

  const handleAddCustomField = () => {
    const name = newFieldName.trim();
    if (!name) return;
    
    const newField = {
      id: uuidv4(),
      name,
      type: 'text' as const,
    };
    
    addCustomMetadataField(newField);
    setNewFieldName("");
  };

  const removeCustomMetadataField = (id: string) => {
    removeField(id);
  };

  return (
    <div>
      <DialogHeader>
        <DialogTitle>Settings</DialogTitle>
      </DialogHeader>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="customTags">Custom Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Music Library</h3>
            <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
              <FileUpload />
              {selectedFolderNames.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowFolderList(!showFolderList)}
                  className="flex items-center gap-2"
                >
                  <Folder className="h-4 w-4" />
                  Manage Folders
                  {showFolderList ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            {showFolderList && (
              <div className="pl-2">
                {selectedFolderNames.map((folderName) => (
                  <div
                    key={folderName}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm">{folderName}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFolder(folderName)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {hasRemovedSongs && (
              <div className="flex items-center gap-2">
                <Music2 className="h-4 w-4 " />
                <span className="text-sm ">
                  Some songs were removed from your library
                </span>
                <ConfirmButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    removeRemovedSongs();
                    checkForRemovedSongs();
                  }}
                >
                  Clean up
                </ConfirmButton>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Appearance</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm">Theme</span>
              <ThemeToggle />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Playback Settings</h3>
            {!hasAudioPermission ? (
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    // First request audio permission
                    const stream = await navigator.mediaDevices.getUserMedia({
                      audio: true,
                    });
                    // Stop the stream immediately as we don't need it
                    stream.getTracks().forEach((track) => track.stop());

                    // Now enumerate devices
                    const devices =
                      await navigator.mediaDevices.enumerateDevices();

                    const audioOutputDevices = devices.filter(
                      (device) => device.kind === "audiooutput"
                    );

                    // This will now work because we have permission
                    const hasAccess = audioOutputDevices.some(
                      (device) => device.label !== ""
                    );
                    setHasAudioPermission(hasAccess);
                  } catch (error) {
                    console.error("Error accessing audio devices:", error);
                  }
                }}
              >
                Activate Audio Output
              </Button>
            ) : (
              <AudioDeviceSelector />
            )}
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Play counter cutoff</h3>
            <p className="text-sm text-muted-foreground">
              Set the time window for the first 2 play counters at the left of
              the song name in the songlist
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center sm:items-start flex-row sm:flex-col gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <label className="flex-grow" htmlFor="recentPlayHours">
                        First counter:
                      </label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs text-muted-foreground">
                        Set the time window for the first play counter. <br />
                        Only counts plays within the last X hours (default: 18)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="flex items-center gap-2">
                  <InputWithDefault
                    id="recentPlayHours"
                    type="number"
                    min="0"
                    value={recentPlayHours || ""}
                    defaultValue={18}
                    onValueChange={(val) => {
                      const numVal = val === "" ? 0 : Number(val);
                      setRecentPlayHours(numVal);
                    }}
                    className="w-24"
                  />
                  <span className="text-xs text-muted-foreground w-8">
                    hours
                  </span>
                </div>
              </div>
              <div className="flex items-center sm:items-start flex-row sm:flex-col gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <label className="flex-grow" htmlFor="monthlyPlayDays">
                        Second counter:
                      </label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs text-muted-foreground">
                        Set the time window for the second play counter. <br />
                        Only counts plays within the last X days (default: 42)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="flex items-center gap-2">
                  <InputWithDefault
                    id="monthlyPlayDays"
                    type="number"
                    min="0"
                    value={monthlyPlayDays || ""}
                    defaultValue={42}
                    onValueChange={(val) => {
                      const numVal = val === "" ? 0 : Number(val);
                      setMonthlyPlayDays(numVal);
                    }}
                    className="w-24"
                  />
                  <span className="text-xs text-muted-foreground w-8">
                    days
                  </span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="customTags" className="space-y-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Add Custom metadata to songs</h3>
            <p className="text-sm text-muted-foreground">
              Add custom tags to organize your music library. These tags can be used to filter and sort your tracks.
              For example, add tags like "Vocals", "Energy Level", or "Set Time" to better organize your DJ sets.
            </p>
            <div className="flex flex-col gap-4">
              {/* Existing Custom Fields */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Existing Custom Fields</h4>
                <div className="grid gap-2">
                  {customMetadata.fields.map((field) => (
                    <div key={field.id} className="flex items-center justify-between gap-2 p-2 rounded-md border">
                      <span className="text-sm">{field.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeField(field.id)}
                        className="h-8 px-2"
                      >
                        {/* <Cross2Icon className="h-4 w-4" /> */}
                        X
                        <span className="sr-only">Remove {field.name}</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Field */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Add New Field</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="New field name"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomField();
                      }
                    }}
                  />
                  <Button
                    onClick={handleAddCustomField}
                    disabled={!newFieldName.trim()}
                  >
                    Add Field
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
// import { Settings } from "lucide-react";
// import { SettingsContent } from "./settings-content";
// import { Button } from "../ui/button";
// import { useState } from "react";
// import { getRemovedSongs } from "@/db/audio-operations";
// import { usePlayerStore } from "@/lib/store";

interface SettingsDialogProps {
  triggerButton?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SettingsDialog({
  triggerButton = true,
  open,
  onOpenChange,
}: SettingsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [hasRemovedSongs, setHasRemovedSongs] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const handleOpenChange = isControlled ? onOpenChange : setInternalOpen;
  const triggerRefresh = usePlayerStore((state) => state.triggerRefresh);

  const handleOpen = async (open: boolean) => {
    if (open) {
      // Check for removed songs when dialog opens
      console.log("Dialog opening, checking for removed songs");
      const removedSongs = await getRemovedSongs();
      console.log("Found removed songs when opening dialog:", removedSongs);
      setHasRemovedSongs(removedSongs.length > 0);
      if (removedSongs.length > 0) {
        triggerRefresh();
      }
    }
    handleOpenChange?.(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      {triggerButton && (
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <SettingsContent
          hasRemovedSongs={hasRemovedSongs}
          setHasRemovedSongs={setHasRemovedSongs}
        />
      </DialogContent>
    </Dialog>
  );
}
