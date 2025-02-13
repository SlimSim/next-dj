'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayerStore } from '@/lib/store';

export function NavigationGuard() {
  const router = useRouter();
  const isPlaying = usePlayerStore((state) => state.isPlaying);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isPlaying) return;
      
      e.preventDefault();
      // Chrome requires returnValue to be set
      e.returnValue = '';
      return '';
    };

    const handlePopState = (e: PopStateEvent) => {
      if (!isPlaying) return;

      // Prevent navigation
      window.history.pushState(null, '', window.location.href);
      
      // Show a warning
      if (window.confirm('Are you sure you want to leave? The music will stop playing.')) {
        // If confirmed, allow navigation
        router.back();
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    // Push initial state
    window.history.pushState(null, '', window.location.href);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router, isPlaying]);

  return null;
}
