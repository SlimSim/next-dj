import { MusicMetadata } from "@/lib/types/types";
import { formatTime } from "@/features/audio/utils/audioUtils";
import { cn } from "@/lib/utils/common";
import React from "react";

interface CurrentSongInfoProps {
  track: MusicMetadata | null;
  currentTime?: number;
  duration?: number;
  variant?: "current" | "next";
}

const CurrentSongInfo: React.FC<CurrentSongInfoProps> = ({
  track,
  duration = 0,
  currentTime = 0,
  variant = "current",
}) => {
  const isNext = variant === "next";

  return (
    <>
      {track?.coverArt && (
        <img
          src={track.coverArt}
          alt={track.title}
          width={40}
          height={40}
          className="aspect-square rounded-md object-cover"
        />
      )}
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          {isNext && (
            <span className="hidden sm:inline text-sm text-muted-foreground">
              Next:
            </span>
          )}
          <h3
            className={cn(
              "text-sm font-medium leading-none",
              isNext && "text-muted-foreground"
            )}
          >
            {track?.title}
          </h3>
        </div>
        <div className="flex items-center flex-wrap text-xs text-muted-foreground">
          <span>{track?.artist}</span>
          <span className="mx-2">•</span>
          {track?.bpm && (
            <>
              <span>
                {Math.round(track.bpm)} <span className="text-[10px]">BPM</span>
              </span>
              <span className="mx-2">•</span>
            </>
          )}
          {!isNext && (
            <>
              <span>{formatTime(currentTime)}</span>
              <span className="mx-1">/</span>
            </>
          )}
          <span>{formatTime(duration)}</span>
          {!isNext && (
            <>
              <span className="mx-2">•</span>
              <span>-{formatTime(duration - currentTime)}</span>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CurrentSongInfo;
