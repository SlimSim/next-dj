import React from 'react';

interface ProgressIndicatorProps {
  value: number;
  max: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ value, max }) => {

  return (
    <div className="h-1 bg-muted">
        <div 
            className="h-full bg-primary transition-all duration-200"
            style={{ width: `${(value / max) * 100 || 0}%` }}
        />
    </div>
  )

};

export default ProgressIndicator;
