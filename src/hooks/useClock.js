import { useState, useEffect } from 'react';
import { tm } from '../utils/constants.js';

/**
 * Custom hook for managing clock display
 * Updates every 15 seconds
 */
export function useClock() {
  const [clock, setClock] = useState(tm());

  useEffect(() => {
    const interval = setInterval(() => setClock(tm()), 15000);
    return () => clearInterval(interval);
  }, []);

  return clock;
}
