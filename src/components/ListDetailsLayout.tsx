import React from 'react';
import ScrollContainer from './ScrollContainer';

type LayoutMode = 'both' | 'list' | 'details';

interface ListDetailsLayoutProps {
  mode: LayoutMode;
  list: (mode: LayoutMode) => React.ReactNode;
  details: (mode: LayoutMode) => React.ReactNode;
  className?: string;
  noPlayerOverlayPadding?: boolean;
  noListStableGutter?: boolean;
}

const ListDetailsLayout: React.FC<ListDetailsLayoutProps> = ({
  mode,
  list,
  details,
  className,
  noPlayerOverlayPadding,
  noListStableGutter,
}) => {
  return (
    <div className={`!flex !flex-col ${className}`}>
      <div className="flex h-full grow">
        {mode === 'both' && (
          <ScrollContainer
            className={`overflow-y-auto max-h-100vh shrink-0 sticky top-0 overscroll-contain flex flex-col ${
              !noPlayerOverlayPadding ? 'pb-[var(--bottom-overlay-height)]' : ''
            } ${!noListStableGutter ? 'scrollbar-gutter-stable' : ''}`}
          >
            {list(mode)}
          </ScrollContainer>
        )}
        <div
          className={`w-full grow flex flex-col ${
            !noPlayerOverlayPadding ? 'pb-[var(--bottom-overlay-height)]' : ''
          }`}
        >
          {(mode === 'both' || mode === 'details') && details(mode)}
          {mode === 'list' && list(mode)}
        </div>
      </div>
    </div>
  );
};

export default ListDetailsLayout;