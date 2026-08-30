import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Tile } from './Tile.jsx';
import { ContextMenu } from './ContextMenu.jsx';
import { useContextMenu } from '../hooks/useContextMenu.js';
import { useGridNavigation } from '../hooks/useGridNavigation.js';
import { CONTEXT_TYPES, MENU_ACTIONS } from '../utils/contextMenuStateMachine.js';
import eventBus, { TOPICS } from '../utils/eventBus.js';

const ROW_HEIGHT = 96;

/**
 * The start screen.
 *
 * Tiles fill downward and the board grows to the right, the way the Metro start
 * screen worked: a fixed number of rows sized to the window, columns added as
 * needed, and horizontal scrolling to reach them.
 *
 * Typing filters the board — no need to click into a search field first — and
 * the arrow keys move a selection so the whole screen is reachable without a
 * mouse.
 */
export const DesktopGrid = memo(function DesktopGrid({
  apps,
  badges,
  onOpen,
  onQuick,
  tileEditMode,
  tileSizes,
  onUpdateTileSize,
  animatingBadge,
}) {
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState(6);
  const scrollRef = useRef(null);
  const gridRef = useRef(null);
  const searchRef = useRef(null);

  const {
    contextMenuState: desktopContextMenu,
    handleContextMenu: handleDesktopContextMenu,
    handleCloseMenu: closeDesktopMenu,
    handleSelectItem: handleDesktopMenuSelect,
  } = useContextMenu(CONTEXT_TYPES.DESKTOP);

  const handleDesktopAction = useCallback((item) => {
    switch (item.action) {
      case MENU_ACTIONS.REFRESH:
        window.location.reload();
        break;
      case MENU_ACTIONS.SETTINGS:
        eventBus.publish(TOPICS.APP_LAUNCH, { appId: 'settings' });
        break;
      case MENU_ACTIONS.NEW_FOLDER:
        eventBus.publish(TOPICS.CONTEXT_MENU_ACTION, { action: 'desktopNewFolder' });
        break;
      default:
        break;
    }
  }, []);

  /** Filter on title and id, so "calc" and "taskmgr" both work. */
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter((a) => a.title.toLowerCase().includes(q) || a.id.toLowerCase().includes(q));
  }, [apps, query]);

  const activate = useCallback((app) => {
    const el = gridRef.current?.querySelector(`[data-tile="${app.id}"]`);
    const rect = el?.getBoundingClientRect();
    onOpen(app, rect ? { tilePosition: { x: rect.left, y: rect.top, w: rect.width, h: rect.height } } : {});
  }, [onOpen]);

  const { activeIndex, setActiveIndex, handleKey, reset } = useGridNavigation({
    items: visible,
    containerRef: gridRef,
    onActivate: activate,
  });

  // Rows are sized to the window so the board fills the height before it grows
  // sideways. Recomputed whenever the launcher is resized.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const measure = () => {
      const usable = el.clientHeight - 16; // matches the container padding
      setRows(Math.max(1, Math.floor(usable / (ROW_HEIGHT + 8))));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /*
   * Type-to-filter. A printable key anywhere on the board starts a search
   * without the user having to aim at the field first; Backspace trims it and
   * Escape clears it before the launcher itself closes.
   */
  const onKeyDown = useCallback((e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (handleKey(e)) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const typingInSearch = e.target === searchRef.current;

    if (e.key === 'Escape' && query) {
      // Clear the filter first; a second Escape closes the launcher.
      e.preventDefault();
      e.stopPropagation();
      setQuery('');
      reset();
      return;
    }

    if (e.key === 'Backspace' && !typingInSearch && query) {
      e.preventDefault();
      setQuery((q) => q.slice(0, -1));
      return;
    }

    if (!typingInSearch && e.key.length === 1 && /\S/.test(e.key)) {
      e.preventDefault();
      setQuery((q) => q + e.key);
      searchRef.current?.focus();
    }
  }, [handleKey, query, reset]);

  return (
    <div
      ref={scrollRef}
      className="absolute inset-0 flex flex-col outline-none"
      onContextMenu={(e) => handleDesktopContextMenu(e)}
      onKeyDown={onKeyDown}
      tabIndex={-1}
      data-launcher-grid
    >
      {/* Search bar. Always present so the affordance is visible, but it does
          not need focus for typing to reach it. */}
      <div className="shrink-0 px-4 pt-3 pb-2 flex items-center gap-2">
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 border w-full max-w-xs"
          style={{
            borderColor: query ? 'var(--theme-accent)' : 'var(--theme-border)',
            backgroundColor: 'var(--theme-surface)',
            borderRadius: 'var(--theme-radius-sm)',
          }}
        >
          <Search size={13} style={{ color: 'var(--theme-text-muted)' }} />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to filter apps"
            aria-label="Filter apps"
            spellCheck={false}
            className="bg-transparent outline-none text-[12px] w-full"
            style={{ color: 'var(--theme-text)' }}
          />
          {query && (
            <button onClick={() => { setQuery(''); reset(); }} aria-label="Clear filter">
              <X size={12} style={{ color: 'var(--theme-text-muted)' }} />
            </button>
          )}
        </div>
        <span className="text-[11px]" style={{ color: 'var(--theme-text-muted)' }}>
          {query ? `${visible.length} of ${apps.length}` : `${apps.length} apps`}
          <span className="ml-2 app-hide-sm">· arrows to move, Enter to open</span>
        </span>
      </div>

      {visible.length === 0 ? (
        <div className="flex-1 grid place-items-center">
          <div className="text-center">
            <div className="font-medium mb-1" style={{ color: 'var(--theme-text)' }}>
              Nothing matches “{query}”
            </div>
            <div className="text-[12px]" style={{ color: 'var(--theme-text-muted)' }}>
              Press Escape to clear the filter.
            </div>
          </div>
        </div>
      ) : (
        <div
          ref={gridRef}
          className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden px-4 pb-4 grid"
          style={{
            // Fill down the rows, then start a new column to the right.
            gridAutoFlow: 'column',
            gridTemplateRows: `repeat(${rows}, ${ROW_HEIGHT}px)`,
            gridAutoColumns: 'minmax(168px, auto)',
            gap: 'var(--theme-tile-gap)',
            alignContent: 'start',
          }}
        >
          {visible.map((app, i) => {
            const customSize = tileSizes[app.id] || app.size;
            return (
              <Tile
                key={app.id}
                app={{ ...app, size: customSize }}
                badge={(badges && badges[app.id]) || 0}
                onOpen={onOpen}
                onQuick={onQuick}
                isEditMode={tileEditMode}
                onUpdateSize={onUpdateTileSize}
                animatingBadge={animatingBadge === app.id}
                focused={i === activeIndex}
                onFocusRequest={() => setActiveIndex(i)}
              />
            );
          })}
        </div>
      )}

      <ContextMenu
        contextMenuState={desktopContextMenu}
        onClose={closeDesktopMenu}
        onSelectItem={(item) => {
          handleDesktopMenuSelect(item);
          handleDesktopAction(item);
        }}
      />
    </div>
  );
});
