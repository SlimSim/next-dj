// src/hooks/useManagedArtwork.ts

import { useEffect, useState } from 'react';

class Artwork {
  static index = 0;

  index: number;
  image: Blob;
  url: string;
  refs = new Set<symbol>();

  constructor(image: Blob, key: symbol) {
    this.image = image;
    this.url = URL.createObjectURL(image);
    this.refs.add(key);

    this.index = Artwork.index;
    Artwork.index += 1;
  }
}

const cache = new WeakMap<Blob, Artwork>();
const cleanupQueue = new Set<Blob>();

export const useManagedArtwork = (getImage: () => Blob | undefined | null): string => {
  const key = Symbol();

  const [state, setState] = useState<Artwork | null>(null);

  useEffect(() => {
    const image = getImage();

    if (!image) {
      setState(null);
      return;
    }

    let artwork = cache.get(image);
    if (artwork) {
      artwork.refs.add(key);
    } else {
      artwork = new Artwork(image, key);
      cache.set(image, artwork);
    }

    setState(artwork);

    return () => {
      if (artwork) {
        releaseLock(artwork);
      }
    };
  }, [getImage]);

  const url = state?.url ?? '';

  const releaseLock = (artwork: Artwork) => {
    if (!artwork) {
      return;
    }

    if (artwork.refs.size === 1) {
      cleanupQueue.add(artwork.image);
    }

    if (process.env.NODE_ENV === 'development') {
      if (!artwork.refs.has(key)) {
        console.warn('Trying to release artwork that is not in use', artwork);
      }
    }

    artwork.refs.delete(key);
  };

  return url;
};

if (typeof window !== 'undefined') {
  const thirtySeconds = 30 * 1000;
  window.setInterval(() => {
    for (const blob of cleanupQueue) {
      const cached = cache.get(blob);
      if (!cached) {
        continue;
      }

      if (cached.refs.size === 0) {
        cache.delete(blob);
        URL.revokeObjectURL(cached.url);
      }
    }

    cleanupQueue.clear();
  }, thirtySeconds);
}
