import React, { memo, useCallback } from 'react';
import { Tile } from './Tile.jsx';

/**
 * Desktop grid of app tiles
 * Scrollable grid that displays all available apps
 */
export const DesktopGrid = memo(function DesktopGrid({ apps, badges, onOpen, onQuick }) {
  const handleOpen = useCallback((app) => {
    onOpen(app);
  }, [onOpen]);

  const handleQuick = useCallback((app, init) => {
    onQuick(app, init);
  }, [onQuick]);

  return (
    <div className="absolute inset-x-0 top-10 bottom-0 p-4 overflow-y-auto grid grid-cols-6 auto-rows-[96px] gap-2">
      {apps.map(app => (
        <Tile 
          key={app.id} 
          app={app} 
          badge={(badges && badges[app.id]) || 0} 
          onOpen={handleOpen}
          onQuick={handleQuick}
        />
      ))}
    </div>
  );
});
