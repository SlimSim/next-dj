"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronUp, Folder, Music2, X } from "lucide-react";
import { FileUpload } from "@/components/common/file-upload";
import { AudioDeviceSelector } from "@/components/player/audio-device-selector";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { usePlayerStore } from "@/lib/store";

interface GeneralTabProps {
  hasRemovedSongs: boolean;
  selectedFolderNames: string[];
  showFolderList: boolean;
  setShowFolderList: (show: boolean) => void;
  removeFolder: (folderName: string) => void;
  removeRemovedSongs: () => void;
  checkForRemovedSongs: () => void;
  practiceMode: boolean;
  setPracticeMode: (enabled: boolean) => void;
  hasAudioPermission: boolean;
  setHasAudioPermission: (hasPermission: boolean) => void;
}

export function GeneralTab({ 
  hasRemovedSongs,
  selectedFolderNames,
  showFolderList,
  setShowFolderList,
  removeFolder,
  removeRemovedSongs,
  checkForRemovedSongs,
  practiceMode,
  setPracticeMode,
  hasAudioPermission,
  setHasAudioPermission
}: GeneralTabProps) {
  const { showPreListenButtons, setShowPreListenButtons } = usePlayerStore();

  return (
    <div className="space-y-4">
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
        <div className="flex items-center justify-between">
          <span className="text-sm"></span>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm">Practice Mode</span>
              <p className="text-xs text-muted-foreground">Keep play controls visible for song preparation and analysis</p>
            </div>
            <Switch
              checked={practiceMode}
              onCheckedChange={setPracticeMode}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Playback Settings</h3>
        {!hasAudioPermission ? (
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const stream = await navigator.mediaDevices.getUserMedia({
                  audio: true,
                });
                stream.getTracks().forEach((track) => track.stop());
                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioOutputDevices = devices.filter(
                  (device) => device.kind === "audiooutput"
                );
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
          <div className="space-y-4">
            <div>
              <AudioDeviceSelector isMainOutput={true} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Show Pre-listen Controls</label>
                <Switch
                  checked={showPreListenButtons}
                  onCheckedChange={setShowPreListenButtons}
                />
              </div>
              {showPreListenButtons && (
                <AudioDeviceSelector isMainOutput={false} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
