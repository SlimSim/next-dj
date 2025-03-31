'use client';

import { useEffect } from 'react';

// Add Workbox type to the Window interface
declare global {
  interface Window {
    workbox: any;
  }
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.workbox !== undefined
    ) {
      const registerServiceWorker = async () => {
        try {
          // Register the service worker
          const registration = await navigator.serviceWorker.register('/sw.js', { 
            scope: '/' 
          });
          console.log('Service Worker registered with scope:', registration.scope);
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      };

      // Wait for the page to load before registering
      window.addEventListener('load', () => {
        registerServiceWorker();
      });
    } else {
      console.log('Service Worker is not supported in this browser or environment');
    }
  }, []);

  return null;
}
