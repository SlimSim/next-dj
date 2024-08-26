"use client";

import { useState } from 'react';

export interface SnackbarOptions {
  id: string;
  message: (() => string) | string;
  duration?: number | false;
  controls?: 'spinner' | false;
}

export const useSnackbarItems = () => {
  const [snackbarItems, setSnackbarItems] = useState<SnackbarOptions[]>([]);
  return [snackbarItems, setSnackbarItems] as const;
};