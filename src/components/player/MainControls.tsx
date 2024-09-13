// src/components/player/MainControls.tsx
import React, { useState } from "react";
import PlayToggleButton from "@/components/player/buttons/PlayToggleButton";
import { usePlayer } from "@/context/PlayerContext";
import { importDirectory } from "@/utils/directories";
import { snackbar } from "@/components/snackbar/snackbar";
import { getDB } from "@/utils/db/get-db";

import Button from "@/components/Button";
import Icon from "@/components/icon/Icon";

interface MainControlsProps {
  className?: string;
}

const MainControls: React.FC<MainControlsProps> = ({ className }) => {
  // this player is only (right now) used for testing purposes, can probably be removed:
  const player = usePlayer();
  const [tracks, setTracks] = useState([]);

  const onImportTracksHandler = async () => {
    try {
      const directory = await window.showDirectoryPicker({
        mode: "read",
      });

      await importDirectory(directory);

      // Refresh the tracks list after import
      const db = await getDB();
      const updatedTracks: any = await db.getAll("tracks");
      setTracks(updatedTracks);

      snackbar({
        id: "import-success",
        message: "Tracks imported successfully!",
      });
    } catch (error) {
      console.error("Error importing tracks:", error);
      snackbar({
        id: "import-error",
        message: "Error importing tracks. Please try again.",
      });
    }
  };

  return (
    // This is the original return statement:
    // <div className={`flex gap-8px items-center ${className}`}>
    //   <ShuffleButton />
    //   <PlayPrevButton />
    //   <PlayTogglePillButton />
    //   <PlayNextButton />
    //   <RepeatButton />
    // </div>

    <div className="player-controls">
      <div className="flex gap-4">
        {/* <PlayPrevButton className="border-2" /> */}
        <PlayToggleButton className="border-2" />
        {/* <PlayNextButton className="border-2" /> */}
        <button className="border-2" onClick={onImportTracksHandler}>
          Import Tracks
        </button>
        <button
          className="border-2"
          onClick={() => {
            console.log("player", player);
            console.log("tracks", tracks);
          }}
        >
          test
        </button>

        <Button
          kind="toned"
          className="items-center -center border-2"
          onClick={() => {
            player.playTrack(
              0,
              tracks.map((track: any) => track.id),
              {
                shuffle: true,
              }
            );
          }}
        >
          Shuffle <Icon type="shuffle" />
        </Button>
      </div>
    </div>
  );
};

export default MainControls;
