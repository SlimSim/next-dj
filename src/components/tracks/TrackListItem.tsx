import React from 'react';
import { useTrackData } from '../../db/query';
import { formatDuration } from '../../utils/format-duration';
import Artwork from '../Artwork'; // Assume you have a React version of Artwork
import ListItem from '../ListItem'; // Assume you have a React version of ListItem

interface Props {
  trackId: number;
  style?: React.CSSProperties;
  ariaRowIndex?: number;
  active?: boolean;
  className?: string;
  menuItems?: (track: TrackData) => MenuItem[];
  onClick?: (track: TrackData) => void;
}

const TrackListItem: React.FC<Props> = ({
  trackId,
  style,
  active,
  className,
  menuItems,
  onClick,
  ariaRowIndex,
}) => {
  const data = useTrackData(trackId);
  const track = data.value;

  const menuItemsWithItem = menuItems ? menuItems(track) : undefined;

  return (
    <ListItem
      style={style}
      menuItems={menuItemsWithItem}
      tabIndex={-1}
      className={`h-72px text-left ${active ? 'bg-onSurfaceVariant/10 text-onSurfaceVariant' : 'color-onSurfaceVariant'} ${className}`}
      aria-label={`Play ${track?.name}`}
      aria-rowindex={ariaRowIndex}
      onClick={() => onClick?.(track!)}
    >
      <div role="cell" className="track-item grow gap-20px items-center">
        <Artwork
          src={track?.images?.small}
          alt={track?.name}
          className={`h-40px w-40px rounded-4px !hidden @sm:!flex ${data.loading && 'opacity-50'}`}
        />

        {data.loading ? (
          <div>
            <div className="h-8px rounded-2px bg-onSurface/10 mb-8px"></div>
            <div className="h-4px rounded-2px bg-onSurface/10 w-80%"></div>
          </div>
        ) : data.error ? (
          'Error loading track'
        ) : track ? (
          <>
            <div className={`flex flex-col truncate ${active ? 'text-primary' : 'color-onSurface'}`}>
              {track.name}
            </div>
            <div className="truncate overflow-hidden">{track.artists.join(', ')}</div>
            <div className="hidden @4xl:block">{track.album}</div>
            <div className="hidden @sm:block tabular-nums">{formatDuration(track.duration)}</div>
          </>
        ) : null}
      </div>
    </ListItem>
  );
};

export default TrackListItem;