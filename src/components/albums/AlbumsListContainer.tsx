"use client";

import React, { useState } from "react";
import { useRouter } from "next/router";
import AlbumGridItem from "./AlbumGridItem";

interface AlbumsListContainerProps {
  items: number[];
}

const AlbumsListContainer: React.FC<AlbumsListContainerProps> = ({ items }) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const router = useRouter();

  const gap = 8;
  const minWidth = containerWidth > 600 ? 180 : 140;
  const columns = Math.max(Math.floor(containerWidth / minWidth), 1);
  const width = Math.floor((containerWidth - gap * (columns - 1)) / columns);
  const height = width + 72;

  const handleClick = (albumId: number) => {
    const shouldReplace =
      router.pathname === "/library/[slug=libraryEntities]/[id]";
    router.push(`/library/albums/${albumId}`, undefined, {
      shallow: shouldReplace,
    });
  };

  return (
    <div style={{ display: "grid", gap: `${gap}px` }}>
      {items.map((albumId, index) => (
        <AlbumGridItem
          key={albumId}
          albumId={albumId}
          style={{
            left: `${(index % columns) * (width + gap)}px`,
            width: `${width}px`,
            height: `${height}px`,
            transform: `translateY(${Math.floor(index / columns) * height}px)`,
          }}
          onClick={() => handleClick(albumId)}
        />
      ))}
    </div>
  );
};

export default AlbumsListContainer;
