// src/components/player/buttons/FavoriteButton.tsx
import React from "react";
import IconButton from "@/components/IconButton"; // /IconButton';
// import { toggleFavoriteTrack } from "@"; //'../../library/playlists';
import { toggleFavoriteTrack } from "@/utils/playlists";
// import { usePlayer } from '../../context/PlayerContext';
import { usePlayer } from "@/context/PlayerContext";

const FavoriteButton: React.FC = () => {
  const player = usePlayer();
  const track = player.activeTrack;

  if (!track) return null;

  return (
    <IconButton
      icon={track.favorite ? "favorite" : "favoriteOutline"}
      tooltip={track.favorite ? "Remove from Favorites" : "Add to Favorites"}
      onClick={() => toggleFavoriteTrack(false, track.id)}
    />
  );
};

export default FavoriteButton;
