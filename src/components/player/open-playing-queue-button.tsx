import React from "react";
import { Button } from "../ui/button";
import { ListMusic } from "lucide-react";
import { NumberBadge } from "../ui/number-badge";
import { cn } from "@/lib/utils/common";

interface OpenSongListButtonProps {
  onClick: () => void;
  number: number;
  isOpen?: boolean;
}

const OpenPlayingQueueButton: React.FC<OpenSongListButtonProps> = ({
  onClick,
  number,
  isOpen = false,
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
      <ListMusic className="h-5 w-5" />
      <NumberBadge
        number={number}
        className="absolute -top-1 -right-1"
        tooltip={`There are ${number} tracks after this one in the queue`}
        variant={number === 0 ? "danger" : "primary"}
      />
      <span className="sr-only">Toggle queue ({number} tracks)</span>
    </Button>
  );
};

export default OpenPlayingQueueButton;
