import React from 'react';
import { motion } from 'framer-motion';
import { useKernel, dispatch, actions, select } from '../../kernel/index.js';
import keymap from '../../services/keymap.js';

/**
 * Workspace indicator for the taskbar.
 *
 * One cell per workspace: filled when it holds windows, outlined when empty,
 * accented when it is the one on screen. Clicking switches; the same thing the
 * $mod+N binding does.
 */
export function WorkspaceSwitcher() {
  const workspaces = useKernel(select.workspaceOccupancy);
  const modLabel = keymap.getMod() === 'alt' ? 'Alt'
    : keymap.getMod() === 'meta' ? 'Super'
    : keymap.getMod() === 'control' ? 'Ctrl'
    : 'Ctrl+Alt';

  return (
    <div
      className="flex items-center gap-1 mr-3 pr-3 border-r"
      style={{ borderColor: 'var(--theme-border)' }}
      role="tablist"
      aria-label="Workspaces"
    >
      {workspaces.map((ws) => (
        <button
          key={ws.index}
          role="tab"
          aria-selected={ws.current}
          aria-label={`Workspace ${ws.index}${ws.windowCount ? `, ${ws.windowCount} windows` : ', empty'}`}
          title={`Workspace ${ws.index} — ${modLabel}+${ws.index}`}
          data-workspace={ws.index}
          data-current={ws.current ? 'true' : 'false'}
          onClick={() => dispatch(actions.switchWorkspace(ws.index))}
          className="relative w-6 h-6 grid place-items-center text-[10px] font-medium transition-colors"
          style={{
            // Theme tokens rather than fixed white, so the indicator stays
            // legible on a light taskbar.
            color: ws.current ? 'var(--theme-accent-text)' : 'var(--theme-text-muted)',
            backgroundColor: ws.current ? 'var(--theme-accent)' : 'transparent',
            border: `1px solid ${ws.current ? 'var(--theme-accent)' : 'var(--theme-border)'}`,
            borderRadius: 'var(--theme-radius-sm)',
          }}
        >
          {ws.index}
          {!ws.current && ws.occupied && (
            <motion.span
              layoutId={`ws-dot-${ws.index}`}
              className="absolute bottom-0.5 w-1 h-1 rounded-full"
              style={{ backgroundColor: 'var(--theme-accent)' }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

export default WorkspaceSwitcher;
