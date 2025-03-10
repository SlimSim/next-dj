"use client";

import { useState, useCallback, useEffect } from 'react';
import { Button } from "../../ui/button";
import { FileUpload } from "../../common/file-upload";
import { ThemeToggle } from "../../common/theme-toggle";
import { AudioDeviceSelector } from "../../player/audio-device-selector";
import { usePlayerStore } from "@/lib/store";
import { getRemovedSongs } from "@/db/audio-operations";
import { Folder, ChevronUp, ChevronDown, X, Music2 } from "lucide-react";

interface GeneralTabProps {
  hasRemovedSongs: boolean;
  setHasRemovedSongs: (value: boolean) => void;
}

export function GeneralTab({ hasRemovedSongs, setHasRemovedSongs }: GeneralTabProps) {
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const [showFolderList, setShowFolderList] = useState(false);

  const {
    selectedFolderNames,
    removeFolder,
    clearSelectedFolders,
    removeRemovedSongs,
    triggerRefresh,
  } = usePlayerStore();

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
        const hasAccess = audioOutputDevices.some(
          (device) => device.label !== ""
        );
        setHasAudioPermission(hasAccess);

        navigator.mediaDevices.addEventListener("devicechange", async () => {
          const updatedDevices = await navigator.mediaDevices.enumerateDevices();
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
            <Music2 className="h-4 w-4" />
            <span className="text-sm">
              Some songs were removed from your library
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await removeRemovedSongs();
                checkForRemovedSongs();
                triggerRefresh();
              }}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Audio Devices</h3>
        {!hasAudioPermission && (
          <div className="text-sm text-yellow-500">
            Please grant permission to access audio devices
          </div>
        )}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm">Main Output</label>
            <AudioDeviceSelector isMainOutput={true} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm">Pre-listen Output</label>
            <AudioDeviceSelector isMainOutput={false} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Theme</h3>
        <ThemeToggle />
      </div>
    </div>
  );
}
