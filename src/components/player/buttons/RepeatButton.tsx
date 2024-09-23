// src/components/player/buttons/RepeatButton.tsx
import IconButton from "@/components/IconButton";
import { usePlayer } from "@/context/PlayerContext";
import React from "react";

interface RepeatButtonProps {
  className?: string;
}

const RepeatButton: React.FC<RepeatButtonProps> = ({ className }) => {
  const player = usePlayer();

  const tooltipMap: any = {
    none: "Enable Repeat",
    all: "Enable Repeat One",
    one: "Disable Repeat",
  };

  return (
    <IconButton
      tooltip={tooltipMap[player.repeat]}
      className={className}
      onClick={player.toggleRepeat}
    >
      <svg
        className={`size-24px fill-current ${player.repeat !== "none" && ""}`}
        viewBox="0 0 24 24"
      >
        <path
          data-arrows
          className="transform-origin-center"
          d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"
        />
        <path
          className={`transition-transform transform-origin-center ${
            player.repeat === "one" ? "scale-100" : "scale-0"
          }`}
          d="M 13,15 V 9.0000002 H 12 L 10,10 v 1 h 1.5 v 4 z"
        />
      </svg>
      <div
        className={`size-4px rounded-full bg-primary absolute bottom-4px transition-1000 transition-transform transform-origin-center ${
          player.repeat === "none" ? "scale-0" : "scale-100"
        }`}
      ></div>
    </IconButton>
  );
};

export default RepeatButton;
