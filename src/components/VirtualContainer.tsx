"use client";

import React, { useRef, useState } from "react";
import { useVirtualizer, VirtualItem } from "@tanstack/react-virtual";

interface VirtualContainerProps {
  count: number;
  lanes?: number;
  size: number;
  gap?: number;
  offsetWidth?: number;
  keyExtractor: (index: number) => string | number;
  children: (virtualItem: VirtualItem) => React.ReactNode;
}

const VirtualContainer: React.FC<VirtualContainerProps> = ({
  count,
  lanes = 1,
  size: itemSize,
  gap = 0,
  keyExtractor,
  children,
  offsetWidth = 0,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [focusIndex, setFocusIndex] = useState(-1);

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => containerRef.current,
    estimateSize: () => itemSize,
    overscan: 10,
    rangeExtractor: (range) => {
      const start = Math.max(range.startIndex - range.overscan, 0);
      const initialEnd = range.endIndex + range.overscan;

      const arr = [];

      if (focusIndex !== -1 && focusIndex < start) {
        arr.push(focusIndex);
      }

      const end = Math.min(initialEnd, range.count - 1);
      for (let i = start; i <= end; i += 1) {
        arr.push(i);
      }

      if (focusIndex !== -1 && focusIndex > initialEnd) {
        arr.push(focusIndex);
      }

      return arr;
    },
  });

  const findRow = (index: number) => {
    if (!containerRef.current) return null;
    return containerRef.current.querySelector(
      `[aria-rowindex="${index}"]`
    ) as HTMLElement;
  };

  const findCurrentFocusedRow = () => {
    if (!containerRef.current) return -1;
    const el = document.activeElement;
    return el ? Number(el.getAttribute("aria-rowindex")) : -1;
  };

  const keydownHandler = (e: React.KeyboardEvent) => {
    let directionDown: boolean | undefined;
    if (e.key === "ArrowDown") {
      directionDown = true;
    } else if (e.key === "ArrowUp") {
      directionDown = false;
    }

    if (directionDown === undefined) {
      return;
    }

    e.preventDefault();

    const increment = directionDown ? 1 : -1;
    const currentIndex = findCurrentFocusedRow();

    const nextIndex = currentIndex + increment;
    if (nextIndex >= 0 && nextIndex < count) {
      virtualizer.scrollToIndex(currentIndex, {
        behavior: "smooth",
      });

      requestAnimationFrame(() => {
        findRow(nextIndex)?.focus();
      });
    }
  };

  const focusinHandler = () => {
    const index = findCurrentFocusedRow();
    if (index !== -1) {
      setFocusIndex(index);
    }
  };

  const focusoutHandler = () => {
    requestAnimationFrame(() => {
      const index = findCurrentFocusedRow();
      if (index === -1) {
        setFocusIndex(-1);
      }
    });
  };

  return (
    <div
      ref={containerRef}
      role="grid"
      aria-rowcount={count}
      style={{ height: `${virtualizer.getTotalSize() - gap}px` }}
      className="contain-strict relative w-full rounded-8px outline-offset--2px"
      tabIndex={0}
      onFocus={focusinHandler}
      onBlur={focusoutHandler}
      onKeyDown={keydownHandler}
    >
      {virtualizer.getVirtualItems().map((virtualItem: VirtualItem) => (
        <React.Fragment key={keyExtractor(virtualItem.index)}>
          {children(virtualItem)}
        </React.Fragment>
      ))}
    </div>
  );
};

export default VirtualContainer;
