import React from 'react';
import { Button } from '../ui/button';
import { ListMusic } from 'lucide-react';
import { NumberBadge } from '../ui/number-badge';

interface OpenSongListButtonProps {
  onClick: () => void;
  number: number;
}

const OpenPlayingQueueButton: React.FC<OpenSongListButtonProps> = ({ onClick, number }) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="relative"
    >
      <ListMusic className="h-5 w-5" />
      <NumberBadge 
        number={number} 
        className="absolute -top-1 -right-1"
        variant={number === 0 ? 'danger' : 'primary'}
      />
      <span className="sr-only">Toggle queue ({number} tracks)</span>
    </Button>
  )
};

export default OpenPlayingQueueButton;
