import { MusicMetadata } from "@/lib/types/types";

export interface PlaybackState {
  currentTrack: MusicMetadata | null;
  isPlaying: boolean;
  repeat: "none" | "one" | "all";
  shuffle: boolean;
}

export interface PlaybackControls {
  playNextTrack: () => void;
  playPreviousTrack: () => void;
  togglePlay: () => void;
  setTrack: (track: MusicMetadata | null) => void;
}
