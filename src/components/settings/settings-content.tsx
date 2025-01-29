"use client";

import { DialogHeader, DialogTitle } from "../ui/dialog";
import { ChevronDown, ChevronUp, Folder, X, Music, Music2 } from "lucide-react";
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
import { Button } from "../ui/button";

interface SettingsContentProps {
  hasRemovedSongs: boolean;
  setHasRemovedSongs: (hasRemovedSongs: boolean) => void;
}

export function SettingsContent({
  hasRemovedSongs,
  setHasRemovedSongs,
}: SettingsContentProps) {
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
  const refreshTrigger = usePlayerStore((state) => state.refreshTrigger);

  const checkForRemovedSongs = useCallback(async () => {
    console.log("SettingsContent: Checking for removed songs...");
    const removedSongs = await getRemovedSongs();
    console.log("SettingsContent: Found removed songs:", removedSongs.length > 0 ? removedSongs : "none");
    setHasRemovedSongs(removedSongs.length > 0);
  }, [setHasRemovedSongs]);

  useEffect(() => {
    console.log("SettingsContent: Effect triggered, checking for removed songs");
    checkForRemovedSongs();
  }, [checkForRemovedSongs, refreshTrigger]);

  useEffect(() => {
    console.log("SettingsContent: hasRemovedSongs changed to:", hasRemovedSongs);
  }, [hasRemovedSongs]);

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
    <>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="audio">Audio</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base">Theme</h3>
                <p className="text-[0.8rem] text-muted-foreground">
                  Choose between light and dark theme
                </p>
              </div>
              <ThemeToggle />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base">Music folders</h3>
                <p className="text-[0.8rem] text-muted-foreground">
                  Add folders containing your music files
                </p>
              </div>
              <div className="flex items-center gap-2">
                <FileUpload />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFolderList(!showFolderList)}
                >
                  {showFolderList ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            {showFolderList && (
              <div className="space-y-2">
                {selectedFolderNames.map((folderName) => (
                  <div
                    key={folderName}
                    className="flex items-center justify-between rounded-md border p-2"
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      <span className="text-sm">{folderName}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeFolder(folderName)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base">Recent plays</h3>
                <p className="text-[0.8rem] text-muted-foreground">
                  Show number of plays in the last X hours
                </p>
              </div>
              <Input
                type="number"
                value={recentPlayHours}
                onChange={(e) => setRecentPlayHours(Number(e.target.value))}
                className="w-20"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base">Monthly plays</h3>
                <p className="text-[0.8rem] text-muted-foreground">
                  Show number of plays in the last X days
                </p>
              </div>
              <Input
                type="number"
                value={monthlyPlayDays}
                onChange={(e) => setMonthlyPlayDays(Number(e.target.value))}
                className="w-20"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base">Clean up</h3>
                <p className="text-[0.8rem] text-muted-foreground">
                  Remove songs that no longer exist from the database
                </p>
              </div>
              <ConfirmButton
                variant="destructive"
                size="sm"
                disabled={!hasRemovedSongs}
                onClick={() => {
                  usePlayerStore.getState().removeRemovedSongs();
                  checkForRemovedSongs();
                }}
              >
                <div className="flex items-center gap-2">
                  <Music2 className="h-4 w-4" />
                  Clean up
                </div>
              </ConfirmButton>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="audio" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base">Pre-listen</h3>
                <p className="text-[0.8rem] text-muted-foreground">
                  Enable pre-listen buttons in song list
                </p>
              </div>
              <Switch
                checked={showPreListenButtons}
                onCheckedChange={handlePreListenChange}
              />
            </div>
            {showPreListenButtons && (
              <div className="space-y-4">
                <div className="space-y-0.5">
                  <h3 className="text-base">Audio devices</h3>
                  <p className="text-[0.8rem] text-muted-foreground">
                    Select audio devices for main output and pre-listen
                  </p>
                </div>
                <div className="space-y-2">
                  <AudioDeviceSelector />
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
