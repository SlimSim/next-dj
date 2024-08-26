"use client";

// components/SongPlayer.tsx

import { useEffect, useState } from "react";

interface SongPlayerProps {
  file: File;
}

const SongPlayer = ({ file }: SongPlayerProps) => {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);

  useEffect(() => {
    const objectURL = URL.createObjectURL(file);
    setAudioSrc(objectURL);

    return () => {
      URL.revokeObjectURL(objectURL);
    };
  }, [file]);

  return <div>{audioSrc && <audio controls src={audioSrc} />}</div>;
};

export default SongPlayer;
