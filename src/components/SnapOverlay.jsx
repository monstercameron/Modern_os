import React from 'react';
import { motion } from 'framer-motion';

/**
 * Drag snap overlay - shows snap zones and preview during window drag
 * Displays animated preview rectangle and highlights active snap zone
 */
export function SnapOverlay({ drag }) {
  if (!drag.activeId || drag.targets.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute left-0 right-0 z-[1500]" style={{ top: 0, bottom: 0 }}>
      {/* Animated preview rectangle */}
      {drag.preview && (
        <motion.div
          className="absolute border-2 rounded-sm"
          style={{
            borderColor: "var(--theme-accent)",
            backgroundColor: "var(--theme-accent)",
            opacity: 0.22,
            boxShadow: "0 0 0 1px var(--theme-accent)"
          }}
          initial={false}
          animate={{ 
            left: drag.preview.x, 
            top: drag.preview.y, 
            width: drag.preview.w, 
            height: drag.preview.h 
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.5 }}
        />
      )}
      
      {/* Highlight active snap zone */}
      {drag.targets.map((t) => {
        if (drag.over !== t.id) return null;
        return (
          <div
            key={t.id}
            className="absolute rounded-sm"
            style={{
              left: t.rect.x,
              top: t.rect.y,
              width: t.rect.w,
              height: t.rect.h,
              backgroundColor: 'var(--theme-accent)',
              opacity: 0.08,
              boxShadow: '0 0 0 1px var(--theme-accent)'
            }}
          />
        );
      })}
    </div>
  );
}
