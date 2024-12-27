import React from 'react';
import { ConfirmButton, ConfirmButtonProps } from './confirm-button';
import { Button } from './button';

interface ConfirmToggleButtonProps extends ConfirmButtonProps {
  isToggled: boolean;
  onToggle: () => void;
  toggledIcon: React.ReactNode;
}

const ConfirmToggleButton: React.FC<ConfirmToggleButtonProps> = ({
  toggledIcon,
  isToggled,
  onToggle,
  disabled,
  className,
  variant,
  children
}) => {
  return (
    <>
      {isToggled ? (
        <ConfirmButton
          onClick={onToggle} 
          className={className}
          variant={variant}
          disabled={disabled}
        >
          {toggledIcon}
        </ConfirmButton>
      ) : (
        <Button
          onClick={onToggle} 
          className={className}
          variant={variant}
          disabled={disabled}
        >
          {children}
        </Button>
      )}
    </>
  );
};

export default ConfirmToggleButton;
