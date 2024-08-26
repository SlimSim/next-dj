// src/components/ui/Separator.tsx
import React from 'react';
import classNames from 'classnames';

interface SeparatorProps {
  vertical?: boolean;
  className?: string;
}

const Separator: React.FC<SeparatorProps> = ({ vertical, className }) => {
  return (
    <div
      role="separator"
      className={classNames(
        className,
        'border-outlineVariant shrink-0 self-stretch',
        vertical ? 'w-0 border-r' : 'h-0 border-b'
      )}
    />
  );
};

export default Separator;