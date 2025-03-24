import React, { useCallback, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { MusicMetadata } from "@/lib/types/types";
import { cn } from "@/lib/utils/common";
import { usePlayerStore } from "@/lib/store";
import { formatTime } from "@/lib/utils/formatting";
import { StandardMetadataField } from "@/lib/types/settings";
import { CustomMetadataField } from "@/lib/types/customMetadata";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoreVertical, Headphones, Play, Pause, Pencil, Trash, MessageSquare, ListMusic, Plus, ArrowUpToLine, ArrowDownToLine } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { NumberBadge } from "../ui/number-badge";
import { StarRating } from "../ui/star-rating";
import { Checkbox } from "../ui/checkbox";
import { getPlaysInLastHours, getPlaysInCurrentMonth, getTotalPlays } from "@/lib/utils/play-history";
import { useSettings } from "@/lib/settings";
import { PreListenDialog } from "./pre-listen-dialog";
import { SettingsDialog } from "../settings/settings-dialog";
import { ConfirmButton } from "@/components/ui/confirm-button";

interface SongInfoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  track: MusicMetadata;
  currentTrack?: MusicMetadata | null;
  prelistenTrack?: MusicMetadata | null;
  isPrelistening?: boolean;
  prelistenCurrentTime?: number;
  currentTime?: number;
  duration?: number;
  variant?: 'player' | 'next' | 'track-list' | 'queue' | 'history';
  compact?: boolean;
  isPlaying?: boolean;
  isSelected?: boolean;
  showPreListenButtons?: boolean;
  showPlayHistory?: boolean;
  draggable?: boolean;
  dragAttributes?: any; // For drag and drop functionality
  dragListeners?: any; // For drag and drop functionality
  onSelect?: () => void;
  onPrelistenTimelineClick?: (e: React.MouseEvent<Element>, track: MusicMetadata) => void;
  onPrelistenToggle?: (track: MusicMetadata) => void;
  onAddToQueue?: (track: MusicMetadata) => void;
  onPlayNow?: () => void;
  onMoveToTop?: () => void;
  onMoveToBottom?: () => void;
  onRemove?: (track: MusicMetadata) => void;
  onEditTrack?: (track: MusicMetadata) => void;
}

