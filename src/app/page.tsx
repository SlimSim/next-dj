"use client";

import React, { useState, useEffect } from "react";
import { PlayerProvider } from "@/context/PlayerContext";
import { getDB } from "@/utils/db/get-db";
import TracksListContainer from "@/components/tracks/TracksListContainer";

import MainControls from "@/components/player/MainControls";

const PlayerControls: React.FC = () => {
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    const fetchTracks = async () => {
      const db = await getDB();
      const allTracks: any = await db.getAll("tracks");
      setTracks(allTracks);
    };

    fetchTracks();
  }, []);

  return (
    <>
      <p>
        Så, denna funkar o listar låtarna! (och sparar dom mellan sidladdningar!
        <i> (men var är dup??)</i>)
      </p>
      <p>
        What to fix now???
        <ul>
          <li>-</li>
          <li>-</li>
        </ul>
      </p>
      <MainControls />
      <TracksListContainer items={tracks} />
    </>
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
