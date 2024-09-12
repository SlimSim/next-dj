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
    full?: string;
  };
  favorite?: boolean;
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
}

interface PlayerProviderProps {
  children: ReactNode;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<PlayerProviderProps> = ({ children }) => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null); // Use useRef to store the audio instance
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
    if (typeof window !== "undefined") {
      audioRef.current = new Audio();
    }

    const handlePlayPause = () => {
      if (!audioRef.current) return;
      if (audioRef.current.paused === !playing) {
        return;
      }
      void audioRef.current[playing ? "play" : "pause"]();
    };

    if (audioRef.current) {
      audioRef.current.onended = () => {
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

      audioRef.current.onpause = handlePlayPause;
      audioRef.current.onplay = handlePlayPause;

      audioRef.current.ondurationchange = () => {
        setDuration(audioRef.current!.duration);
      };

      audioRef.current.ontimeupdate = () => {
        setCurrentTime(audioRef.current!.currentTime);
      };
    }

    return () => {
      if (audioRef.current) {
        cleanupTrackAudio(audioRef.current);
      }
    };
  }, [playing, repeat, activeTrackIndex, itemsIdsOriginalOrder]);

  // Handle track change
  useEffect(() => {
    const loadTrack = async () => {
      console.log("loadTrack: activeTrackIndex", activeTrackIndex);
      if (activeTrackIndex !== -1) {
        const trackId = itemsIdsOriginalOrder[activeTrackIndex];
        console.log("setActiveTrack -> Track data", trackId);
        const db = await getDB();
        const track = await db.get("tracks", trackId);
        if (track) {
          setActiveTrack(track);
          if (audioRef.current) {
            await loadTrackAudio(audioRef.current, track.file);
            if (playing) {
              audioRef.current.play();
            }
          }
        }
      } else {
        setActiveTrack(undefined);
      }
    };

    loadTrack();
  }, [activeTrackIndex, itemsIdsOriginalOrder, playing]);

  const togglePlay = (force?: boolean) => {
    console.log("togglePlay -> force", force);
    const newPlayingState = force ?? !playing;
    setPlaying(newPlayingState);
    if (audioRef.current) {
      if (newPlayingState) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
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
    console.log("playTrack -> trackIndex", trackIndex);
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

    console.log("playTrack: itemsIdsOriginalOrder", itemsIdsOriginalOrder);
    const db = await getDB();
    const trackId = itemsIdsOriginalOrder[trackIndex];
    const track = await db.get("tracks", trackId);
    console.log("playTrack: track", track);

    console.log("playTrack: audioRef.current ", audioRef.current);
    if (track && audioRef.current) {
      setActiveTrack(track);
      await loadTrackAudio(audioRef.current, track.file);
      togglePlay(true);
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        playing,
        togglePlay,
        playNext,
        playPrev,
        playTrack,
        activeTrack,
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
