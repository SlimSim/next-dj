// src/components/ui/ScrollContainer.tsx
import React, { createContext, useContext, useRef, ReactNode } from "react";

type ScrollTargetElement = Element | Window | null;

const ScrollTargetContext = createContext<ScrollTargetElement>(window);

export const useScrollTarget = () => {
  const context = useContext(ScrollTargetContext);
  if (!context) {
    throw new Error(
      "useScrollTarget must be used within a ScrollTargetProvider"
    );
  }
  return context;
};

interface ScrollContainerProps {
  className?: string;
  children: ReactNode;
}

const ScrollContainer: React.FC<ScrollContainerProps> = ({
  className,
  children,
}) => {
  const scrollTargetRef = useRef<HTMLDivElement | null>(null);

  return (
    <ScrollTargetContext.Provider value={scrollTargetRef.current}>
      <div ref={scrollTargetRef} className={className}>
        {children}
      </div>
    </ScrollTargetContext.Provider>
  );
};

export default ScrollContainer;
