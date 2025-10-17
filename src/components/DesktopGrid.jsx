import React, { memo, useCallback } from 'react';
import { Tile } from './Tile.jsx';

/**
 * Desktop grid of app tiles
 * Scrollable grid that displays all available apps
 */
export const DesktopGrid = memo(function DesktopGrid({ apps, badges, onOpen, onQuick, tileEditMode, tileSizes, onUpdateTileSize, animatingBadge }) {
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
    <div className="absolute inset-x-0 top-10 bottom-0 p-4 overflow-y-auto grid grid-cols-6 auto-rows-[96px] gap-2">
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
    </div>
  );
});
