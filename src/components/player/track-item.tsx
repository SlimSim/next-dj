import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { MusicMetadata } from "@/lib/types/types";
import { cn } from "@/lib/utils/common";
import {
  MoreVertical,
  Play,
  Pause,
  Pencil,
  Trash,
  MessageSquare,
  ListMusic,
} from "lucide-react";
import { formatTime } from "@/lib/utils/formatting";
import { NumberBadge } from "../ui/number-badge";
import { StarRating } from "../ui/star-rating";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { useState } from "react";
import {
  getPlaysInLastHours,
  getPlaysInCurrentMonth,
  getTotalPlays,
} from "@/lib/utils/play-history";
import { useSettings } from "../settings/settings-context";
import { PreListenDialog } from "./pre-listen-dialog";
import { usePlayerStore } from "@/lib/store";
import { Dialog, DialogContent } from "../ui/dialog";
import { SettingsDialog } from "../settings/settings-dialog";
import { StandardMetadataField } from "@/lib/types/settings";
import { CustomMetadataField } from "@/lib/types/customMetadata";

interface TrackItemProps {
  track: MusicMetadata;
  currentTrack: MusicMetadata | null;
  prelistenTrack: MusicMetadata | null;
  isPrelistening: boolean;
  prelistenCurrentTime: number;
  showPreListenButtons: boolean;
  isInQueue?: boolean;
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
  onPrelistenTimelineClick,
  onPrelistenToggle,
  onAddToQueue,
  onEditTrack,
  onDeleteTrack,
}: TrackItemProps) {
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);
  const [showPreListenDialog, setShowPreListenDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { recentPlayHours, monthlyPlayDays } = useSettings();
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
  const setIsQueueVisible = usePlayerStore((state) => state.setQueueVisible);
  const songLists = usePlayerStore((state) => state.songLists);
  const addSongToList = usePlayerStore((state) => state.addSongToList);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const customMetadata = usePlayerStore((state) => state.customMetadata);
  const standardMetadataFields = usePlayerStore((state) => state.standardMetadataFields);
  const visibleCustomFields = customMetadata.fields.filter((field: CustomMetadataField) => field.showInList);
  const visibleStandardFields = standardMetadataFields.filter((field: StandardMetadataField) => field.showInList);

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
    <div
      className={cn(
        "p-1 -mb-2 group flex items-stretch rounded-lg hover:bg-accent/50 w-full overflow-hidden",
        currentTrack?.id === track.id && "bg-accent"
      )}
    >
      <div className="w-5 flex flex-col items-center pt-1 gap-1">
        <div className="h-3">
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  {track.rating !== undefined && (
                    <StarRating
                      fillLevel={track.rating}
                      className="text-muted-foreground w-3 h-3"
                    />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" align="center" className="text-xs">
                {track.rating !== undefined
                  ? `Rating: ${Math.round(track.rating * 5)}/5`
                  : "No rating"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="h-3">
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  <p className="text-[0.625rem] text-muted-foreground">
                    {track.bpm || ""}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" align="center" className="text-xs">
                Tempo in Beats Per Minute
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="h-3">
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <p className="text-[0.625rem] text-muted-foreground">
                  {formatTime(track.duration || 0)}
                </p>
              </TooltipTrigger>
              <TooltipContent side="right" align="center" className="text-xs">
                Duration: {formatTime(track.duration || 0)}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="w-5 flex flex-col items-center pt-1 gap-1">
        <NumberBadge
          number={getPlaysInLastHours(track.playHistory || [], recentPlayHours)}
          size="sm"
          variant={isInQueue ? "primary" : "ghost"}
          tooltip={`${
            isInQueue ? "Song is in queue. " : ""
          } Played ${getPlaysInLastHours(
            track.playHistory || [],
            recentPlayHours
          )} times in the last ${recentPlayHours} hours`}
        />
        <NumberBadge
          number={getPlaysInCurrentMonth(
            track.playHistory || [],
            monthlyPlayDays
          )}
          size="sm"
          variant="muted"
          tooltip={`Played ${getPlaysInCurrentMonth(
            track.playHistory || [],
            monthlyPlayDays
          )} times in the last ${monthlyPlayDays} days`}
        />
        <NumberBadge
          number={getTotalPlays(track.playHistory || [])}
          size="sm"
          variant="muted"
          tooltip={`Played ${getTotalPlays(
            track.playHistory || []
          )} times total`}
        />
      </div>
      <div className="flex-1 min-w-0 overflow mr-1 ">
        <div className="font-medium text-sm sm:text-base flex items-center ">
          <div className="flex items-center gap-2 min-w-0">
            {track.removed ? (
              <span style={{ color: "red" }}>removed </span>
            ) : null}
            {track.title}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1 text-xs sm:text-sm text-muted-foreground">
          {visibleStandardFields.map(field => {
            const value = field.key === 'genre' ? track[field.key]?.join(', ') : track[field.key];
            if (!value) return null;
            return (
              <div key={field.id} className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger className="cursor-help">
                      <span className="truncate">y {value}</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="start">
                      {field.name}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span>•</span>
              </div>
            );
          })}
          {track.artist && (
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger className="cursor-help">
                    x <span className="truncate">{track.artist}</span>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start">
                    Artist
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span>•</span>
            </div>
          )}
          {track.album && (
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger className="cursor-help">
                    <span className="truncate">{track.album}</span>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start">
                    Album
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span>•</span>
            </div>
          )}
          {track.track && (
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger className="cursor-help">
                    <span className="truncate">#{track.track}</span>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start">
                    Track
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span>•</span>
            </div>
          )}
          {track.year && (
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger className="cursor-help">
                    <span>{track.year}</span>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start">
                    Year
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span>•</span>
            </div>
          )}
          {track.genre && track.genre.length > 0 && (
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger className="cursor-help">
                    <span className="truncate">{track.genre.join(", ")}</span>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start">
                    Genre
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {track.comment && <span>•</span>}
            </div>
          )}
          {track.comment && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCommentExpanded(!isCommentExpanded);
                }}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        <MessageSquare className="h-3 w-3" />
                        <span className="truncate max-w-[150px]">
                          {track.comment.length > 20
                            ? `${track.comment.substring(0, 20)}...`
                            : track.comment}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="start">
                      Comment
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </button>
            </div>
          )}
          {visibleCustomFields.map(field => {
            const value = track.customMetadata?.[`custom_${field.id}`];
            if (!value) return null;
            return (
              <div key={field.id} className="flex items-center gap-1">
                <span>•</span>
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                          {`${field.name}: ${value.length > 20 ? `${value.substring(0, 20)}...` : value}`}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="start">
                      {field.name}: {value}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            );
          })}
        </div>
        {isCommentExpanded && track.comment && (
          <div
            className="mt-1 text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap "
            onClick={(e) => e.stopPropagation()}
          >
            {track.comment}
          </div>
        )}
        {prelistenTrack && (
          <div
            className={
              prelistenTrack.id === track.id && isPrelistening
                ? ""
                : "invisible"
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
                -
                {formatTime(
                  (prelistenTrack.duration || 0) - (prelistenCurrentTime || 0)
                )}
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
              handlePreListenClick(track);
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
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
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
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ListMusic className="h-4 w-4 mr-2" />
                Add to List
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {songLists.length === 0 ? (
                  <DropdownMenuItem disabled>No lists created</DropdownMenuItem>
                ) : (
                  songLists.map((list) => (
                    <DropdownMenuItem
                      key={list.id}
                      onClick={() => track.path && addSongToList(list.id, track.path)}
                    >
                      {list.name}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem onClick={() => onEditTrack(track)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit metadata
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDeleteTrack(track)}
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <PreListenDialog
        isOpen={showPreListenDialog}
        onClose={() => setShowPreListenDialog(false)}
        onContinue={handleContinueAnyway}
        onDisable={handleDisablePreListen}
        onConfigureOutput={handleConfigureOutput}
      />
      <SettingsDialog
        triggerButton={false}
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </div>
  );
}
