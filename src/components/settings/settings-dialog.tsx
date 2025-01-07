"use client";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Play, Settings } from "lucide-react";
import { FileUpload } from "../common/file-upload";
import { ThemeToggle } from "../common/theme-toggle";
import { AudioDeviceSelector } from "../player/audio-device-selector";
import { Switch } from "../ui/switch";
import { useSettings } from "./settings-context";
import { Label } from "@radix-ui/react-select";
// import { Label } from '../ui/label'

export function SettingsDialog() {
  const { showPreListenButtons, setShowPreListenButtons } = useSettings();

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
            <FileUpload />
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
            <label className="cursor-pointer flex items-center justify-between w-full text-sm">
              <span>Show Pre-listen</span>
              <Switch
                checked={showPreListenButtons}
                onCheckedChange={setShowPreListenButtons}
              />
            </label>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Audio Settings</h3>
            <AudioDeviceSelector />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
