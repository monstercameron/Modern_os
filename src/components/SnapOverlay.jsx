import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSnapZones, SNAP_ZONES } from '../utils/snapZones.js';
import { TB } from '../utils/constants.js';

/**
 * Drag snap overlay - shows snap zones and preview during window drag
 * Displays snap zone boundaries and animated preview rectangle
 */
export function SnapOverlay({ drag }) {
  if (!drag.activeId) {
    return null;
  }

  // Get screen dimensions
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight - TB;
  
  // Get all snap zones (memoized to prevent recalculation)
  const zones = useMemo(() => getSnapZones(screenWidth, screenHeight), [screenWidth, screenHeight]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      {/* Show snap zone perimeters after 100ms */}
      <AnimatePresence>
        {drag.showOverlay && (
          <>
            {Object.entries(zones).map(([zoneName, zone]) => (
              <motion.div
                key={zoneName}
                className="absolute border-2 border-dashed"
                style={{
                  left: zone.perimeter.x,
                  top: zone.perimeter.y,
                  width: zone.perimeter.width,
                  height: zone.perimeter.height,
                  borderColor: drag.over === zoneName ? 'var(--theme-accent)' : 'rgba(255, 255, 255, 0.3)',
                  backgroundColor: drag.over === zoneName ? 'var(--theme-accent)' : 'transparent',
                  opacity: drag.over === zoneName ? 0.15 : 0.08,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: drag.over === zoneName ? 0.15 : 0.08 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Animated preview rectangle - shows where window will snap */}
      <AnimatePresence>
        {drag.preview && (
          <motion.div
            className="absolute border-4 rounded-sm"
            style={{
              borderColor: "var(--theme-accent)",
              backgroundColor: "var(--theme-accent)",
              boxShadow: "0 0 30px 6px var(--theme-accent)"
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              left: drag.preview.x, 
              top: drag.preview.y, 
              width: drag.preview.w, 
              height: drag.preview.h,
              opacity: 0.3,
              scale: 1
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.5 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
