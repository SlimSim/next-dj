import { parseBuffer } from "music-metadata";

export interface AudioMetadata {
  rating?: number;
  duration?: number;
  bpm?: number;
  title?: string;
  artist?: string;
  album?: string;
  track?: number;
  year?: number;
  genre?: string[];
  comment?: string;
}

export async function readAudioMetadata(file: File): Promise<AudioMetadata> {
  try {
    // const metadata = await parseBlob(file);
    const arrayBuffer = await file.arrayBuffer();
    const metadata = await parseBuffer(Buffer.from(arrayBuffer), file.type);
    const { title, artist, album, bpm, comment, rating, track, year, genre } =
      metadata.common;
    const { duration } = metadata.format;

    var allComments = "";
    try {
      allComments =
        comment === undefined ? "" : comment.map((c) => c.text).join("\n\n");
    } catch (error) {
      console.error("Error parsing comments:", error);
    }

    return {
      title: title || file.name.replace(/\.[^/.]+$/, ""),
      artist: artist || "Unknown Artist",
      album: album || "Unknown Album",
      duration: duration || 0,
      rating: rating === undefined ? undefined : rating[0]?.rating,
      comment: allComments,
      track: track?.no || undefined,
      bpm: bpm,
      year: year,
      genre: genre,
    };
  } catch (error) {
    console.error("Error reading metadata:", error);
    // If we can't read the metadata, return default values
    return {
      title: file.name.replace(/\.[^/.]+$/, ""),
      artist: "Unknown Artist",
      album: "Unknown Album",
      duration: 0,
    };
  }
}
