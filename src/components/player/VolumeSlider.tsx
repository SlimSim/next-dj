// src/components/player/VolumeSlider.tsx
import React from 'react';
import Slider from '../Slider';
import { usePlayer } from '../../context/PlayerContext';

const VolumeSlider: React.FC = () => {
  const player = usePlayer();

  return <Slider value={player.volume} onChange={(value) => player.setVolume(value)} />;
};

export default VolumeSlider;