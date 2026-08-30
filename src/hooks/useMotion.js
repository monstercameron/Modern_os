import { useEffect, useMemo, useState } from 'react';
import { resolveMotion } from '../services/theme.js';
import { useTheme } from '../ThemeContext.jsx';

/**
 * The current motion settings, resolved against the OS reduce-motion
 * preference. Components ask this for durations, springs and whether a
 * particular effect is allowed rather than hardcoding transitions.
 *
 *   const motion = useMotion();
 *   <motion.div transition={motion.spring('fast')} />
 *   {motion.allows('tileHover') && <Gloss />}
 */
export function useMotion() {
  const { theme } = useTheme();
  const [systemTick, setSystemTick] = useState(0);

  // The OS preference can change while the desktop is open.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setSystemTick((n) => n + 1);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  return useMemo(() => resolveMotion(theme), [theme, systemTick]);
}

export default useMotion;
