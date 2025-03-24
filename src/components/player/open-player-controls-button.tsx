import React from 'react';
import { Button } from '../ui/button';
import { cn } from "@/lib/utils/common";

interface OpenPlayerControlsProps {
  onClick: () => void;
  isOpen?: boolean;
}

const CustomControlsIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
    viewBox="0 0 20 20" 
    fill="none" 
    stroke="currentColor" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    {/* First row - 5 vertical lines, extended upwards and wider */}
    <line x1="1" y1="1" x2="1" y2="7" strokeWidth="1" />
    <line x1="5.5" y1="1" x2="5.5" y2="7" strokeWidth="1" />
    <line x1="10" y1="1" x2="10" y2="7" strokeWidth="1" />
    <line x1="14.5" y1="1" x2="14.5" y2="7" strokeWidth="1" />
    <line x1="19" y1="1" x2="19" y2="7" strokeWidth="1" />
    
    {/* Second row - 1 horizontal line, pushed down further and wider */}
    <line x1="1" y1="11" x2="19" y2="11" strokeWidth="1" />
    
    {/* Third row - 2 triangles pointing outwards, moved further down with vertical lines, narrower */}
    {/* Left triangle with vertical line */}
    <polygon points="7,17 9,15 9,19" fill="none" stroke="currentColor" strokeWidth="0.5" />
    <line x1="6" y1="15" x2="6" y2="19" strokeWidth="0.5" />
    
    {/* Right triangle with vertical line */}
    <polygon points="13,17 11,15 11,19" fill="none" stroke="currentColor" strokeWidth="0.5" />
    <line x1="14" y1="15" x2="14" y2="19" strokeWidth="0.5" />
  </svg>
);

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
      <CustomControlsIcon />
      <span className="sr-only">Open player controls</span>
    </Button>
  )
};

export default OpenPlayerControlsButton;
