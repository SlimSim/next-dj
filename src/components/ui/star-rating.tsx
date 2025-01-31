import React from "react";

interface StarRatingProps {
  className?: string;
  fillLevel: number;
}

export function StarRating({ className = "", fillLevel: ratingValue }: StarRatingProps) {
  // Calculate the actual fill level based on the rating thresholds
  const getFillPercentage = (rating: number) => {
    if (rating <= 0.2) return 0;
    if (rating <= 0.4) return 0.4; // quarter fill
    if (rating <= 0.6) return 0.5; // half fill
    if (rating <= 0.8) return 0.65; // three-quarter fill
    return 1; // full fill
  };

  const actualFillLevel = getFillPercentage(ratingValue);

  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <defs>
        <linearGradient
          id={`starFill-${ratingValue}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop
            offset={`${actualFillLevel * 100}%`}
            style={{ stopColor: "currentColor", stopOpacity: 1 }}
          />
          <stop
            offset={`${actualFillLevel * 100}%`}
            style={{ stopColor: "currentColor", stopOpacity: 0 }}
          />
        </linearGradient>
      </defs>
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={`url(#starFill-${ratingValue})`}
      />
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke="currentColor"
        fill="none"
      />
      {ratingValue === 0 && (
        <line
          x1="2"
          y1="22"
          x2="22"
          y2="2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      )}
    </svg>
  );
}