export function SongInfoCard({
  track,
  currentTrack,
  prelistenTrack,
  isPrelistening = false,
  prelistenCurrentTime = 0,
  currentTime = 0,
  duration = track?.duration || 0,
  variant,
  compact = false,
  isPlaying = false,
  isSelected = false,
  draggable = false,
  dragAttributes,
  dragListeners,
  showPlayHistory = false,
  showPreListenButtons: propShowPreListenButtons,
  onSelect,
  onPrelistenTimelineClick,
  onPrelistenToggle,
  onAddToQueue,
  onPlayNow,
  onMoveToTop,
  onMoveToBottom,
  onRemove,
  onEditTrack,
  ...props
}: SongInfoCardProps) {
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);
  const [showPreListenDialog, setShowPreListenDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Store access
  const recentPlayHours = useSettings((state) => state.recentPlayHours);
  const monthlyPlayDays = useSettings((state) => state.monthlyPlayDays);
  const selectedDeviceId = usePlayerStore((state) => state.selectedDeviceId);
  const prelistenDeviceId = usePlayerStore((state) => state.prelistenDeviceId);
  const storeShowPreListenButtons = usePlayerStore((state) => state.showPreListenButtons);
  const setShowPreListenButtons = usePlayerStore((state) => state.setShowPreListenButtons);
  const hasShownPreListenWarning = usePlayerStore((state) => state.hasShownPreListenWarning);
  const setHasShownPreListenWarning = usePlayerStore((state) => state.setHasShownPreListenWarning);
  const setIsQueueVisible = usePlayerStore((state) => state.setQueueVisible);
  const songLists = usePlayerStore((state) => state.songLists);
  const addSongToList = usePlayerStore((state) => state.addSongToList);
  const customMetadata = usePlayerStore((state) => state.customMetadata);
  const standardMetadataFields = usePlayerStore((state) => state.standardMetadataFields);
  
  // Column visibility settings
  const showMetadataBadgesInLists = usePlayerStore((state) => state.showMetadataBadgesInLists);
  const showMetadataBadgesInFooter = usePlayerStore((state) => state.showMetadataBadgesInFooter);
  const showPlayHistoryInLists = usePlayerStore((state) => state.showPlayHistoryInLists);
  const showPlayHistoryInFooter = usePlayerStore((state) => state.showPlayHistoryInFooter);
  
  const queue = usePlayerStore((state) => state.queue);
  const storeCurrentTrack = usePlayerStore((state) => state.currentTrack);
  const history = usePlayerStore((state) => state.history);
  const isQueueVisible = usePlayerStore((state) => state.isQueueVisible);
  const mainPlayerIsPlaying = usePlayerStore((state) => state.isPlaying);
  
  // Filter metadata fields based on visibility settings
  const visibleCustomFields = customMetadata.fields.filter((field: CustomMetadataField) => 
    variant === 'player' || variant === 'next' 
      ? field.showInFooter 
      : field.showInList
  );
  
  const visibleStandardFields = standardMetadataFields.filter((field: StandardMetadataField) => 
    variant === 'player' || variant === 'next' 
      ? field.showInFooter 
      : field.showInList
  );
  
  // Check if a track is in the queue or history
  const trackStatus = useMemo(() => {
    if (!track) return { inQueue: false, inHistory: false };
    
    // Check if it's the current track
    const isCurrentTrack = storeCurrentTrack?.id === track.id;
    
    // Check if it's in the queue array
    const inQueue = isCurrentTrack || queue.some(queueTrack => queueTrack.id === track.id);
    
    // Check if it's in the history
    const inHistory = history.some(historyTrack => historyTrack.id === track.id);
    
    return { inQueue, inHistory };
  }, [track, queue, storeCurrentTrack, history]);
  
  // Combined status for styling purposes
  const isInQueueOrHistory = useMemo(() => {
    return trackStatus.inQueue || trackStatus.inHistory;
  }, [trackStatus]);

  // Use draggable functionality if needed
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable(
    draggable ? { id: track.queueId || track.id } : { id: "not-draggable", disabled: true }
  );

  const style = draggable ? {
    transform: CSS.Transform.toString(transform),
    transition,
  } : undefined;

  // Determine if this component should show pre-listen buttons
  const showPreListenButtons = propShowPreListenButtons !== undefined 
    ? propShowPreListenButtons 
    : storeShowPreListenButtons;

  // Handle pre-listen click
  const handlePreListenClick = (track: MusicMetadata) => {
    if (!onPrelistenToggle) return;

    // If we're already prelistening to this track, just pause it
    if (prelistenTrack?.id === track.id && isPrelistening) {
      onPrelistenToggle(track);
      return;
    }

    // Show warning if main audio is playing, outputs are the same, and we haven't shown the warning yet
    if (mainPlayerIsPlaying && !hasShownPreListenWarning && selectedDeviceId === prelistenDeviceId) {
      setShowPreListenDialog(true);
      setHasShownPreListenWarning(true);
      return;
    }

    // Otherwise just start prelistening
    onPrelistenToggle(track);
  };

  const handleContinueAnyway = () => {
    setShowPreListenDialog(false);
    if (onPrelistenToggle) onPrelistenToggle(track);
  };

  const handleDisablePreListen = () => {
    setShowPreListenDialog(false);
    setShowPreListenButtons(false);
  };

  const handleConfigureOutput = () => {
    setShowPreListenDialog(false);
    setShowSettings(true);
  };

  // Queue manipulation methods
  const handleEditTrack = () => {
    onEditTrack && onEditTrack(track);
  };

  const handlePlayNow = () => {
    onPlayNow && onPlayNow();
  };

  const handleMoveToTop = () => {
    onMoveToTop && onMoveToTop();
  };

  const handleMoveToBottom = () => {
    onMoveToBottom && onMoveToBottom();
  };

  const handleRemove = () => {
    onRemove && onRemove(track);
  };

  // Common dropdown menu for all variants
  const renderDropdownMenu = () => {
    // Determine available actions based on variant
    const isTrackList = variant === 'track-list';
    const isQueue = variant === 'queue';
    const isHistory = variant === 'history';
    const isPlayer = variant === 'player';
    const isNext = variant === 'next';
    
    // Text for remove action varies by variant
    const removeText = isHistory 
      ? 'Remove from History' 
      : isQueue 
        ? 'Remove from Queue'
        : 'Delete';
        
    const showPlayNowOption = isNext || isQueue || isHistory || (isTrackList && onPlayNow);
    const showAddToQueueOption = isTrackList && onAddToQueue;
    const showMoveToTopOption = isQueue && onMoveToTop;
    const showMoveToBottomOption = isQueue && onMoveToBottom;
    const showRemoveOption = (isQueue || isHistory || isTrackList) && onRemove;
    const showEditOption = onEditTrack; 
    const showAddToListOption = true; 
    // Show pre-listen option in dropdown for current and next variants
    const showPreListenOption = (isPlayer || isNext) && showPreListenButtons && onPrelistenToggle && 
      !(prelistenTrack?.id === track.id && isPrelistening);
    
    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-full hover:bg-accent"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {showPlayNowOption && (
            <DropdownMenuItem asChild>
              <ConfirmButton 
                variant="ghost"
                confirmPosition="inline"
                disableConfirm={!mainPlayerIsPlaying}
                className="w-full hover:border-0 flex items-center justify-start font-normal bg-transparent hover:bg-accent cursor-default"
                confirmText={
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Confirm Play Now?
                  </>
                }
                onClick={handlePlayNow}
              >
                <Play className="mr-2 h-4 w-4" />
                Play Now
              </ConfirmButton>

            </DropdownMenuItem>
          )}
          
          {showPreListenOption && (
            <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                handlePreListenClick(track);
            }}>
              <Headphones className="mr-2 h-4 w-4" />
              Pre-listen
            </DropdownMenuItem>
          )}
          
          {showAddToQueueOption && (
            <DropdownMenuItem onClick={() => onAddToQueue && onAddToQueue(track)}>
              <Plus className="mr-2 h-4 w-4" />
              Add to Queue
            </DropdownMenuItem>
          )}
          
          {showMoveToTopOption && (
            <DropdownMenuItem onClick={() => onMoveToTop && onMoveToTop()}>
              <ArrowUpToLine className="mr-2 h-4 w-4" />
              Play next
            </DropdownMenuItem>
          )}
          
          {showMoveToBottomOption && (
            <DropdownMenuItem onClick={() => onMoveToBottom && onMoveToBottom()}>
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Move to Bottom
            </DropdownMenuItem>
          )}
          
          {showEditOption && (
            <DropdownMenuItem onClick={handleEditTrack}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit metadata
            </DropdownMenuItem>
          )}
          
          {showAddToListOption && (
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
          )}
          
          {showRemoveOption && (
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={() => onRemove && onRemove(track)}
            >
              <Trash className="mr-2 h-4 w-4" />
              {removeText}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Determine if we should render specific UI based on variant
  switch (variant) {
    case 'player':
    case 'next':
    case 'queue':
    case 'history':
    case 'track-list':
      return (
        <div
          className={cn(
            "p-1 -mb-2 group flex items-stretch rounded-lg hover:bg-accent/50 w-full overflow-hidden",
            variant === 'track-list' && currentTrack?.id === track.id && "bg-accent",
            isSelected && "bg-accent"
          )}
          data-track-id={track.id}
          {...props}
        >
          {/* Selection Checkbox */}
          {onSelect &&
          <div className="w-6 flex flex-col items-center justify-start pt-4 gap-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => {
                onSelect();
              }}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </div>
          }
          
          {/* Metadata badges column */}
          {((['track-list', 'queue', 'history'].includes(variant || '') && showMetadataBadgesInLists) || 
            ((variant === 'player' || variant === 'next') && showMetadataBadgesInFooter)) ? (
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
                        <p className="text-[0.625rem] text-muted-foreground font-medium">
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
                      <p className="text-[0.625rem] text-muted-foreground font-medium">
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
          ) : null}
          
          {/* Play history badges */}
          {((['track-list', 'queue', 'history'].includes(variant || '') && showPlayHistoryInLists) || 
            ((variant === 'player' || variant === 'next') && showPlayHistoryInFooter)) ? (
            <div className="w-5 flex flex-col items-center pt-1 gap-1">
              <NumberBadge
                number={getPlaysInLastHours(track.playHistory || [], recentPlayHours)}
                size="sm"
                tooltip={`Plays in last ${recentPlayHours}h`}
                variant={isInQueueOrHistory ? "primary" : "ghost"}
              />
              <NumberBadge
                number={getPlaysInCurrentMonth(track.playHistory || [], monthlyPlayDays)}
                size="sm"
                tooltip={`Plays in last ${monthlyPlayDays}d`}
                variant="muted"
              />
              <NumberBadge
                number={getTotalPlays(track.playHistory || [])}
                size="sm"
                tooltip="Total plays"
                variant="muted"
              />
            </div>
          ) : null}
          
          {/* Main content area */}
          <div className="flex-1 min-w-0 overflow pl-1">
            <div className="font-medium text-sm sm:text-base flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {track.removed ? (
                  <span className="text-destructive">[REMOVED] </span>
                ) : null}
                {track?.title}
              </div>
              {/* Time display - only for player variant */}
              {variant === 'player' && (
                <div className="flex items-center gap-3 ml-auto pr-1">
                  <span className="text-xs text-muted-foreground tabular-nums font-medium whitespace-nowrap">
                    {formatTime(currentTime)} / -{formatTime((duration || 0) - (currentTime || 0))}
                  </span>
                </div>
              )}
            </div>
            
            {/* Conditionally show either metadata row or prelisten timeline */}
            {(prelistenTrack?.id === track.id && isPrelistening && onPrelistenTimelineClick) ? (
              /* Prelisten timeline */
              <div className="px-0.5">
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground mr-2 tabular-nums">
                    {formatTime(prelistenCurrentTime)}
                  </span>
                  <div
                    className="relative flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full cursor-pointer"
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
                  <span className="text-xs text-muted-foreground ml-2 tabular-nums">
                    -
                    {formatTime(
                      (prelistenTrack.duration || 0) - (prelistenCurrentTime || 0)
                    )}
                  </span>
                </div>
              </div>
            ) : (
              /* Metadata row */
              <div className="flex flex-wrap items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                {visibleStandardFields.map((field, index) => {
                  let value = track[field.key];
                  
                  // Handle special cases
                  if (field.key === 'genre' && Array.isArray(value)) {
                    value = value.join(', ');
                  } else if (field.key === 'track' && typeof value === 'number') {
                    value = value.toString().padStart(2, '0');
                  }

                  if (!value) return null;

                  // Special handling for comment field
                  if (field.key === 'comment') {
                    const comment = value as string;
                    const isLong = comment.length > 20;
                    const displayText = isLong 
                      ? comment.slice(0, 20) + '...' 
                      : comment;

                    return (
                      <React.Fragment key={field.id}>
                        {index > 0 && <span>•</span>}
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          <TooltipProvider>
                            <Tooltip delayDuration={300}>
                              <TooltipTrigger 
                                className={cn(
                                  "cursor-help",
                                  isLong && "cursor-pointer hover:underline"
                                )}
                                onClick={isLong ? () => setIsCommentExpanded(!isCommentExpanded) : undefined}
                              >
                                <span className="truncate">{displayText}</span>
                              </TooltipTrigger>
                              <TooltipContent side="top" align="start">
                                {isLong ? (isCommentExpanded ? 'Comment: Click to collapse' : 'Comment: Click to expand') : field.name}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </React.Fragment>
                    );
                  }

                  return (
                    <React.Fragment key={field.id}>
                      {index > 0 && <span>•</span>}
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger className="cursor-help">
                              <span className="truncate">{value}</span>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="start">
                              {field.name}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </React.Fragment>
                  );
                })}
                {visibleCustomFields.map((field, index) => {
                  const value = track.customMetadata?.[`custom_${field.id}`];
                  if (!value) return null;
                  return (
                    <React.Fragment key={field.id}>
                      {(visibleStandardFields.some(f => track[f.key]) || index > 0) && <span>•</span>}
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger className="cursor-help">
                              <span className="truncate">{value}</span>
                            </TooltipTrigger>
                            <TooltipContent side="top" align="start">
                              {field.name}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            )}
            
            {/* Expanded comment section */}
            {isCommentExpanded && track.comment && (
              <div
                className="mt-1 text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-1.5 rounded-sm"
                onClick={(e) => e.stopPropagation()}
              >
                {track.comment}
              </div>
            )}
          </div>
            
          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 mr-1">
            {!track.removed && showPreListenButtons && onPrelistenToggle && (
              // Only show the pre-listen button outside the menu in these cases:
              // 1. It's not a current or next variant, OR
              // 2. It's currently pre-listening (showing pause button)
              (!(variant === 'player' || variant === 'next') || (prelistenTrack?.id === track.id && isPrelistening)) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-accent"
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
              )
            )}
            {renderDropdownMenu()}
          </div>
          
          {/* Dialogs */}
          {onPrelistenToggle && (
            <PreListenDialog
              isOpen={showPreListenDialog}
              onClose={() => setShowPreListenDialog(false)}
              onContinue={handleContinueAnyway}
              onDisable={handleDisablePreListen}
              onConfigureOutput={handleConfigureOutput}
            />
          )}
          
          <SettingsDialog
            triggerButton={false}
            open={showSettings}
            onOpenChange={setShowSettings}
          />
        </div>
      );
      
    default:
      return null;
  }
}
