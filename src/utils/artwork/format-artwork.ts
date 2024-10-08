// src/utils/artwork/format-artwork.ts

import { extractColorFromImage } from "../color-from-image";

const isSafari = () => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1;
};

const getSmallImageDimensions = (
  originalWidth: number,
  originalHeight: number
): [width: number, height: number] => {
  const smallerTarget = Math.min(originalWidth, originalHeight, 100);

  if (originalWidth === originalHeight) {
    return [smallerTarget, smallerTarget];
  }

  if (originalWidth > originalHeight) {
    const ratio = originalHeight / originalWidth;
    return [smallerTarget, smallerTarget * ratio];
  }

  const ratio = originalWidth / originalHeight;
  return [smallerTarget * ratio, smallerTarget];
};

export type ArtworkRelatedData = {
  images: {
    optimized: boolean;
    full: Blob;
    small: Blob;
  };
  primaryColor: number | undefined;
};

export const getArtworkRelatedData = async (imageBlob: Blob): Promise<ArtworkRelatedData> => {
  try {
    const bitmap = await createImageBitmap(imageBlob);

    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas context is null');
    }

    ctx.drawImage(bitmap, 0, 0);

    const minifiedImage = isSafari()
      ? imageBlob
      : await canvas.convertToBlob({
          type: 'image/webp',
          quality: 0.8,
        });

    const [smallWidth, smallHeight] = getSmallImageDimensions(bitmap.width, bitmap.height);
    canvas.width = smallWidth;
    canvas.height = smallHeight;
    ctx.drawImage(bitmap, 0, 0, smallWidth, smallHeight);

    const small = await canvas.convertToBlob({
      type: isSafari() ? 'image/png' : 'image/webp',
      quality: 0.7,
    });

    const primaryColor = extractColorFromImage(ctx.getImageData(0, 0, smallWidth, smallHeight));

    return {
      images: {
        optimized: true,
        full: minifiedImage,
        small,
      },
      primaryColor,
    };
  } catch (err) {
    console.error('Failed to optimize artwork', err);

    return {
      images: {
        optimized: false,
        full: imageBlob,
        small: imageBlob,
      },
      primaryColor: undefined,
    };
  }
};