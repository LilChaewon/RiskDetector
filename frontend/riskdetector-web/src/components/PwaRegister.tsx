'use client';

import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        await registration.update();
      } catch (err) {
        console.warn('Service worker registration failed:', err);
      }
    };

    window.addEventListener('load', registerServiceWorker);
    return () => {
      window.removeEventListener('load', registerServiceWorker);
    };
  }, []);

  return null;
}
