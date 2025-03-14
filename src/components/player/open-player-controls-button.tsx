import React from 'react';
import { Button } from '../ui/button';
import { MoreVertical } from 'lucide-react';
import { cn } from "@/lib/utils/common";

interface OpenPlayerControlsProps {
  onClick: () => void;
  isOpen?: boolean;
}

const OpenPlayerControlsButton: React.FC<OpenPlayerControlsProps> = ({ 
  onClick,
  isOpen = false 
}) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn(
        "relative transition-colors",
        isOpen && "bg-accent"
      )}
    >
      <MoreVertical className="h-5 w-5" />
      <span className="sr-only">Open player controls</span>
    </Button>
  )
};

export default OpenPlayerControlsButton;
