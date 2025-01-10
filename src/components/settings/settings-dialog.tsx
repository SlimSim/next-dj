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
import { Switch } from "../ui/switch";
import { useSettings } from "./settings-context";
import { useCallback, useEffect, useState } from "react";
import { usePlayerStore } from "@/lib/store";
import { ConfirmButton } from "../ui/confirm-button";
import { getRemovedSongs } from "@/db/audio-operations";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export function SettingsDialog() {
  const {
    showPreListenButtons,
    setShowPreListenButtons,
    recentPlayHours,
    setRecentPlayHours,
    monthlyPlayDays,
    setMonthlyPlayDays,
  } = useSettings();
  const [permissionStatus, setPermissionStatus] = useState<
    "prompt" | "granted" | "denied"
  >("prompt");
  const selectedFolderNames = usePlayerStore(
    (state) => state.selectedFolderNames
  );
  const removeFolder = usePlayerStore((state) => state.removeFolder);
  const [showFolderList, setShowFolderList] = useState(false);
  const [hasRemovedSongs, setHasRemovedSongs] = useState(false);

  const checkForRemovedSongs = useCallback(async () => {
    const removedSongs = await getRemovedSongs();
    setHasRemovedSongs(removedSongs.length > 0);
  }, []);

  useEffect(() => {
    checkForRemovedSongs();
  }, [checkForRemovedSongs]);

  const handlePreListenChange = async (checked: boolean) => {
    if (checked) {
      try {
        // Request microphone permission
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        // Stop the stream immediately as we don't need it
        stream.getTracks().forEach((track) => track.stop());

        setPermissionStatus("granted");
        setShowPreListenButtons(true);
      } catch (error) {
        console.error("Error accessing audio devices:", error);
        setPermissionStatus("denied");
        setShowPreListenButtons(false);
      }
    } else {
      setShowPreListenButtons(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
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
                      usePlayerStore.getState().removeRemovedSongs();
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
              <label className="cursor-pointer text-sm">
                <div className="flex items-center justify-between w-full">
                  <span>Enable Pre-listen</span>
                  <Switch
                    checked={showPreListenButtons}
                    onCheckedChange={handlePreListenChange}
                  />
                </div>
              </label>
              {showPreListenButtons && (
                <div className="pl-4 space-y-4">
                  <AudioDeviceSelector />
                </div>
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
                          Only counts plays within the last X hours (default:
                          18)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className="flex items-center gap-2">
                    <Input
                      id="recentPlayHours"
                      type="number"
                      min="0"
                      value={recentPlayHours}
                      onChange={(e) => {
                        let val = parseFloat(e.target.value);
                        setRecentPlayHours(typeof val === "number" ? val : 18);
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
                          Set the time window for the second play counter.{" "}
                          <br />
                          Only counts plays within the last X days (default: 42)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className="flex items-center gap-2">
                    <Input
                      id="monthlyPlayDays"
                      type="number"
                      min="0"
                      value={monthlyPlayDays}
                      onChange={(e) => {
                        let val = parseFloat(e.target.value);
                        setMonthlyPlayDays(typeof val === "number" ? val : 42);
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
