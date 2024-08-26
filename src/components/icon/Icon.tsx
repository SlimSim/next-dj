import React from 'react';
import { clx } from '../../utils/clx'; // Assuming you have a clx utility
import { ICON_PATHS } from './icon-paths'; // Assuming you have icon paths defined

export type IconType = keyof typeof ICON_PATHS;

interface IconProps {
  type: IconType;
  className?: string;
}

const Icon: React.FC<IconProps> = ({ type, className }) => {
  return (
    <svg
      role="presentation"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      className={clx('fill-current pointer-events-none shrink-0', className)}
    >
      <path d={ICON_PATHS[type]} />
    </svg>
  );
};

export default Icon;