// components/tracks/TracksListContainer.tsx
import React from "react";
import { usePlayer } from "@/context/PlayerContext";

interface Track {
  id: number;
  name: string;
  artists: string[];
  duration: number;
}

interface TracksListContainerProps {
  items: Track[];
}

const TracksListContainer: React.FC<TracksListContainerProps> = ({ items }) => {
  const player = usePlayer();

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="tracks-list-container">
      {items.map((track, index) => (
        <div
          key={track.id}
          className="track-item flex justify-between items-center p-2 hover:bg-gray-100 cursor-pointer"
          onClick={() =>
            player.playTrack(
              index,
              items.map((item) => item.id)
            )
          }
        >
          <div>
            <div className="font-bold">{track.name}</div>
            <div className="text-sm text-gray-600">
              {track.artists.join(", ")}
            </div>
          </div>
          <div>{formatDuration(track.duration)}</div>
        </div>
      ))}
    </div>
  );
};

export default TracksListContainer;
