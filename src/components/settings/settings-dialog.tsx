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
import { useState } from "react";
import { usePlayerStore } from "@/lib/store";
import { ConfirmButton } from "../ui/confirm-button";

export function SettingsDialog() {
  const { showPreListenButtons, setShowPreListenButtons } = useSettings();
  const [permissionStatus, setPermissionStatus] = useState<
    "prompt" | "granted" | "denied"
  >("prompt");
  const selectedFolderNames = usePlayerStore(
    (state) => state.selectedFolderNames
  );
  const removeFolder = usePlayerStore((state) => state.removeFolder);
  const [showFolderList, setShowFolderList] = useState(false);

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
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Music Library</h3>
            <div className="flex gap-4">
              <FileUpload />
              {selectedFolderNames.length > 0 && (
                <div className="flex flex-col gap-2">
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
                </div>
              )}
            </div>
            {showFolderList && (
              <div className="flex flex-col gap-2 pl-4">
                {selectedFolderNames.map((folder) => (
                  <div
                    key={folder}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm truncate">{folder}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeFolder(folder)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <ConfirmButton
              variant="ghost"
              className="flex items-center gap-2 w-fit"
              onClick={() => usePlayerStore.getState().removeRemovedSongs()}
            >
              <Music className="h-4 w-4" />
              Remove all removed songs
            </ConfirmButton>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Appearance</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm">Theme:</span>
              <ThemeToggle />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Playback Settings</h3>
            <label className="cursor-pointer text-sm">
              <div className="flex items-center justify-between w-full">
                <span>Use Pre-listen</span>
                <Switch
                  checked={showPreListenButtons}
                  onCheckedChange={handlePreListenChange}
                />
              </div>
              {!showPreListenButtons && (
                <p className="text-sm text-muted-foreground pt-2">
                  Preview tracks in the song list while the main track plays.
                  For best results, use external sound card to separate the
                  outputs.
                </p>
              )}
              {permissionStatus === "denied" && (
                <span className="text-destructive">
                  {" "}
                  Microphone access was denied. Please enable it in your browser
                  settings to use this feature.
                </span>
              )}
            </label>
          </div>
          {showPreListenButtons && <AudioDeviceSelector />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
