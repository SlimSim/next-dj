"use client";

import React from "react";
import IconButton from "@/components/IconButton";
import PlayPreviousNextIcon from "@/components/animated-icons/PlayPreviousNextIcon";
import { usePlayer } from "@/context/PlayerContext";

interface PlayPrevButtonProps {
  className?: string;
}

const PlayPrevButton: React.FC<PlayPrevButtonProps> = ({ className }) => {
  const player = usePlayer();

  return (
    <IconButton
      tooltip="Play Previous Track"
      disabled={player.isQueueEmpty}
      className={className}
      onClick={player.playPrev}
    >
      <PlayPreviousNextIcon type="previous" /> play previous track
    </IconButton>
  );
};

export default PlayPrevButton;
