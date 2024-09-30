// src/components/pwa/NowPlayingList.tsx
import React from "react";
import { Button } from "../ui/button";

interface NowPlayingListProps {
  nowPlaying: File[];
  onRemoveSong: (index: number) => void;
}

const NowPlayingList: React.FC<NowPlayingListProps> = ({
  nowPlaying,
  onRemoveSong,
}) => {
  if (!nowPlaying.length) {
    return null;
  }

  return (
    <div>
      <h2>Now Playing</h2>
      <ul>
        {nowPlaying.map((file, index) => (
          <li key={index}>
            {file.name}{" "}
            <Button variant="outline" onClick={() => onRemoveSong(index)}>
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NowPlayingList;
