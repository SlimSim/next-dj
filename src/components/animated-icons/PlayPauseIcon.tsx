import React from 'react';

interface PlayPauseIconProps {
  playing?: boolean;
}

const PlayPauseIcon: React.FC<PlayPauseIconProps> = ({ playing = false }) => {
  return (
    <div className={`w-24px h-24px relative z-1 play-icon ${playing ? 'rotate-90 playing' : ''}`}>
      <div className="play-bar"></div>
      <div className="play-bar flip-y"></div>
    </div>
  );
};

export default PlayPauseIcon;