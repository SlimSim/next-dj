"use client";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { SettingsIcon } from "lucide-react";
import { useSettings } from "@/lib/settings";
import { usePlayerStore } from "@/lib/store";
import { useCallback, useEffect, useState } from "react";
import { getRemovedSongs } from "@/db/audio-operations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { AdvancedTab } from './tabs/advanced-tab';
import { GeneralTab } from "./tabs/general-tab";
import { MetadataTab } from './tabs/metadata-tab';

interface SettingsContentProps {
  hasRemovedSongs: boolean;
  setHasRemovedSongs: (value: boolean) => void;
  defaultTab?: string;
}

export function SettingsContent({
  hasRemovedSongs,
  setHasRemovedSongs,
  defaultTab = "general",
}: SettingsContentProps) {
  const [hasAudioPermission, setHasAudioPermission] = useState(false);
  const practiceMode = usePlayerStore((state) => state.practiceMode);
  const setPracticeMode = usePlayerStore((state) => state.setPracticeMode);

  const {
    selectedFolderNames,
    removeFolder,
    removeRemovedSongs,
  } = usePlayerStore();

  const recentPlayHours = useSettings((state) => state.recentPlayHours);
  const setRecentPlayHours = useSettings((state) => state.setRecentPlayHours);
  const monthlyPlayDays = useSettings((state) => state.monthlyPlayDays);
  const setMonthlyPlayDays = useSettings((state) => state.setMonthlyPlayDays);

  const [showFolderList, setShowFolderList] = useState(false);

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

  return (
    <div className="overflow-hidden h-full">
      <Tabs defaultValue={defaultTab} className="h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <GeneralTab 
            hasRemovedSongs={hasRemovedSongs}
            selectedFolderNames={selectedFolderNames}
            showFolderList={showFolderList}
            setShowFolderList={setShowFolderList}
            removeFolder={removeFolder}
            removeRemovedSongs={removeRemovedSongs}
            checkForRemovedSongs={checkForRemovedSongs}
            practiceMode={practiceMode}
            setPracticeMode={setPracticeMode}
            hasAudioPermission={hasAudioPermission}
            setHasAudioPermission={setHasAudioPermission}
          />
        </TabsContent>

        <TabsContent value="advanced">
          <AdvancedTab 
            recentPlayHours={recentPlayHours}
            setRecentPlayHours={setRecentPlayHours}
            monthlyPlayDays={monthlyPlayDays}
            setMonthlyPlayDays={setMonthlyPlayDays}
          />
        </TabsContent>

        <TabsContent value="metadata" className="space-y-6 h-[calc(100vh-12rem)]">
          <MetadataTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function SettingsDialog({
  triggerButton = true,
  open,
  onOpenChange,
  defaultTab = "general",
}: {
  triggerButton?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultTab?: string;
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
        <div className="flex-1 pr-6 -mr-6">
          <SettingsContent
            hasRemovedSongs={hasRemovedSongs}
            setHasRemovedSongs={setHasRemovedSongs}
            defaultTab={defaultTab}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
