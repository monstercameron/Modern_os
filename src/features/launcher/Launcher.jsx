import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DesktopGrid } from '../../components/DesktopGrid.jsx';
import { useKernel, dispatch, actions, select } from '../../kernel/index.js';
import keymap, { SCOPES } from '../../services/keymap.js';
import { TB } from '../../utils/constants.js';

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

  // Claim the launcher scope for as long as the overlay is up.
  useEffect(() => {
    if (!open) return undefined;
    const release = keymap.pushScope(SCOPES.LAUNCHER);
    return release;
  }, [open]);

  const close = () => dispatch(actions.closeLauncher());

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="launcher"
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
            <DesktopGrid
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
