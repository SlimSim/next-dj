// src/components/player/PlayerArtwork.tsx
import React from 'react';
import Artwork from '../Artwork';
import { usePlayer } from '../../context/PlayerContext';

interface PlayerArtworkProps {
  fallbackIcon?: string | null;
  className?: string;
}

const PlayerArtwork: React.FC<PlayerArtworkProps> = ({ fallbackIcon, className }) => {
  const player = usePlayer();

  return (
    <Artwork
      src={player.artworkSrc}
      alt={player.activeTrack?.name}
      fallbackIcon={player.activeTrack ? undefined : fallbackIcon}
      className={className}
    />
  );
};

export default PlayerArtwork;