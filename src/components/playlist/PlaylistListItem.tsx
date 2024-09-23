import React from "react";
import { usePlaylistData } from "@/hooks/useEntityData";
import ListItem from "../ListItem"; // Assume you have a React version
import Icon from "../icon/Icon"; // Assume you have a React version
import { Playlist } from "@/types/entities";
import { MenuItem } from "../menu/types";

interface Props {
  playlistId: number;
  style?: React.CSSProperties;
  ariaRowIndex?: number;
  active?: boolean;
  className?: string;
  icon?: React.ReactNode;
  menuItems?: (playlist: Playlist) => MenuItem[];
  onClick?: (playlist: Playlist) => void;
}

const PlaylistListItem: React.FC<Props> = ({
  playlistId,
  style,
  active,
  className,
  onClick,
  icon = <Icon type="playlist" />,
  ariaRowIndex,
  menuItems,
}) => {
  const data = usePlaylistData(playlistId);
  const playlist = data.value;

  const menuItemsWithItem =
    menuItems && playlist ? menuItems(playlist) : undefined;

  return (
    <ListItem
      style={style}
      menuItems={menuItemsWithItem}
      tabIndex={-1}
      className={`h-56px text-left ${active ? "bg-onSurfaceVariant/10 text-onSurfaceVariant" : ""} ${className}`}
      aria-label={`Play ${playlist?.name}`}
      aria-rowindex={ariaRowIndex}
      onClick={() => onClick?.(playlist!)}
    >
      <div role="cell" className="track-item grow gap-20px items-center">
        {icon}

        {data.loading ? (
          <div className="h-8px rounded-2px bg-onSurface/10"></div>
        ) : data.error ? (
          "Error loading track"
        ) : playlist ? (
          <div className="flex flex-col truncate">{playlist.name}</div>
        ) : null}
      </div>
    </ListItem>
  );
};

export default PlaylistListItem;
