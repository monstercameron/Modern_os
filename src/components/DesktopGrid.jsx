import React, { memo, useCallback } from 'react';
import { Tile } from './Tile.jsx';
import { ContextMenu } from './ContextMenu.jsx';
import { useContextMenu } from '../hooks/useContextMenu.js';
import { CONTEXT_TYPES, MENU_ACTIONS } from '../utils/contextMenuStateMachine.js';
import eventBus, { TOPICS } from '../utils/eventBus.js';

/**
 * Desktop grid of app tiles
 * Scrollable grid that displays all available apps
 */
export const DesktopGrid = memo(function DesktopGrid({ apps, badges, onOpen, onQuick, tileEditMode, tileSizes, onUpdateTileSize, animatingBadge }) {
  // Context menu for desktop
  const {
    contextMenuState: desktopContextMenu,
    handleContextMenu: handleDesktopContextMenu,
    handleCloseMenu: closeDesktopMenu,
    handleSelectItem: handleDesktopMenuSelect,
  } = useContextMenu(CONTEXT_TYPES.DESKTOP);

  // Handle desktop context menu actions
  const handleDesktopAction = useCallback((item) => {
    switch (item.action) {
      case MENU_ACTIONS.REFRESH:
        // Refresh desktop (reload apps list, etc)
        window.location.reload();
        break;
      case MENU_ACTIONS.SETTINGS:
        // Open settings
        eventBus.publish(TOPICS.APP_LAUNCH, { appId: 'settings' });
        break;
      case MENU_ACTIONS.NEW_FOLDER:
        // Create new folder on desktop
        eventBus.publish(TOPICS.CONTEXT_MENU_ACTION, {
          action: 'desktopNewFolder',
        });
        break;
      default:
        break;
    }
  }, []);

  const handleOpen = useCallback((app) => {
    onOpen(app);
  }, [onOpen]);

  const handleQuick = useCallback((app, init) => {
    onQuick(app, init);
  }, [onQuick]);

  const handleUpdateSize = useCallback((appId, size) => {
    onUpdateTileSize(appId, size);
  }, [onUpdateTileSize]);

  return (
    <div 
      className="absolute inset-x-0 top-10 bottom-0 p-4 overflow-y-auto grid grid-cols-6 auto-rows-[96px] gap-2"
      onContextMenu={(e) => handleDesktopContextMenu(e)}
    >
      {apps.map(app => {
        const customSize = tileSizes[app.id] || app.size;       
        return (
          <Tile 
            key={app.id} 
            app={{ ...app, size: customSize }}
            badge={(badges && badges[app.id]) || 0} 
            onOpen={handleOpen}
            onQuick={handleQuick}
            isEditMode={tileEditMode}
            onUpdateSize={handleUpdateSize}
            animatingBadge={animatingBadge === app.id}
          />
        );
      })}

      {/* Desktop Context Menu */}
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
