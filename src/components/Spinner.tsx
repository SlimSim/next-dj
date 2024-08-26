import React from 'react';
import { clx } from '@/utils/clx'; // Assuming clx is a utility for class names

interface SpinnerProps {
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ className }) => {
  return (
    <svg
      className={clx('spinner', className)}
      fill="transparent"
      width="40"
      height="40"
      viewBox="0 0 66 66"
    >
      <circle className="path" cx="33" cy="33" r="30" />
    </svg>
  );
};

export default Spinner;