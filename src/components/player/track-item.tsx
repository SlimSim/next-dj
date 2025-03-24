import { useState } from "react";
import { usePlayerStore } from "@/lib/store";
import { MusicMetadata } from "@/lib/types/types";
import { useSettings } from "@/lib/settings";
import { PreListenDialog } from "./pre-listen-dialog";
import { SettingsDialog } from "../settings/settings-dialog";
import { SongInfoCard } from "./song-info-card";

interface TrackItemProps {
  track: MusicMetadata;
  currentTrack: MusicMetadata | null;
  prelistenTrack: MusicMetadata | null;
  isPrelistening: boolean;
  prelistenCurrentTime: number;
  showPreListenButtons: boolean;
  isInQueue?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onPrelistenTimelineClick: (e: React.MouseEvent<Element>, track: MusicMetadata) => void;
  onPrelistenToggle: (track: MusicMetadata) => void;
  onAddToQueue: (track: MusicMetadata) => void;
  onEditTrack: (track: MusicMetadata) => void;
  onDeleteTrack: (track: MusicMetadata) => void;
}

export function TrackItem({
  track,
  currentTrack,
  prelistenTrack,
  isPrelistening,
  prelistenCurrentTime,
  showPreListenButtons,
  isInQueue,
  isSelected,
  onSelect,
  onPrelistenTimelineClick,
  onPrelistenToggle,
  onAddToQueue,
  onEditTrack,
  onDeleteTrack,
  ...props
}: TrackItemProps) {
  const [showPreListenDialog, setShowPreListenDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const selectedDeviceId = usePlayerStore((state) => state.selectedDeviceId);
  const prelistenDeviceId = usePlayerStore((state) => state.prelistenDeviceId);
  const setShowPreListenButtons = usePlayerStore(
    (state) => state.setShowPreListenButtons
  );
  const hasShownPreListenWarning = usePlayerStore(
    (state) => state.hasShownPreListenWarning
  );
  const setHasShownPreListenWarning = usePlayerStore(
    (state) => state.setHasShownPreListenWarning
  );
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  const handlePreListenClick = (track: MusicMetadata) => {
    // If we're already prelistening to this track, just pause it
    if (prelistenTrack?.id === track.id && isPrelistening) {
      onPrelistenToggle(track);
      return;
    }

    // Show warning if main audio is playing, outputs are the same, and we haven't shown the warning yet
    if (isPlaying && !hasShownPreListenWarning && selectedDeviceId === prelistenDeviceId) {
      setShowPreListenDialog(true);
      setHasShownPreListenWarning(true);
      return;
    }

    // Otherwise just start prelistening
    onPrelistenToggle(track);
  };

  const handleContinueAnyway = () => {
    setShowPreListenDialog(false);
    onPrelistenToggle(track);
  };

  const handleDisablePreListen = () => {
    setShowPreListenDialog(false);
    setShowPreListenButtons(false);
  };

  const handleConfigureOutput = () => {
    setShowPreListenDialog(false);
    setShowSettings(true);
  };

  return (
    <>
      <SongInfoCard
        track={track}
        currentTrack={currentTrack}
        prelistenTrack={prelistenTrack}
        isPrelistening={isPrelistening}
        prelistenCurrentTime={prelistenCurrentTime}
        variant="track-list"
        moreSpace={true}
        isPlaying={currentTrack?.id === track.id && isPlaying}
        isSelected={isSelected}
        showPlayHistory={true}
        showPreListenButtons={showPreListenButtons}
        onSelect={onSelect}
        onPrelistenTimelineClick={onPrelistenTimelineClick}
        onPrelistenToggle={handlePreListenClick}
        onAddToQueue={onAddToQueue}
        onEditTrack={onEditTrack}
        onRemove={onDeleteTrack}
        {...props}
      />
    </>
  );
}
