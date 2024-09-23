"use client";

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { loadTrackAudio, cleanupTrackAudio } from "../utils/audio";
import { persist } from "@/utils/persist";
import { shuffleArray } from "@/utils/array";
import { getDB } from "@/utils/db/get-db"; // Make sure this import is correct

const globalAudio = typeof window !== "undefined" ? new Audio() : null;

interface PlayTrackOptions {
  shuffle?: boolean;
}
export type PlayerRepeat = "none" | "one" | "all";

interface TrackData {
  id: number;
  name: string;
  artists: string[];
  album: string;
  file: File | FileSystemFileHandle; // Update this to match your file storage method
  images?: {
    optimized?: boolean;
    small?: Blob;
    full?: Blob;
  };
  favorite?: boolean;
}

interface PlayerContextType {
  repeat: any;
  toggleRepeat: () => void;
  playing: boolean;
  togglePlay: (force?: boolean) => void;
  playNext: () => void;
  playPrev: () => void;
  volume: number;
  setVolume: (volume: number) => void;
  shuffle: boolean;
  toggleShuffle: () => void;
  artworkSrc?: string;
  playTrack: (
    trackIndex: number,
    queue?: readonly number[],
    options?: PlayTrackOptions
  ) => void;
  activeTrack?: TrackData;
  duration: number;
  currentTime: number;
  isQueueEmpty?: boolean;
  seek: (time: number) => void;
}

interface PlayerProviderProps {
  children: ReactNode;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<PlayerProviderProps> = ({ children }) => {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [repeat, setRepeat] = useState<PlayerRepeat>("none");
  const [shuffle, setShuffle] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeTrackIndex, setActiveTrackIndex] = useState(-1);
  const [itemsIdsOriginalOrder, setItemsIdsOriginalOrder] = useState<number[]>(
    []
  );
  const [itemsIdsShuffled, setItemsIdsShuffled] = useState<number[]>([]);
  const [activeTrack, setActiveTrack] = useState<TrackData | undefined>(
    undefined
  );

  // Persist settings (volume, shuffle, repeat)
  useEffect(() => {
    persist("player", { volume, shuffle, repeat }, [
      "volume",
      "shuffle",
      "repeat",
    ]);
  }, [volume, shuffle, repeat]);

  // Create the audio element only on the client side
  useEffect(() => {
    if (!globalAudio) return;

    const handlePlayPause = () => {
      if (!globalAudio) return;
      if (globalAudio.paused === !playing) {
        return;
      }
      void globalAudio[playing ? "play" : "pause"]();
    };

    globalAudio.onended = () => {
      if (repeat === "one") {
        playTrack(activeTrackIndex);
        return;
      }

      if (
        repeat === "none" &&
        activeTrackIndex === itemsIdsOriginalOrder.length - 1
      ) {
        return;
      }

      playNext();
    };

    globalAudio.onpause = handlePlayPause;
    globalAudio.onplay = handlePlayPause;

    globalAudio.ondurationchange = () => {
      setDuration(globalAudio!.duration);
    };

    globalAudio.ontimeupdate = () => {
      setCurrentTime(globalAudio!.currentTime);
    };

    return () => {
      if (globalAudio) {
        cleanupTrackAudio(globalAudio);
      }
    };
  }, [playing, repeat, activeTrackIndex, itemsIdsOriginalOrder]);

  // Handle track change
  useEffect(() => {
    const loadTrack = async () => {
      if (activeTrackIndex !== -1) {
        const trackId = itemsIdsOriginalOrder[activeTrackIndex];
        const db = await getDB();
        const track = await db.get("tracks", trackId);
        if (track && globalAudio) {
          const trackData: TrackData = {
            id: track.id,
            name: track.name,
            artists: track.artists,
            album: track.album || "unknown",
            file: track.file,
            images: track.images,
          };
          setActiveTrack(trackData);
          await loadTrackAudio(globalAudio, track.file);
          // if (playing) {
          //   globalAudio.play();
          // }
        }
      } else {
        setActiveTrack(undefined);
      }
    };

    loadTrack();
  }, [activeTrackIndex, itemsIdsOriginalOrder, playing]);

  const togglePlay = (force?: boolean) => {
    const newPlayingState = force ?? !playing;
    setPlaying(newPlayingState);
    if (globalAudio) {
      if (newPlayingState) {
        globalAudio.play();
      } else {
        globalAudio.pause();
      }
    }
  };

  const playNext = () => {
    let newIndex = activeTrackIndex + 1;
    if (newIndex >= itemsIdsOriginalOrder.length) {
      newIndex = 0;
    }
    playTrack(newIndex);
  };

  const playPrev = () => {
    let newIndex = activeTrackIndex - 1;
    if (newIndex < 0) {
      newIndex = itemsIdsOriginalOrder.length - 1;
    }
    playTrack(newIndex);
  };

  const playTrack = async (
    trackIndex: number,
    queue?: readonly number[],
    options: PlayTrackOptions = {}
  ) => {
    let currentQueue = itemsIdsOriginalOrder;

    if (queue) {
      currentQueue = [...queue];
      setItemsIdsOriginalOrder(currentQueue);
    }

    if (currentQueue.length === 0) {
      return;
    }

    if (options.shuffle) {
      const items = [...currentQueue];
      shuffleArray(items);
      setItemsIdsShuffled(items);
      setShuffle(false);
    }

    setActiveTrackIndex(trackIndex);
    setCurrentTime(0);

    const db = await getDB();
    const trackId = currentQueue[trackIndex];
    const track = await db.get("tracks", trackId);

    if (track && globalAudio) {
      setActiveTrack({
        ...track,
        album: track.album || "unknown",
      });
      await loadTrackAudio(globalAudio, track.file);
      togglePlay(true);
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        repeat,
        toggleRepeat: () => {
          setRepeat((prevRepeat) => {
            if (prevRepeat === "none") return "one";
            if (prevRepeat === "one") return "all";
            return "none";
          });
        },
        playing,
        togglePlay,
        playNext,
        playPrev,
        volume,
        setVolume,
        shuffle,
        toggleShuffle: () => setShuffle((prevShuffle) => !prevShuffle),
        artworkSrc: activeTrack?.images?.full
          ? URL.createObjectURL(activeTrack.images.full)
          : undefined,
        playTrack,
        activeTrack,
        duration,
        currentTime,
        isQueueEmpty: itemsIdsOriginalOrder.length === 0,
        seek: (time: number) => {
          if (globalAudio) {
            globalAudio.currentTime = time;
            setCurrentTime(time);
          }
        },
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
};
