// src/components/player/PlayerArtwork.tsx
import React from "react";
import Artwork from "../Artwork";
import { usePlayer } from "../../context/PlayerContext";
import { IconType } from "../icon/Icon";

interface PlayerArtworkProps {
  fallbackIcon?: IconType | null;
  className?: string;
}

const PlayerArtwork: React.FC<PlayerArtworkProps> = ({
  fallbackIcon,
  className,
}) => {
  const player = usePlayer();

  return (
    <Artwork
      src={player.artworkSrc || "icons/icon-192.png"}
      alt={player.activeTrack?.name}
      fallbackIcon={player.activeTrack ? undefined : fallbackIcon}
      className={className}
    />
  );
};

export default PlayerArtwork;
