import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Move } from 'lucide-react';
import { useKernel } from '../../kernel/index.js';
import { useMotion } from '../../hooks/useMotion.js';

/**
 * The resize-mode indicator.
 *
 * A latched mode that looks exactly like the unlatched one is a trap: you press
 * an arrow expecting to move focus and the window changes size instead. While
 * resize mode is up this sits above the taskbar and says so, and says how to
 * leave.
 */
export function ResizeModeBar() {
  const on = useKernel((state) => state.resizeMode);
  const motionSettings = useMotion();

  return (
    <AnimatePresence>
      {on && (
        <motion.div
          data-resize-mode
          className="absolute left-1/2 bottom-14 z-[1800] flex items-center gap-2.5 px-3 py-1.5 border pointer-events-none"
          style={{
            x: '-50%',
            backgroundColor: 'var(--theme-surface)',
            borderColor: 'var(--theme-accent)',
            borderRadius: 'var(--theme-radius)',
            boxShadow: 'var(--theme-shadow)',
          }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={motionSettings.spring('fast')}
        >
          <Move size={13} style={{ color: 'var(--theme-accent)' }} />
          <span className="text-[12px] font-medium" style={{ color: 'var(--theme-text)' }}>
            Resize
          </span>
          <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
            arrows size the window · Esc to leave
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ResizeModeBar;
