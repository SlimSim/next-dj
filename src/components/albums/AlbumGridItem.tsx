import React, { useEffect, useState } from "react";
import { AlbumData, useAlbumData } from "@/utils/db/query";

interface AlbumGridItemProps {
  albumId: number;
  style?: React.CSSProperties;
  tabIndex?: number;
  className?: string;
  onClick?: (album: AlbumData) => void;
}

const AlbumGridItem: React.FC<AlbumGridItemProps> = ({
  albumId,
  style,
  tabIndex,
  className,
  onClick,
}) => {
  const [data, setData] = useState<AlbumData | undefined>(undefined);
  const { fetcher, onDatabaseChange } = useAlbumData(albumId);

  useEffect(() => {
    // Fetch the album data when the component mounts
    const fetchData = async () => {
      const albumData = await fetcher(albumId);
      setData(albumData);
    };

    fetchData();

    // You can also subscribe to database changes if necessary
    // This is more complex and depends on your app's needs
    // const unsubscribe = subscribeToDatabaseChanges(albumId, onDatabaseChange);

    // Clean up function if you subscribe to database changes
    // return () => unsubscribe();
  }, [albumId, fetcher, onDatabaseChange]);

  const handleClick = () => {
    if (data) {
      onClick?.(data);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && data) {
      onClick?.(data);
    }
  };

  return (
    <div
      style={style}
      tabIndex={tabIndex}
      className={className}
      role="listitem"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {!data && (
        <div>
          <div className="h-8px rounded-2px bg-onSurface/10 mb-8px"></div>
          <div className="h-4px rounded-2px bg-onSurface/10 w-80%"></div>
        </div>
      )}
      {data && (
        <div className="flex flex-col h-72px text-onSurfaceVariant px-8px justify-center text-center">
          <div className="text-onSurface truncate">{data.name}</div>
          <div className="truncate">{data.artists.join(", ")}</div>
        </div>
      )}
    </div>
  );
};

export default AlbumGridItem;
