"use client";

import React, { useState, useEffect } from "react";
import { PlayerProvider, usePlayer } from "@/context/PlayerContext";
import PlayToggleButton from "@/components/player/buttons/PlayToggleButton";
import PlayNextButton from "@/components/player/buttons/PlayNextButton";
import PlayPrevButton from "@/components/player/buttons/PlayPrevButton";
import { checkNewDirectoryStatus, importDirectory } from "@/utils/directories";
import { snackbar } from "@/components/snackbar/snackbar";
import { getDB } from "@/utils/db/get-db";
import TracksListContainer from "@/components/tracks/TracksListContainer";

import Button from "@/components/Button";
import Icon from "@/components/icon/Icon";

const PlayerControls: React.FC = () => {
  const player = usePlayer();
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    const fetchTracks = async () => {
      const db = await getDB();
      const allTracks: any = await db.getAll("tracks");
      setTracks(allTracks);
    };

    fetchTracks();
  }, []);

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
    <div className="player-controls">
      <p>
        Så, denna funkar o listar låtarna! (och sparar dom mellan
        sidladdningar!)
      </p>
      <p>
        Men nu när jag spelar en låt kan jag
        <br /> 1) inte pausa den
        <br /> 2) försöker jag byta låt spelar den båda samtidigt...
      </p>

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
      <TracksListContainer items={tracks} />
    </div>
  );
};

const HomePage: React.FC = () => {
  return (
    <PlayerProvider>
      <div className="home-page">
        <h1>Welcome to Next-DJ</h1>
        <PlayerControls />
      </div>
    </PlayerProvider>
  );
};

export default HomePage;
