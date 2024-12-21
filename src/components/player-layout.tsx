import { AudioFile, MusicMetadata } from "@/lib/types/types";
import { PlayingQueue } from "./playing-queue";
import { PlayerControlsMenu } from "./player-controls-menu";
import { cn } from "@/lib/utils";
import OpenPlayingQueueButton from "./open-playing-queue-button";
import OpenPlayerControlsButton from "./open-player-controls-button";
import ProgressIndicator from "./progress-indicator";
import CurrentSongInfo from "./current-song-info";
import { useState } from "react";
import { PlayButton } from "./play-button";

interface PlayerLayoutProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  queue: MusicMetadata[];
  currentTrack: MusicMetadata | null;
  isQueueVisible: boolean;
  setQueueVisible: (visible: boolean) => void;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isLoading: boolean;
  togglePlay: () => void;
  handleVolumeChange: (value: number) => void;
  handleSeek: (value: number) => void;
  toggleMute: () => void;
  isMuted: boolean;
  children: React.ReactNode;
}

export const PlayerLayout = ({
  audioRef,
  queue,
  currentTrack,
  isQueueVisible,
  setQueueVisible,
  currentTime,
  duration,
  isPlaying,
  isLoading,
  togglePlay,
  handleVolumeChange,
  handleSeek,
  toggleMute,
  isMuted,
  children,
}: PlayerLayoutProps) => {
  const [isControlsMenuOpen, setIsControlsMenuOpen] = useState(false);

  return (
    <div
      className={cn(
        queue.length === 0 && currentTrack
          ? "bg-red-600/40 dark:bg-red-500/50"
          : "bg-background/95"
      )}
    >
      <div
        className={cn(
          "border-t",
          queue.length === 0 &&
            currentTrack &&
            "border-red-500/70 dark:border-red-400/70"
        )}
      >
        <ProgressIndicator value={currentTime} max={duration} />
        <div className="container flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-4">
            <OpenPlayingQueueButton
              number={queue.length}
              onClick={() => setQueueVisible(!isQueueVisible)}
            />
            <CurrentSongInfo
              track={currentTrack}
              duration={duration}
              currentTime={currentTime}
            />
          </div>
          <div className="flex items-center gap-2">
            <PlayButton
              isPlaying={isPlaying}
              onClick={togglePlay}
              disabled={!currentTrack || isLoading}
            />
            <OpenPlayerControlsButton
              onClick={() => setIsControlsMenuOpen(!isControlsMenuOpen)}
            />
          </div>
        </div>
      </div>

      <PlayerControlsMenu
        isOpen={isControlsMenuOpen}
        onClose={() => setIsControlsMenuOpen(false)}
        audioRef={audioRef}
        isLoading={isLoading}
        isMuted={isMuted}
        toggleMute={toggleMute}
        handleVolumeChange={handleVolumeChange}
        handleSeek={handleSeek}
      />

      {children}
      {isQueueVisible && <PlayingQueue />}
    </div>
  );
};
