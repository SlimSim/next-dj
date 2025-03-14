import { useEffect, useState } from "react";
import ConfirmToggleButton from "../ui/confirm-toggle-button";
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
  const isControlsMenuVisible = usePlayerStore((state) => state.isControlsMenuVisible);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isButtonVisible, setIsButtonVisible] = useState(true);

  // Add new useEffect to handle external play state changes
  useEffect(() => {
    if (!practiceMode && !isControlsMenuVisible && isPlaying && isButtonVisible) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
        setIsButtonVisible(false);
      }, 1000);
    }
  }, [isPlaying, practiceMode, isControlsMenuVisible]);

  // Keep existing useEffect for handling visibility when stopping
  useEffect(() => {
    if (!practiceMode && !isControlsMenuVisible && !isPlaying && !isButtonVisible) {
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
  }, [isPlaying, isButtonVisible, practiceMode, isControlsMenuVisible]);

  const handleClick = () => {
    onClick();
    if (!practiceMode && !isControlsMenuVisible) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
      }, 1000);
    }
  };

  if (!practiceMode && !isControlsMenuVisible && !isButtonVisible) return null;

  return (
    <div
      className={`transition-transform duration-1000 ease-in-out ${
        isAnimating
          ? "transform scale-0 translate-x-11"
          : "transform scale-100 translate-x-0"
      }`}
    >
      <ConfirmToggleButton
        isToggled={isPlaying}
        onToggle={handleClick}
        disableConfirm={practiceMode}
        disabled={disabled}
        variant="default"
        size="icon"
        toggledIcon={<><Pause className="h-5 w-5" /><span className="sr-only">Pause</span></>}
      >
        <Play className="h-5 w-5" />
        <span className="sr-only">Play</span>
      </ConfirmToggleButton>
    </div>
  );
};
