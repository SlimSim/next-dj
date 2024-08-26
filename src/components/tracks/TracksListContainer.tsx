import React from 'react';
import { usePlayer } from '../../context/PlayerContext'; // Assume you have a PlayerContext
import { useMainStore } from '../../context/MainStoreContext'; // Assume you have a MainStoreContext
import TrackListItem from './TrackListItem';
import VirtualContainer from '../VirtualContainer'; // Assume you have a React version

export type PredefinedTrackMenuItems = 'addToQueue' | 'addToPlaylist' | 'removeFromLibrary' | 'addToFavorites';

interface TrackItemClick {
  track: Track;
  items: number[];
  index: number;
}

interface Props {
  items: number[];
  predefinedMenuItems?: Partial<Record<PredefinedTrackMenuItems, boolean>>;
  onItemClick?: (data: TrackItemClick) => void;
}

const TracksListContainer: React.FC<Props> = ({ items, predefinedMenuItems = {}, onItemClick }) => {
  const player = usePlayer(); 
  const main = useMainStore();

  const defaultOnItemClick = (data: TrackItemClick) => {
    player.playTrack(data.index, data.items);
  };

  const handleClick = onItemClick || defaultOnItemClick;

  const getMenuItems = (track: TrackData) => {
    const items = [
      {
        predefinedKey: 'addToPlaylist',
        label: 'Add to playlist',
        action: () => {
          main.addTrackToPlaylistDialogOpen = track.id;
        },
      },
      {
        predefinedKey: 'addToFavorites',
        label: track.favorite ? 'Remove from favorites' : 'Add to favorites',
        action: () => {
          toggleFavoriteTrack(track.favorite, track.id);
        },
      },
      {
        predefinedKey: 'addToQueue',
        label: 'Add to queue',
        action: () => {
          player.addToQueue(track.id);
        },
      },
      {
        predefinedKey: 'removeFromLibrary',
        label: 'Remove from library',
        action: () => {
          console.log('Remove from library');
        },
      },
    ];

    return items.filter((item) => predefinedMenuItems[item.predefinedKey] !== false);
  };

  return items.length === 0 ? (
    <div className="m-auto self-center justify-self-center w-max h-max text-center">No items to display</div>
  ) : (
    <VirtualContainer size={72} count={items.length} key={(index) => index}>
      {({ item }) => {
        const trackId = items[item.index];
        return (
          <TrackListItem
            trackId={trackId}
            active={player.activeTrack?.id === trackId}
            style={{ transform: `translateY(${item.start}px)` }}
            className="virtual-item top-0 left-0 w-full"
            ariaRowIndex={item.index}
            menuItems={(track) => getMenuItems(track)}
            onClick={(track) => {
              handleClick({
                track,
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

export default TracksListContainer;