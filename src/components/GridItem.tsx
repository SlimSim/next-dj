import React from 'react';
import Artwork from './Artwork';

interface GridItemProps {
  artwork?: Blob;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  tabIndex?: number;
  role?: string;
  dataIndex?: number;
  onClick?: (e: React.MouseEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

const GridItem: React.FC<GridItemProps> = ({
  artwork,
  className,
  children,
  ...props
}) => {
  const artworkSrc = URL.createObjectURL(artwork);

  return (
    <div
      {...props}
      className={`flex flex-col interactable rounded-8px bg-surfaceContainerHigh ${className}`}
    >
      <Artwork src={artworkSrc} fallbackIcon="person" className="rounded-inherit w-full" />
      <div className="flex flex-col items-center overflow-hidden">{children}</div>
    </div>
  );
};

export default GridItem;