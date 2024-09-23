import React from "react";
import { ArtistData } from "@/utils/db/query";
import GridItem from "@/components/GridItem";
import { useArtistData } from "@/hooks/useEntityData";

interface ArtistGridItemProps {
  artistId: number;
  style?: React.CSSProperties;
  tabIndex?: number;
  className?: string;
  onClick?: (artist: ArtistData) => void;
}

const ArtistGridItem: React.FC<ArtistGridItemProps> = ({
  artistId,
  style,
  tabIndex,
  className,
  onClick,
}) => {
  const { data, loading, error } = useArtistData(artistId); // Assuming useArtistData is a hook

  const handleClick = () => {
    if (data.value) {
      onClick?.(data.value);
    }
  };

  return (
    <GridItem
      style={style}
      tabIndex={tabIndex}
      className={className}
      role="listitem"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          handleClick();
        }
      }}
    >
      {loading ? (
        <div>
          <div className="h-8px rounded-2px bg-onSurface/10 mb-8px"></div>
          <div className="h-4px rounded-2px bg-onSurface/10 w-80%"></div>
        </div>
      ) : error ? (
        "Error loading artist"
      ) : data ? (
        <div className="flex flex-col h-72px text-onSurfaceVariant px-8px justify-center text-center">
          <div className="text-onSurface truncate">{data.value?.name}</div>
        </div>
      ) : null}
    </GridItem>
  );
};

export default ArtistGridItem;
