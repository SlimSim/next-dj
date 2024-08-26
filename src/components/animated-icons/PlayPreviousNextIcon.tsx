"use client";

import React, { useState, useEffect } from "react";

interface PlayPreviousNextIconProps {
  type: "next" | "previous";
}

const PlayPreviousNextIcon: React.FC<PlayPreviousNextIconProps> = ({
  type,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const animate = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
    }, 200);
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const button = event.currentTarget.closest("button");
    if (button && !button.disabled) {
      animate();
    }
  };

  return (
    <div
      className={`grid ${type === "previous" ? "flip-x" : ""}`}
      data-icon-animating={isAnimating ? "" : undefined}
      onClick={handleClick}
    >
      <div className="icon-clip grid-area-[1/1]">
        <svg className="fill-current size-24px" viewBox="0 0 24 24">
          <path
            className="skip-top"
            d="M 6,18 14.5,12 6,6 M 8,9.86 11.03,12 8,14.14"
          />
          <path
            className="skip-bottom invisible"
            d="M 6,18 14.5,12 6,6 M 8,9.86 11.03,12 8,14.14"
          />
        </svg>
      </div>
      <svg
        className="fill-current size-24px grid-area-[1/1]"
        viewBox="0 0 24 24"
      >
        <path d="M16,6L16,18L18,18L18,6L16,6Z" />
      </svg>
    </div>
  );
};

export default PlayPreviousNextIcon;
