"use client";

import React, { useEffect, useState } from "react";

export interface DialogProps {
  open: boolean;
  title?: string;
  icon?: React.ReactNode;
  className?: string;
  onClose?: () => void; // Add onClose to the interface
  children?: React.ReactNode;
}

const Dialog = ({
  open,
  title,
  icon,
  className,
  onClose,
  children,
}: DialogProps) => {
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const close = () => {
    setIsOpen(false);
    if (onClose) onClose(); // Call onClose if it's defined
  };

  return isOpen ? (
    <dialog
      className={`focus:outline-none flex select-none flex-col rounded-24px bg-surfaceContainerHigh text-onSurface ${className}`}
    >
      <header
        className={`flex flex-col gap-4 px-6 pt-6 ${icon ? "items-center justify-center text-center" : ""}`}
      >
        {icon && <div className="text-secondary">{icon}</div>}
        {title && <h1 className="text-headline-sm">{title}</h1>}
      </header>
      <div className="flex flex-col shrink overflow-hidden">{children}</div>
    </dialog>
  ) : null;
};

export default Dialog;
