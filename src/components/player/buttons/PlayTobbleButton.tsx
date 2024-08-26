"use client";

import React from "react";
// import PlayPauseIcon from '../animated-icons/PlayPauseIcon';
import PlayPauseIcon from "@/components/animated-icons/PlayPauseIcon";
// import IconButton from '../IconButton';
import IconButton from "@/components/IconButton";
// import { usePlayer } from '../../context/PlayerContext';
import { usePlayer } from "@/context/PlayerContext";

const PlayToggleButton: React.FC = () => {
  const player = usePlayer();

  return (
    <IconButton
      tooltip={player.playing ? "Pause" : "Play"}
      disabled={!player.activeTrack}
      onClick={() => player.togglePlay()}
    >
      <PlayPauseIcon playing={player.playing} /> toggle play
    </IconButton>
  );
};

export default PlayToggleButton;
