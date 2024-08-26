"use client";

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { loadTrackAudio, cleanupTrackAudio } from "../utils/audio";
import { persist } from "@/utils/persist";
import { shuffleArray } from "@/utils/array";

interface PlayTrackOptions {
  shuffle?: boolean;
}

export type PlayerRepeat = "none" | "one" | "all";

// Define TrackData type based on your data structure
interface TrackData {
  id: number;
  name: string;
  artists: string[];
  album: string;
  file: File;
  images?: {
    full?: string;
  };
  favorite?: boolean;
  // Add other properties as needed
}

interface PlayerContextType {
  playing: boolean;
  togglePlay: (force?: boolean) => void;
  playNext: () => void;
  playPrev: () => void;
  playTrack: (
    trackIndex: number,
    queue?: readonly number[],
    options?: PlayTrackOptions
  ) => void;
  activeTrack?: TrackData;
  isQueueEmpty?: boolean;
  // Add other methods and state variables as needed
}

interface PlayerProviderProps {
  children: ReactNode;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<PlayerProviderProps> = ({ children }) => {
  const [playing, setPlaying] = useState(false);
  const [audio] = useState(() => new Audio());
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

  useEffect(() => {
    persist("player", { volume, shuffle, repeat }, [
      "volume",
      "shuffle",
      "repeat",
    ]);
  }, [volume, shuffle, repeat]);

  useEffect(() => {
    const handlePlayPause = () => {
      if (audio.paused === !playing) {
        return;
      }
      void audio[playing ? "play" : "pause"]();
    };

    audio.onended = () => {
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

    audio.onpause = handlePlayPause;
    audio.onplay = handlePlayPause;

    audio.ondurationchange = () => {
      setDuration(audio.duration);
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    return () => {
      cleanupTrackAudio(audio);
    };
  }, [audio, playing, repeat, activeTrackIndex, itemsIdsOriginalOrder]);

  useEffect(() => {
    if (activeTrackIndex !== -1) {
      const trackId = itemsIdsOriginalOrder[activeTrackIndex];
      //const trackData = useTrackData(trackId); // Fetch track data using your hook
      // setActiveTrack(trackId);
      console.log("setActiveTrack -> Track data", trackId);
    } else {
      setActiveTrack(undefined);
    }
  }, [activeTrackIndex, itemsIdsOriginalOrder]);

  const togglePlay = (force?: boolean) => {
    setPlaying(force ?? !playing);
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

  const playTrack = (
    trackIndex: number,
    queue?: readonly number[],
    options: PlayTrackOptions = {}
  ) => {
    if (queue) {
      setItemsIdsOriginalOrder([...queue]);
    }

    if (itemsIdsOriginalOrder.length === 0) {
      return;
    }

    if (options.shuffle) {
      const items = [...itemsIdsOriginalOrder];
      shuffleArray(items);
      setItemsIdsShuffled(items);
      setShuffle(false);
    }

    setActiveTrackIndex(trackIndex);
    setCurrentTime(0);
    togglePlay(true);
  };

  return (
    <PlayerContext.Provider
      value={{
        playing,
        togglePlay,
        playNext,
        playPrev,
        playTrack,
        activeTrack, // Provide activeTrack in the context
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
