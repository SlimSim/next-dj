import React, { useState } from "react";
import { Button, ButtonProps } from "./button";
import { HelpCircle } from "lucide-react";

export interface ConfirmButtonProps extends ButtonProps {
  confirmText?: React.ReactNode;
  children: React.ReactNode;
  disableConfirm?: boolean;
}

const ConfirmButton = React.forwardRef<HTMLButtonElement, ConfirmButtonProps>(
  (
    {
      onClick,
      children,
      disableConfirm = false,
      confirmText = (
        <div
          className="flex items-center text-center w-fit flex-col gap-2"
          style={{
            minWidth: "100px",
          }}
        >
          <HelpCircle className="h-6 w-6" />
          Click again to confirm
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
        setShowTooltip(true);
        setIsConfirmed(true);
      }
    };

    // Reset confirmation state when mouse leaves the button
    const handleMouseLeave = () => {
      setShowTooltip(false);
      setIsConfirmed(false);
    };

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
          <div className="tooltip flex flex-col absolute bottom-full left-1/2 transform -translate-x-1/2 z-100 bg-black bg-opacity-70 text-white rounded-md p-2 gap-2">
            {confirmText}
          </div>
        )}
      </div>
    );
  }
);

ConfirmButton.displayName = "ConfirmButton";

export { ConfirmButton };
