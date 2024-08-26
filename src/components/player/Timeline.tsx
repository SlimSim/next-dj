"use client";

// src/components/player/Timeline.tsx
import React, { useState } from "react";
import Slider from "../Slider";
import { formatDuration } from "../../utils/format-duration";
import { usePlayer } from "../../context/PlayerContext";

interface TimelineProps {
  className?: string;
}

const Timeline: React.FC<TimelineProps> = ({ className }) => {
  const player = usePlayer();
  const [seeking, setSeeking] = useState(false);
  const [seekingValue, setSeekingValue] = useState(0);
  const max = 1000;

  const value = (player.currentTime / player.duration) * max || 0;

  const getTime = (percentage: number) => (percentage / max) * player.duration;

  const playerSeek = (val: number) => {
    player.seek(getTime(val));
  };

  const currentTime = () =>
    formatDuration(seeking ? getTime(seekingValue) : player.currentTime);

  return (
    <div
      className={`timeline-container grid items-center tabular-nums gap-10px w-full text-nowrap ${className}`}
    >
      <div className="text-body-sm">{currentTime()}</div>
      <Slider
        disabled={!player.activeTrack}
        max={max}
        value={seeking ? seekingValue : value}
        onChange={(val) => {
          if (seeking) {
            setSeekingValue(val);
          } else {
            playerSeek(val);
          }
        }}
        onSeekStart={() => setSeeking(true)}
        onSeekEnd={() => {
          setSeeking(false);
          playerSeek(seekingValue);
        }}
      />
      <div className="text-body-sm text-right">
        {formatDuration(player.duration)}
      </div>
    </div>
  );
};

export default Timeline;
