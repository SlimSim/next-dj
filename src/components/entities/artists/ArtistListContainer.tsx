"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import VirtualContainer from "@/components/VirtualContainer";
import ArtistGridItem from "./ArtistGridItem";
import { safeInteger } from "@/utils/integers";

interface ArtistListContainerProps {
  items: number[];
}

const ArtistListContainer: React.FC<ArtistListContainerProps> = ({ items }) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const gap = 8;
  const router = useRouter();

  const sizes = React.useMemo(() => {
    const minWidth = containerWidth > 600 ? 180 : 140;
    const columns = safeInteger(Math.floor(containerWidth / minWidth), 1);
    const width = safeInteger(
      Math.floor((containerWidth - gap * (columns - 1)) / columns)
    );
    const height = width + 72;

    return {
      width,
      height: height + gap,
      columns,
      heightWithoutGap: height,
    };
  }, [containerWidth, gap]);

  const handleResize = () => {
    setContainerWidth(window.innerWidth);
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <VirtualContainer
      offsetWidth={containerWidth}
      gap={gap}
      count={items.length}
      size={sizes.height}
      lanes={sizes.columns}
      keyExtractor={(index) => items[index]}
    >
      {(virtualItem) => {
        const index = virtualItem.index;
        const artistId = items[index];
        return (
          <ArtistGridItem
            key={artistId}
            artistId={artistId}
            className="virtual-item top-0"
            style={{
              left: `${(index % sizes.columns) * (sizes.width + gap)}px`,
              width: `${sizes.width}px`,
              height: `${sizes.height - gap}px`,
              transform: `translateY(${Math.floor(index / sizes.columns) * sizes.height}px)`,
            }}
            onClick={() => {
              const shouldReplace =
                router.pathname === "/library/[slug=libraryEntities]/[id]";
              router.push(`/library/artists/${artistId}`, undefined, {
                shallow: shouldReplace,
              });
            }}
          />
        );
      }}
    </VirtualContainer>
  );
};

export default ArtistListContainer;
