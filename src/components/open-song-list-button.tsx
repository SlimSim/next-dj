import React from 'react';
import { Button } from './ui/button';
import { ListMusic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OpenSongListButtonProps {
  onClick: () => void;
  number: number;
}

const OpenSongListButton: React.FC<OpenSongListButtonProps> = ({ onClick, number }) => {

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="relative"
    >
      <ListMusic className="h-5 w-5" />
      <span className={cn(
        "absolute -top-1 -right-1 h-4 w-4 rounded-full text-[10px] font-medium flex items-center justify-center leading-none",
        number === 0 
          ? "bg-red-500 text-white dark:bg-red-600" 
          : "bg-primary text-primary-foreground"
      )}>
        {number}
      </span>
      <span className="sr-only">Toggle queue ({number} tracks)</span>
    </Button>
  )

};

export default OpenSongListButton;
