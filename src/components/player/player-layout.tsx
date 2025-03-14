import { AudioFile, MusicMetadata } from "@/lib/types/types";
import { PlayingQueue } from "./playing-queue";
import { PlayerControlsMenu } from "./player-controls-menu";
import { cn } from "@/lib/utils/common";
import OpenPlayingQueueButton from "./open-playing-queue-button";
import OpenPlayerControlsButton from "./open-player-controls-button";
import ProgressIndicator from "../common/progress-indicator";
import CurrentSongInfo from "./current-song-info";
import { PlayButton } from "./play-button";
import { usePlayerStore } from "@/lib/store";

interface PlayerLayoutProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  queue: MusicMetadata[];
  currentTrack: MusicMetadata | null;
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
  const { isQueueVisible, setQueueVisible, isControlsMenuVisible, setControlsMenuVisible } = usePlayerStore();

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
        <ProgressIndicator 
          value={currentTime} 
          max={duration} 
          isInteractive={isControlsMenuVisible}
          onValueChange={handleSeek}
        />
        <div className="container flex gap-4 py-4 px-1">
          <div className="flex items-center gap-4 w-full">
            <OpenPlayingQueueButton
              number={queue.length}
              onClick={() => setQueueVisible(!isQueueVisible)}
              isOpen={isQueueVisible}
            />
            <div className="flex flex-row flex-wrap gap-1 justify-between w-full">
              <CurrentSongInfo
                track={currentTrack}
                duration={duration}
                currentTime={currentTime}
                variant="current"
              />
              {queue.length > 0 && (
                <CurrentSongInfo
                  track={queue[0]}
                  duration={queue[0].duration}
                  variant="next"
                />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PlayButton
              isPlaying={isPlaying}
              onClick={togglePlay}
              disabled={!currentTrack || isLoading}
            />
            <OpenPlayerControlsButton
              onClick={() => setControlsMenuVisible(!isControlsMenuVisible)}
              isOpen={isControlsMenuVisible}
            />
          </div>
        </div>
      </div>

      {isControlsMenuVisible && (
        <PlayerControlsMenu
          audioRef={audioRef}
          isLoading={isLoading}
          isMuted={isMuted}
          toggleMute={toggleMute}
          handleVolumeChange={handleVolumeChange}
          handleSeek={handleSeek}
        />
      )}

      {children}
      {isQueueVisible && <PlayingQueue />}
    </div>
  );
};
