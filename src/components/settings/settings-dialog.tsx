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
  SettingsIcon,
  ChevronDown,
  ChevronUp,
  Folder,
  X,
  Music,
  Music2,
  PlusIcon,
  Trash,
  MoreVertical,
} from "lucide-react";
import { FileUpload } from "../common/file-upload";
import { ThemeToggle } from "../common/theme-toggle";
import { AudioDeviceSelector } from "../player/audio-device-selector";
import { useSettings } from "@/lib/settings";
import { usePlayerStore } from "@/lib/store";
import type { Settings } from "@/lib/types/settings";
import type { CustomMetadataField } from "@/lib/types/customMetadata";
import { useCallback, useEffect, useState } from "react";
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
import { CrossIcon } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { PencilIcon, TrashIcon } from "lucide-react";

interface CustomField {
  id: string;
  name: string;
  type: 'text';
}

interface CustomMetadata {
  fields: CustomField[];
}

const initialCustomMetadata: CustomMetadata = {
  fields: [],
};

interface SettingsContentProps {
  hasRemovedSongs: boolean;
  setHasRemovedSongs: (value: boolean) => void;
}

export function SettingsContent({
  hasRemovedSongs,
  setHasRemovedSongs,
}: SettingsContentProps) {
  const {
    selectedFolderNames,
    removeFolder,
    clearSelectedFolders,
    removeRemovedSongs,
  } = usePlayerStore();

  const customMetadata = usePlayerStore((state) => state.customMetadata);
  const addCustomMetadataField = usePlayerStore((state) => state.addCustomMetadataField);
  const removeField = usePlayerStore((state) => state.removeCustomMetadataField);
  const renameCustomMetadataField = usePlayerStore((state) => state.renameCustomMetadataField);
  const toggleCustomMetadataFilter = usePlayerStore((state) => state.toggleCustomMetadataFilter);
  const toggleCustomMetadataVisibility = usePlayerStore((state) => state.toggleCustomMetadataVisibility);

  const recentPlayHours = useSettings((state) => state.recentPlayHours);
  const setRecentPlayHours = useSettings((state) => state.setRecentPlayHours);
  const monthlyPlayDays = useSettings((state) => state.monthlyPlayDays);
  const setMonthlyPlayDays = useSettings((state) => state.setMonthlyPlayDays);

  const [newFieldName, setNewFieldName] = useState("");
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

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
    if (!newFieldName.trim()) return;
    const name = newFieldName.trim();
    addCustomMetadataField({
      id: uuidv4(),
      name,
      type: 'text',
      showInFilter: true,
      showInList: true,
    });
    setNewFieldName('');
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    removeRemovedSongs();
                    checkForRemovedSongs();
                  }}
                >
                  Clean up
                </Button>
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
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <label className="text-sm" htmlFor="recentPlayHours">Recent Play Hours</label>
                <Input
                  type="number"
                  id="recentPlayHours"
                  value={recentPlayHours.toString()}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (!isNaN(value)) {
                      setRecentPlayHours(value);
                    }
                  }}
                  min={1}
                  max={168}
                />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <label className="text-sm" htmlFor="monthlyPlayDays">Monthly Play Days</label>
                <Input
                  type="number"
                  id="monthlyPlayDays"
                  value={monthlyPlayDays.toString()}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (!isNaN(value)) {
                      setMonthlyPlayDays(value);
                    }
                  }}
                  min={1}
                  max={31}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="customTags" className="space-y-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Add Custom Tags to Songs</h3>
            <p className="text-sm text-muted-foreground">
              Add custom tags to organize your music library. These tags can be used to filter and sort your tracks.
              For example, add tags like "Vocals" or "Energy Level" to better organize your DJ sets.
            </p>
            <div className="flex flex-col gap-4">
              {/* Existing Custom Fields */}
              <div className="space-y-4">
                
                <div className="space-y-2">
                  {customMetadata.fields.map((field) => (
                    <div
                      key={field.id}
                      className="flex items-center justify-between space-x-2 rounded-lg border p-2"
                    >
                      {editingFieldId === field.id ? (
                        <Input
                          className="h-8 w-48"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              renameCustomMetadataField(field.id, editingName);
                              setEditingFieldId(null);
                            } else if (e.key === 'Escape') {
                              setEditingFieldId(null);
                            }
                          }}
                          onBlur={() => {
                            if (editingName.trim()) {
                              renameCustomMetadataField(field.id, editingName);
                            }
                            setEditingFieldId(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{field.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              setEditingFieldId(field.id);
                              setEditingName(field.name);
                            }}
                          >
                            <PencilIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={field.showInFilter}
                            onCheckedChange={() =>
                              toggleCustomMetadataFilter(field.id)
                            }
                          />
                          <Label className="text-xs">Filter</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={field.showInList}
                            onCheckedChange={() =>
                              toggleCustomMetadataVisibility(field.id)
                            }
                          />
                          <Label className="text-xs">List</Label>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => removeCustomMetadataField(field.id)}
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Field */}
              <div className="space-y-2">
              <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const id = uuidv4();
                      addCustomMetadataField({
                        id,
                        name: "New Field",
                        type: "text",
                        showInFilter: true,
                        showInList: true,
                      });
                      setEditingFieldId(id); // Start editing the new field
                    }}
                  >
                    Add Custom Tag
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
            <SettingsIcon className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Settings</span>
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
