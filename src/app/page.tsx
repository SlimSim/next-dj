"use client";

import React from "react";
import { PlayerProvider, usePlayer } from "@/context/PlayerContext";
import PlayToggleButton from "@/components/player/buttons/PlayTobbleButton";
import PlayNextButton from "@/components/player/buttons/PlayNextButton";
import PlayPrevButton from "@/components/player/buttons/PlayPrevButton";
import { handleClientScriptLoad } from "next/script";
// Import other components as needed

const PlayerControls: React.FC = () => {
  // const { playing, togglePlay, playNext, playPrev } = usePlayer();

  const onImportTracksHandler = async () => {
    console.log("onImportTracksHandler->");

    //  todo: SÅ, jag attakerar problemet på ett annat sätt, bara koppiera över allt från knappen import tracks o se vad jag behöver :D
    const directory = await showDirectoryPicker({
      // startIn: 'music',
      mode: "read",
    });

    // Jag skulle ju också kunna göra ett helt nytt projekt... ???

    // // // TODO. Testing stuff
    // // if (window) {
    // // 	return await importDirectory(directory)
    // // }

    // let data: Awaited<ReturnType<typeof checkNewDirectoryStatus>> | undefined;
    // for (const existingDir of directories) {
    //   const result = await checkNewDirectoryStatus(existingDir, directory);

    //   if (result) {
    //     data = result;
    //     break;
    //   }
    // }

    // if (!data) {
    //   await importDirectory(directory);

    //   return;
    // }

    // const { status, existingDir, newDirHandle } = data;

    // const existingDirName = existingDir.handle.name;
    // const newDirName = newDirHandle.name;

    // if (status === "existing") {
    //   snackbar({
    //     id: "directory-already-included",
    //     message: `Directory '${directory.name}' is already included`,
    //   });

    //   return;
    // }

    // if (status === "child") {
    //   snackbar({
    //     id: "directory-added",
    //     message: m.directoryIsIncludedInParent({
    //       existingDir: existingDirName,
    //       newDir: newDirName,
    //     }),
    //   });

    //   return;
    // }

    // reparentDirectory = {
    //   existingDir,
    //   newDirHandle,
    // };
    // };

    return (
      <div className="player-controls">
        <p>hej</p>
        <PlayPrevButton />
        <PlayToggleButton />
        <PlayNextButton />
        {/* Add other controls like volume, timeline, etc. */}
        <button onClick={onImportTracksHandler}>Import Tracks</button>
      </div>
    );
  };
  return (
    <div className="player-controls">
      <p>hej</p>
      <PlayPrevButton />
      <PlayToggleButton />
      <PlayNextButton />
      {/* Add other controls like volume, timeline, etc. */}
      <button onClick={onImportTracksHandler}>Import Tracks</button>
    </div>
  );
};

const HomePage: React.FC = () => {
  return (
    <PlayerProvider>
      <div className="home-page">
        <h1>Welcome to Next-DJ</h1>
        <PlayerControls />
        {/* Add more components or content as needed */}
        <h1>Welcome to Next-DJ2</h1>
      </div>
    </PlayerProvider>
  );
};

export default HomePage;
