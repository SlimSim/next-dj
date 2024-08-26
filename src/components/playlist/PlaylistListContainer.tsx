import React from "react";
import PlaylistListItem from "./PlaylistListItem"; // Assume you have a React version
import VirtualContainer from "../VirtualContainer"; // Assume you have a React version

interface TrackItemClick {
  playlist: Playlist;
  items: number[];
  index: number;
}

interface Props {
  items: number[];
  icon?: React.ReactNode;
  onItemClick?: (data: TrackItemClick) => void;
  menuItems?: (playlist: Playlist) => MenuItem[];
  children?: React.ReactNode; // Add this line if you want to support children
}

const PlaylistListContainer: React.FC<Props> = ({
  items,
  icon,
  menuItems,
  onItemClick,
}) => {
  return (
    <VirtualContainer
      size={56}
      count={items.length}
      key={(index) => items[index]}
    >
      {({ item }) => {
        const playlistId = items[item.index];
        return (
          <PlaylistListItem
            playlistId={playlistId}
            style={{ transform: `translateY(${item.start}px)` }}
            className="virtual-item top-0 left-0 w-full"
            ariaRowIndex={item.index}
            menuItems={menuItems}
            icon={icon}
            onClick={(playlist) => {
              onItemClick?.({
                playlist,
                items,
                index: item.index,
              });
            }}
          />
        );
      }}
    </VirtualContainer>
  );
};

export default PlaylistListContainer;
