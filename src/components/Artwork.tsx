"use client";

import React, { useState } from "react";
import Icon, { IconType } from "./icon/Icon";

interface ArtworkProps {
  src: string;
  className?: string;
  alt?: string;
  fallbackIcon?: IconType | null;
  children?: React.ReactNode;
}

const Artwork: React.FC<ArtworkProps> = ({
  src,
  fallbackIcon = "musicNote",
  className,
  alt,
  children,
}) => {
  const [error, setError] = useState(false);

  return (
    <div
      className={`ring-1 ring-surface/40 bg-surfaceContainerHighest aspect-1/1 flex overflow-hidden contain-strict ${className}`}
    >
      {src && !error ? (
        <img
          src={src}
          alt={alt}
          loading="eager"
          className="object-cover w-full h-full"
          draggable="false"
          onError={() => setError(true)}
          onLoad={() => setError(false)}
        />
      ) : (
        fallbackIcon !== null && (
          <Icon type={fallbackIcon} className="m-auto size-60%" />
        )
      )}
      {children}
    </div>
  );
};

export default Artwork;
