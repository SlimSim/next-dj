"use client";

import React from "react";
import PlayPauseIcon from "@/components/animated-icons/PlayPauseIcon";
import IconButton from "@/components/IconButton";
import { usePlayer } from "@/context/PlayerContext";

interface PlayToggleButtonProps {
  className?: string;
}

const PlayToggleButton: React.FC<PlayToggleButtonProps> = ({ className }) => {
  const player = usePlayer();

  return (
    <IconButton
      tooltip={player.playing ? "Pause" : "Play"}
      disabled={!player.activeTrack}
      className={
        className + (player.activeTrack ? " text-black" : " text-gray-400")
      }
      onClick={() => player.togglePlay()}
    >
      <PlayPauseIcon playing={player.playing} /> toggle play
    </IconButton>
  );
};

export default PlayToggleButton;
