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
  size,
  children,
  disableConfirm,
  ...props
}) => {
  return (
    <>
      {isToggled ? (
        <ConfirmButton
          onClick={onToggle} 
          className={className}
          variant={variant}
          size={size}
          disabled={disabled}
          disableConfirm={disableConfirm}
          {...props}
        >
          {toggledIcon}
        </ConfirmButton>
      ) : (
        <Button
          onClick={onToggle} 
          className={className}
          variant={variant}
          size={size}
          disabled={disabled}
          {...props}
        >
          {children}
        </Button>
      )}
    </>
  );
};

export default ConfirmToggleButton;
