import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DesktopGrid } from '../../components/DesktopGrid.jsx';
import { useKernel, dispatch, actions, select } from '../../kernel/index.js';
import keymap, { SCOPES } from '../../services/keymap.js';
import eventBus from '../../utils/eventBus.js';
import { LAUNCHER_PAN } from '../../components/DesktopGrid.jsx';
import { TB } from '../../utils/constants.js';
import { useInertWhenClosed } from '../../hooks/useInertWhenClosed.js';

/**
 * The start screen, presented as an overlay above the windows.
 *
 * Tapping the WM modifier on its own opens it; Esc, a click on the backdrop, or
 * launching an app closes it. While it is open the launcher scope is active, so
 * its bindings shadow the desktop's.
 */
export function Launcher({ apps, badges, onOpen, onQuick, animatingBadge }) {
  const open = useKernel(select.isLauncherOpen);
  const tileSizes = useKernel(select.tileSizes);
  const editMode = useKernel(select.tileEditMode);
  const rootRef = useRef(null);

  // A shut start screen must not be in the tab order while it animates away.
  useInertWhenClosed(rootRef, open);

  // Counts openings, purely to key the board so its filter and selection start
  // fresh every time.
  const [openCount, setOpenCount] = useState(0);
  useEffect(() => {
    if (open) setOpenCount((n) => n + 1);
  }, [open]);

  // Claim the launcher scope for as long as the overlay is up, and hand focus
  // to the board so typing filters and the arrow keys move a selection without
  // the user first clicking anything.
  useEffect(() => {
    if (!open) return undefined;
    const release = keymap.pushScope(SCOPES.LAUNCHER);
    const unbind = keymap.bindAll([
      ['$mod+right', () => eventBus.publish(LAUNCHER_PAN, { direction: 1 }),
        { scope: SCOPES.LAUNCHER, description: 'Pan the board right', owner: 'launcher' }],
      ['$mod+left', () => eventBus.publish(LAUNCHER_PAN, { direction: -1 }),
        { scope: SCOPES.LAUNCHER, description: 'Pan the board left', owner: 'launcher' }],
    ]);
    const id = requestAnimationFrame(() => {
      document.querySelector('[data-launcher-grid]')?.focus({ preventScroll: true });
    });
    return () => { cancelAnimationFrame(id); unbind(); release(); };
  }, [open]);

  const close = () => dispatch(actions.closeLauncher());

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="launcher"
          ref={rootRef}
          data-launcher="open"
          className="absolute inset-0 z-[1400]"
          style={{ top: TB }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
        >
          {/* Backdrop: dims the windows underneath and closes on click. */}
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: 'var(--theme-background)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.97 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />

          <motion.div
            className="absolute inset-0"
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 460, damping: 38, mass: 0.7 }}
          >
            {/* Remounted on each open so the board always comes up unfiltered
                with nothing selected, rather than resuming the last search. */}
            <DesktopGrid
              key={openCount}
              apps={apps}
              badges={badges}
              onOpen={onOpen}
              onQuick={onQuick}
              tileEditMode={editMode}
              tileSizes={tileSizes}
              onUpdateTileSize={(appId, size) => dispatch(actions.setTileSize(appId, size))}
              animatingBadge={animatingBadge}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Launcher;
