import React from 'react';
import { Button } from '../ui/button';
import { MoreVertical } from 'lucide-react';

interface OpenPlayerControlsProps {
  onClick: () => void;
}

const OpenPlayerControlsButton: React.FC<OpenPlayerControlsProps> = ({ onClick }) => {

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="relative"
    >
      <MoreVertical className="h-5 w-5" />
      <span className="sr-only">Open player controls</span>
    </Button>
  )

};

export default OpenPlayerControlsButton;
