import { RefObject } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { MusicMetadata } from "@/lib/types/types";
import { cn } from "@/lib/utils/common";
import { MoreVertical, Play, Pause, Pencil, Trash } from "lucide-react";
import { formatTime } from "@/lib/utils/formatting";
import { PrelistenAudioRef } from "./prelisten-audio-player";

interface TrackItemProps {
  track: MusicMetadata;
  currentTrack: MusicMetadata | null;
  prelistenTrack: MusicMetadata | null;
  isPrelistening: boolean;
  prelistenCurrentTime: number;
  showPreListenButtons: boolean;
  isInQueue?: boolean;
  onPrelistenTimelineClick: (e: React.MouseEvent, track: MusicMetadata) => void;
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
  onPrelistenTimelineClick,
  onPrelistenToggle,
  onAddToQueue,
  onEditTrack,
  onDeleteTrack,
}: TrackItemProps) {
  return (
    <div
      className={cn(
        "p-1 -mb-2 group flex items-center rounded-lg hover:bg-accent/50 w-full overflow-hidden",
        currentTrack?.id === track.id && "bg-accent"
      )}
    >
      <div className="flex-1 min-w-0 overflow mr-1">
        <div className="font-medium text-sm sm:text-base flex items-center gap-2">
          {track.removed ? <span style={{ color: "red" }}>removed </span> : null}
          {track.title}
          {isInQueue && (
            <span className="text-xs text-muted-foreground bg-accent/50 px-2 py-0.5 rounded">In Queue</span>
          )}
        </div>
        {track.artist && (
          <div className="text-xs sm:text-sm text-muted-foreground">
            {track.artist}
            {track.album && ` - ${track.album}`}
          </div>
        )}
        {prelistenTrack && (
          <div
            className={
              prelistenTrack.id === track.id && isPrelistening ? "" : "invisible"
            }
          >
            <div className="flex items-center">
              <span className="text-xs text-muted-foreground mr-2">
                {formatTime(prelistenCurrentTime)}
              </span>
              <div
                className="relative flex-1 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full cursor-pointer"
                onClick={(e) => onPrelistenTimelineClick(e, prelistenTrack)}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-neutral-500 dark:bg-neutral-300 rounded-full"
                  style={{
                    width: `${
                      ((prelistenCurrentTime || 0) /
                        (prelistenTrack.duration || 1)) *
                      100
                    }%`,
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground ml-2">
                -{formatTime((prelistenTrack.duration || 0) - (prelistenCurrentTime || 0))}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {!track.removed && showPreListenButtons && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={(e) => {
              e.stopPropagation();
              onPrelistenToggle(track);
            }}
          >
            {prelistenTrack?.id === track.id && isPrelistening ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span className="sr-only">
              {prelistenTrack?.id === track.id && isPrelistening
                ? "Pause"
                : "Play"}
            </span>
          </Button>
        )}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              disabled={track.removed}
              onClick={() => onAddToQueue(track)}
            >
              Add to Queue
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={track.removed}
              onClick={() => {
                console.log("to be implemented");
              }}
            >
              Play Next
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={track.removed}
              onClick={() => {
                console.log("to be implemented");
              }}
            >
              Play Last
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditTrack(track)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit metadata
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDeleteTrack(track)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
