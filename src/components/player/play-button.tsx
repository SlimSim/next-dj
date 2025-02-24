import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Play, Pause } from "lucide-react";
import { usePlayerStore } from "@/lib/store";

interface PlayButtonProps {
  isPlaying: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const PlayButton = ({
  isPlaying,
  onClick,
  disabled = false,
}: PlayButtonProps) => {
  const practiceMode = usePlayerStore((state) => state.practiceMode);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isButtonVisible, setIsButtonVisible] = useState(true);

  // Add new useEffect to handle external play state changes
  useEffect(() => {
    if (!practiceMode && isPlaying && isButtonVisible) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
        setIsButtonVisible(false);
      }, 1000);
    }
  }, [isPlaying, practiceMode]);

  // Keep existing useEffect for handling visibility when stopping
  useEffect(() => {
    if (!practiceMode && !isPlaying && !isButtonVisible) {
      const visibilityTimeout = setTimeout(() => {
        setIsButtonVisible(true);
        // Add a small delay before removing animation class
        const animationTimeout = setTimeout(() => {
          setIsAnimating(false);
        }, 50);

        return () => clearTimeout(animationTimeout);
      }, 200);

      return () => clearTimeout(visibilityTimeout);
    }
  }, [isPlaying, isButtonVisible, practiceMode]);

  const handleClick = () => {
    onClick();
    if (!practiceMode) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
      }, 1000);
    }
  };

  if (!practiceMode && !isButtonVisible) return null;

  return (
    <Button
      variant="default"
      size="icon"
      onClick={handleClick}
      disabled={disabled}
      className={`transition-transform duration-1000 ease-in-out ${
        isAnimating
          ? "transform scale-0 translate-x-11"
          : "transform scale-100 translate-x-0"
      }`}
    >
      {!isPlaying ? (
        <Play className="h-5 w-5" />
      ) : (
        <Pause className="h-5 w-5" />
      )}
      <span className="sr-only">Play / Pause</span>
    </Button>
  );
};
