// src/components/player/buttons/PlayTogglePillButton.tsx
import React from "react";
// import PlayPauseIcon from '../animated-icons/PlayPauseIcon';
import PlayPauseIcon from "@/components/animated-icons/PlayPauseIcon";
// import Button from '../Button';
import Button from "@/components/Button";
// import { usePlayer } from '../../context/PlayerContext';
import { usePlayer } from "@/context/PlayerContext";

const PlayTogglePillButton: React.FC = () => {
  const player = usePlayer();

  return (
    <Button
      tooltip={player.playing ? "Pause" : "Play"}
      className="w-72px !p-0"
      disabled={!player.activeTrack}
      onClick={() => player.togglePlay()}
    >
      <PlayPauseIcon playing={player.playing} />
    </Button>
  );
};

export default PlayTogglePillButton;
