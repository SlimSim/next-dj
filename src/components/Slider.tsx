"use client";

// src/components/ui/Slider.tsx
import React, { useState, useEffect, useRef } from "react";
import { clamp } from "@/utils/clamp";

interface SliderProps {
  min?: number;
  max?: number;
  value: number;
  disabled?: boolean;
  onSeekStart?: () => void;
  onSeekEnd?: () => void;
  onChange?: (value: number) => void;
}

const Slider: React.FC<SliderProps> = ({
  min = 0,
  max = 100,
  value,
  disabled,
  onSeekStart,
  onSeekEnd,
  onChange,
}) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sliderRef.current) {
      setTrackWidth(sliderRef.current.clientWidth);
    }
  }, [sliderRef.current]);

  const progressPercentage = ((value || 1) * 100) / max;

  const getValueFromPercentage = (
    percentage: number,
    rangeMin: number,
    rangeMax: number
  ) => {
    return (percentage / 100) * (rangeMax - rangeMin) + rangeMin;
  };

  const getPercentageFromValue = (
    value: number,
    rangeMin: number,
    rangeMax: number
  ) => ((value - rangeMin) / (rangeMax - rangeMin)) * 100;

  const getTrackRange = (
    currentTrackWidth: number,
    trackStart: number,
    trackEnd: number,
    roundedStart: number,
    roundedEnd: number
  ) => {
    const widthPercentage = getPercentageFromValue(
      currentTrackWidth,
      trackStart,
      trackEnd
    );
    const borderValue = getValueFromPercentage(
      widthPercentage,
      roundedStart,
      roundedEnd
    );
    return clamp(Math.round(borderValue), roundedStart, roundedEnd);
  };

  const getBarBorder = () => {
    const currentTrackWidth = getValueFromPercentage(
      progressPercentage,
      0,
      trackWidth
    );
    const start = getTrackRange(currentTrackWidth, 0, 36, 2, 8);
    const end = getTrackRange(
      currentTrackWidth,
      trackWidth,
      trackWidth - 36,
      2,
      8
    );
    return { borderRadius: `${start}px ${end}px ${end}px ${start}px` };
  };

  const getTransform = (calc = "") => ({
    transform: `translateX(calc(${progressPercentage}% ${calc}))`,
  });

  return (
    <div className="flex w-full relative select-none" ref={sliderRef}>
      <input
        type="range"
        value={value}
        disabled={disabled}
        min={min}
        max={max}
        className="h-44px opacity-0 appearance-none disabled:cursor-auto grow w-full"
        onMouseDown={onSeekStart}
        onMouseUp={onSeekEnd}
        onChange={(e) => onChange?.(parseInt(e.target.value))}
      />
      <div
        className="absolute h-full left-0 top-0 w-[calc(100%-4px)] pointer-events-none mr-8px"
        style={getTransform()}
      >
        <div className="thumb h-full w-4px transition-transform bg-primary rounded-8px"></div>
      </div>
      <div
        className="w-[calc(100%-4px)] contain-strict overflow-clip absolute h-16px my-auto inset-0 pointer-events-none transition-border-radius duration-100ms mr-8px"
        style={getBarBorder()}
      >
        <div
          className="absolute -left-full rounded-r-2px inset-y-0 w-full h-16px my-auto bg-primary"
          style={getTransform("- 6px")}
        ></div>
        <div
          className="absolute left-0 top-0 rounded-l-2px w-full bg-primary/30 h-full pointer-events-none"
          style={getTransform("+ 10px")}
        ></div>
      </div>
    </div>
  );
};

export default Slider;
