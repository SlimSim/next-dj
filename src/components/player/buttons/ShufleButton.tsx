// src/components/player/buttons/ShuffleButton.tsx
import React from "react";
import Icon from "@/components/icon/Icon";
import IconButton from "@/components/IconButton";

import { usePlayer } from "@/context/PlayerContext";

interface ShuffleButtonProps {
  className?: string;
}

const ShuffleButton: React.FC<ShuffleButtonProps> = ({ className }) => {
  const player = usePlayer();

  return (
    <IconButton
      tooltip={player.shuffle ? "Disable Shuffle" : "Enable Shuffle"}
      className={className}
      onClick={player.toggleShuffle}
    >
      Shuffle
      <Icon type="shuffle" />
      <div
        className={`size-4px rounded-full bg-primary absolute bottom-4px transition-1000 transition-transform transform-origin-center ${
          player.shuffle ? "scale-100" : "scale-0"
        }`}
      ></div>
    </IconButton>
  );
};

export default ShuffleButton;
