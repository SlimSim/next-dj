import React from 'react';
import { Slider } from "@/components/ui/slider";

interface ProgressIndicatorProps {
  value: number;
  max: number;
  isInteractive?: boolean;
  onValueChange?: (value: number) => void;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ 
  value, 
  max, 
  isInteractive = false,
  onValueChange 
}) => {
  if (isInteractive && onValueChange) {
    return (
      <Slider
        value={[value]}
        min={0}
        max={max}
        step={1}
        onValueChange={([newValue]) => onValueChange(newValue)}
        className="h-1 z-10"
        disabled={!max}
      />
    );
  }

  return (
    <div className="h-1 bg-muted">
      <div 
        className="h-full bg-primary transition-all duration-200"
        style={{ width: `${(value / max) * 100 || 0}%` }}
      />
    </div>
  );
};

export default ProgressIndicator;
