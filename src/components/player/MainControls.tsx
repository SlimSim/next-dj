// src/components/player/MainControls.tsx
import React from 'react';
import PlayNextButton from './buttons/PlayNextButton';
import PlayPrevButton from './buttons/PlayPrevButton';
import PlayTogglePillButton from './buttons/PlayTogglePillButton';
import RepeatButton from './buttons/RepeatButton';
import ShuffleButton from './buttons/ShuffleButton';

interface MainControlsProps {
  className?: string;
}

const MainControls: React.FC<MainControlsProps> = ({ className }) => {
  return (
    <div className={`flex gap-8px items-center ${className}`}>
      <ShuffleButton />
      <PlayPrevButton />
      <PlayTogglePillButton />
      <PlayNextButton />
      <RepeatButton />
    </div>
  );
};

export default MainControls;