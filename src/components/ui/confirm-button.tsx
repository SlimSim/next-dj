import React, { useState } from "react";
import { Button, ButtonProps } from "./button";
import { HelpCircle } from "lucide-react";

type ConfirmPosition = "top" | "inline" | "bottom" | "left" | "right";

export interface ConfirmButtonProps extends ButtonProps {
  confirmText?: React.ReactNode;
  children: React.ReactNode;
  disableConfirm?: boolean;
  confirmPosition?: ConfirmPosition;
}

const ConfirmButton = React.forwardRef<HTMLButtonElement, ConfirmButtonProps>(
  (
    {
      onClick,
      children,
      disableConfirm = false,
      confirmPosition = "top",
      confirmText = (
        <div
          className="flex items-center text-center w-fit gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          <span>Click again to confirm</span>
        </div>
      ),
      className,
      ...props
    },
    ref
  ) => {
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (disableConfirm || isConfirmed) {
        setIsConfirmed(false);
        setShowTooltip(false);
        onClick?.(event);
      } else {
        setIsConfirmed(true);
        if (confirmPosition !== "inline") {
          setShowTooltip(true);
        }
      }
    };

    // Reset confirmation state when mouse leaves the button
    const handleMouseLeave = () => {
      setIsConfirmed(false);
      setShowTooltip(false);
    };

    if (confirmPosition === "inline") {
      return (
        <Button
          {...props}
          ref={ref}
          onClick={handleClick}
          onMouseLeave={handleMouseLeave}
          className={`transition-all duration-200 ${className || ""}`}
        >
          {isConfirmed ? confirmText : children}
        </Button>
      );
    }

    // Determine position classes based on confirmPosition
    let positionClasses = "";
    
    switch (confirmPosition) {
      case "top":
        positionClasses = "bottom-full top-auto left-1/2 -translate-x-1/2";
        break;
      case "bottom":
        positionClasses = "top-full bottom-auto left-1/2 -translate-x-1/2";
        break;
      case "left":
        positionClasses = "right-full left-auto top-1/2 -translate-y-1/2";
        break;
      case "right":
        positionClasses = "left-full right-auto top-1/2 -translate-y-1/2";
        break;
      default:
        positionClasses = "bottom-full top-auto left-1/2 -translate-x-1/2";
    }

    return (
      <div
        style={{
          position: "relative",
          display: "inline-block",
          width: "fit-content",
        }}
      >
        <Button
          {...props}
          ref={ref}
          onClick={handleClick}
          onMouseLeave={handleMouseLeave}
          className={`transition-all duration-200 ${className || ""}`}
        >
          {children}
        </Button>
        {showTooltip && (
          <div className={`tooltip flex flex-col absolute ${positionClasses} z-100 bg-black bg-opacity-70 text-white rounded-md p-2 gap-2`}>
            {confirmText}
          </div>
        )}
      </div>
    );
  }
);

ConfirmButton.displayName = "ConfirmButton";

export { ConfirmButton };
