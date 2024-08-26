import React, { useEffect } from 'react';

interface SnackbarData {
  id: string;
  message: (() => string) | string;
  duration?: number | false;
  controls?: 'spinner' | false;
}

interface SnackbarProps extends SnackbarData {
  onDismiss: (id: string) => void;
}

const Snackbar: React.FC<SnackbarProps> = ({ id, message, duration = 6000, onDismiss }) => {
  useEffect(() => {
    if (!duration) return;

    const timeoutId = window.setTimeout(() => onDismiss(id), duration);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [id, duration, onDismiss]);

  return (
    <div className="bg-inverseSurface text-inverseOnSurface rounded-8px gap-8px flex items-center pr-6px pl-16px py-6px">
      <div className="min-h-12px py-8px">{typeof message === 'function' ? message() : message}</div>
    </div>
  );
};

export default Snackbar;