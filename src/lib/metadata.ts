import { parseBuffer } from "music-metadata";

export interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
}

export async function readAudioMetadata(file: File): Promise<AudioMetadata> {
  try {
    // const metadata = await parseBlob(file);
    const arrayBuffer = await file.arrayBuffer();
    const metadata = await parseBuffer(Buffer.from(arrayBuffer), file.type);
    const { title, artist, album } = metadata.common;
    return {
      title: title || file.name.replace(/\.[^/.]+$/, ""),
      artist: artist || "Unknown Artist",
      album: album || "Unknown Album",
    };
  } catch (error) {
    console.error("Error reading metadata:", error);
    // If we can't read the metadata, return default values
    return {
      title: file.name.replace(/\.[^/.]+$/, ""),
      artist: "Unknown Artist",
      album: "Unknown Album",
    };
  }
}
