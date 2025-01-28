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
import { PencilIcon, TrashIcon, GripVertical } from "lucide-react";
import { ConfirmButton } from "../ui/confirm-button";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

interface SortableFieldProps {
  id: string;
  name: string;
  showInFilter: boolean;
  showInList: boolean;
  showInSearch: boolean;
  isEditing?: boolean;
  editingName?: string;
  onEditStart?: () => void;
  onEditChange?: (value: string) => void;
  onEditSubmit?: () => void;
  onEditCancel?: () => void;
  toggleFilter: (fieldId: string) => void;
  toggleVisibility: (fieldId: string) => void;
  toggleSearch: (fieldId: string) => void;
  removeField?: (fieldId: string) => void;
}

function SortableField({
  id,
  name,
  showInFilter,
  showInList,
  showInSearch,
  isEditing,
  editingName,
  onEditStart,
  onEditChange,
  onEditSubmit,
  onEditCancel,
  toggleFilter,
  toggleVisibility,
  toggleSearch,
  removeField,
}: SortableFieldProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col sm:flex-row sm:items-center sm:grid sm:grid-cols-[1fr_60px_60px_60px] gap-2 sm:gap-4 rounded-lg border p-2 ${
        isDragging ? 'bg-accent' : ''
      }`}
    >
      {/* Main row - always visible */}
      <div className="flex items-center gap-2 w-full">
        <button
          className="cursor-grab hover:text-accent-foreground/50 active:cursor-grabbing shrink-0"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {isEditing ? (
          <Input
            className="h-8 flex-1"
            value={editingName}
            onChange={(e) => onEditChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onEditSubmit?.();
              } else if (e.key === 'Escape') {
                onEditCancel?.();
              }
            }}
            onBlur={onEditSubmit}
            autoFocus
          />
        ) : (
          <>
            {/* Desktop view */}
            <div className="hidden sm:flex items-center gap-2 flex-1">
              <span className="text-sm font-medium">{name}</span>
              {onEditStart && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={onEditStart}
                >
                  <PencilIcon className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Mobile view with larger click area */}
            <button
              className="sm:hidden flex items-center justify-between flex-1 hover:bg-accent/50 rounded-md transition-colors"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <span className="text-sm font-medium px-2">{name}</span>
              <div className="p-2">
                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>
          </>
        )}
        {/* Show delete button before toggles only when editing */}
        {removeField && (
            <ConfirmButton
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive"
              onClick={() => removeField(id)}
            >
              <TrashIcon className="h-3 w-3" />
              <span className="sr-only">Remove field</span>
            </ConfirmButton>
          )}
      </div>

      {/* Desktop controls */}

      <div className="hidden sm:flex sm:justify-center items-center">
        <Switch
          checked={showInList}
          onCheckedChange={() => toggleVisibility(id)}
        />
      </div>

      <div className="hidden sm:flex sm:justify-center items-center">
        <Switch
          checked={showInFilter}
          onCheckedChange={() => toggleFilter(id)}
        />
      </div>

      <div className="hidden sm:flex sm:justify-center items-center">
        <Switch
          checked={showInSearch}
          onCheckedChange={() => toggleSearch(id)}
        />
      </div>

      {/* Mobile controls - collapsible */}
      <div className={`sm:hidden space-y-3 ${isExpanded ? 'block' : 'hidden'}`}>
        <div className="flex items-center justify-between border-t pt-2">
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Show in List</Label>
              <Switch
                checked={showInList}
                onCheckedChange={() => toggleVisibility(id)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Show in Filter</Label>
              <Switch
                checked={showInFilter}
                onCheckedChange={() => toggleFilter(id)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Show in Search</Label>
              <Switch
                checked={showInSearch}
                onCheckedChange={() => toggleSearch(id)}
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 border-t pt-2">
          {onEditStart && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onEditStart}
            >
              <PencilIcon className="h-3 w-3 mr-2" />
              Rename
            </Button>
          )}
          {removeField && (
            <ConfirmButton
              variant="outline"
              size="sm"
              className="flex-1 text-destructive"
              onClick={() => removeField(id)}
            >
              <TrashIcon className="h-3 w-3 mr-2" />
              Remove
            </ConfirmButton>
          )}
        </div>
      </div>
    </div>
  );
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
  const toggleCustomMetadataSearch = usePlayerStore((state) => state.toggleCustomMetadataSearch);
  const reorderCustomMetadataFields = usePlayerStore((state) => state.reorderCustomMetadataFields);

  const standardMetadataFields = usePlayerStore((state) => state.standardMetadataFields);
  const toggleStandardMetadataFilter = usePlayerStore((state) => state.toggleStandardMetadataFilter);
  const toggleStandardMetadataVisibility = usePlayerStore((state) => state.toggleStandardMetadataVisibility);
  const toggleStandardMetadataSearch = usePlayerStore((state) => state.toggleStandardMetadataSearch);
  const reorderStandardMetadataFields = usePlayerStore((state) => state.reorderStandardMetadataFields);

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
      showInSearch: true,
    });
    setNewFieldName('');
  };

  const removeCustomMetadataField = (id: string) => {
    removeField(id);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = customMetadata.fields.findIndex(
        (field) => field.id === active.id
      );
      const newIndex = customMetadata.fields.findIndex(
        (field) => field.id === over?.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderCustomMetadataFields(oldIndex, newIndex);
      }
    }
  };

  const handleStandardDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = standardMetadataFields.findIndex(
        (field) => field.id === active.id
      );
      const newIndex = standardMetadataFields.findIndex(
        (field) => field.id === over?.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderStandardMetadataFields(oldIndex, newIndex);
      }
    }
  };

  return (
    <div>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
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

        <TabsContent value="metadata" className="space-y-6">
          <div className="flex flex-col gap-4">
            {/* Header - Only visible on larger screens */}
            <div className="hidden sm:grid sm:grid-cols-[1fr_60px_60px_60px] gap-4 items-center px-2">
              <div className="font-medium">Field</div>
              <div className="text-center font-medium">List</div>
              <div className="text-center font-medium">Filter</div>
              <div className="text-center font-medium">Search</div>
            </div>

            {/* Standard Metadata Fields */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Standard Metadata Fields</h4>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleStandardDragEnd}
              >
                <SortableContext
                  items={standardMetadataFields.map(field => field.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {standardMetadataFields.map((field) => (
                      <SortableField
                        key={field.id}
                        id={field.id}
                        name={field.name}
                        showInFilter={field.showInFilter}
                        showInList={field.showInList}
                        showInSearch={field.showInSearch}
                        toggleFilter={() => toggleStandardMetadataFilter(field.id)}
                        toggleVisibility={() => toggleStandardMetadataVisibility(field.id)}
                        toggleSearch={() => toggleStandardMetadataSearch(field.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            {/* Custom Metadata Fields */}
            <div className="space-y-4">
              <div className="flex items-center flex-wrap justify-between">
                <h4 className="text-sm font-medium pb-2 pr-2">Custom Metadata Fields</h4>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="New field name"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    className="h-8 w-[200px]"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddCustomField}
                    disabled={!newFieldName.trim()}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={customMetadata.fields.map(field => field.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {customMetadata.fields.map((field) => (
                      <SortableField
                        key={field.id}
                        id={field.id}
                        name={field.name}
                        showInFilter={field.showInFilter}
                        showInList={field.showInList}
                        showInSearch={field.showInSearch}
                        isEditing={editingFieldId === field.id}
                        editingName={editingName}
                        onEditStart={() => {
                          setEditingFieldId(field.id);
                          setEditingName(field.name);
                        }}
                        onEditChange={setEditingName}
                        onEditSubmit={() => {
                          if (editingName.trim() && editingName !== field.name) {
                            renameCustomMetadataField(field.id, editingName.trim());
                          }
                          setEditingFieldId(null);
                          setEditingName("");
                        }}
                        onEditCancel={() => {
                          setEditingFieldId(null);
                          setEditingName("");
                        }}
                        toggleFilter={() => toggleCustomMetadataFilter(field.id)}
                        toggleVisibility={() => toggleCustomMetadataVisibility(field.id)}
                        toggleSearch={() => toggleCustomMetadataSearch(field.id)}
                        removeField={removeCustomMetadataField}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function SettingsDialog({
  triggerButton = true,
  open,
  onOpenChange,
}: {
  triggerButton?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [hasRemovedSongs, setHasRemovedSongs] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {triggerButton && (
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <SettingsIcon className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-6 -mr-6">
          <SettingsContent
            hasRemovedSongs={hasRemovedSongs}
            setHasRemovedSongs={setHasRemovedSongs}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
