// src/components/pwa/AvailableSongs.tsx
import React from "react";

interface AvailableSongsProps {
  files: File[];
}

const AvailableSongs: React.FC<AvailableSongsProps> = ({ files }) => {
  return (
    <ul>
      {files.map((file, index) => (
        <li key={index}>
          {file.name} ({file.type})
        </li>
      ))}
    </ul>
  );
};

export default AvailableSongs;
