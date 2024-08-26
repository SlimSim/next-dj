"use client";

import React from "react";
import IconButton from "@/components/IconButton";
import PlayPreviousNextIcon from "@/components/animated-icons/PlayPreviousNextIcon";
import { usePlayer } from "@/context/PlayerContext";

interface PlayNextButtonProps {
  className?: string;
}

const PlayNextButton: React.FC<PlayNextButtonProps> = ({ className }) => {
  const player = usePlayer();

  return (
    <IconButton
      tooltip="Play Next Track"
      disabled={player.isQueueEmpty}
      className={className}
      onClick={player.playNext}
    >
      <PlayPreviousNextIcon type="next" /> play next track
    </IconButton>
  );
};

export default PlayNextButton;
