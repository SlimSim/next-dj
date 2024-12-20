import { MusicMetadata } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import React from "react";

interface CurrentSongInfoProps {
  track: MusicMetadata | null;
  currentTime: number;
  duration: number;
}

const CurrentSongInfo: React.FC<CurrentSongInfoProps> = ({
  track,
  duration,
  currentTime,
}) => {
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
        <h3 className="text-sm font-medium leading-none">
          {track?.title || "No track playing"}
        </h3>
        <div className="flex items-center text-xs text-muted-foreground">
          <span>{track?.artist || "Unknown artist"}</span>
          <span className="mx-2">•</span>
          <span>{formatTime(currentTime)}</span>
          <span className="mx-1">/</span>
          <span>{formatTime(duration)}</span>
          <span className="mx-2">•</span>
          <span>-{formatTime(duration - currentTime)}</span>
        </div>
      </div>
    </>
  );
};

export default CurrentSongInfo;
