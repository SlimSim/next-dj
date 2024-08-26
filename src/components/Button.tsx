import React from 'react';

type AllowedButtonElement = 'button' | 'a';
type ButtonKind = 'filled' | 'toned' | 'outlined' | 'flat' | 'blank';

interface ButtonProps {
  as?: AllowedButtonElement;
  kind?: ButtonKind;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  href?: string;
  className?: string;
  title?: string;
  tabIndex?: number;
  ariaLabel?: string;
  tooltip?: string;
  children?: React.ReactNode;
  onClick?: (event: React.MouseEvent) => void;
}

const Button: React.FC<ButtonProps> = ({
  as = 'button',
  kind = 'filled',
  disabled = false,
  href,
  type = 'button',
  children,
  ariaLabel,
  tooltip,
  className,
  onClick,
  ...restProps
}) => {
  const KIND_CLASS_MAP = {
    filled: 'filled-button',
    toned: 'tonal-button',
    outlined: 'outlined-button',
    flat: 'flat-button',
  };

  const Element = disabled ? 'button' : as;

  return (
    <Element
      {...restProps}
      type={type}
      aria-label={ariaLabel}
      href={href}
      disabled={disabled}
      className={`${
        kind === 'blank' ? 'interactable' : `base-button px-24px ${KIND_CLASS_MAP[kind]}`
      } ${className} ${disabled ? '!cursor-default' : ''}`}
      onClick={onClick}
      title={tooltip}
    >
      {children}
    </Element>
  );
};

export default Button;