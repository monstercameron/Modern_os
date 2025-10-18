import React from 'react';
import { motion } from 'framer-motion';

/**
 * Tile Preview Component
 * Shows a live preview of the configured tile
 */
export function TilePreview({ config }) {
  const [cols, rows] = config.size.split('x').map(Number);

  // Based on actual desktop measurements:
  // - Grid: 6 columns, auto-rows-[96px], gap-2
  // - Container width assumed ~1200px for calculation
  // - Column width = (container - gaps) / 6
  // - Actual measurements: 201.656px × 70px content with 12px padding all around
  const containerWidth = 1200; // Approximate desktop width
  const gap = 8; // 2 * 4px (Tailwind gap-2 = 8px)
  const columnWidth = (containerWidth - (5 * gap)) / 6; // 6 columns, 5 gaps
  const tileWidth = (columnWidth * cols) + ((cols - 1) * gap);
  const tileHeight = 96 * rows + ((rows - 1) * gap); // Fixed row height + gaps

  // Content area (accounting for 12px padding all around)
  const contentWidth = tileWidth - 24; // 12px left + 12px right
  const contentHeight = tileHeight - 24; // 12px top + 12px bottom

  // Function to truncate text by character count and append ellipsis
  const truncateText = (text, maxChars) => {
    if (text.length <= maxChars) return text;
    return text.substring(0, maxChars) + '...';
  };

  const getTileContent = () => {
    if (cols === 1 && rows === 1) {
      return (
        <div className="flex flex-col h-full p-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl">
                {config.icon === 'Mail' ? '✉️' :
                 config.icon === 'Music' ? '🎵' :
                 config.icon === 'Clock' ? '🕐' :
                 config.icon === 'Cloud' ? '☁️' :
                 config.icon === 'Activity' ? '📊' :
                 config.icon === 'Play' ? '▶️' :
                 config.icon === 'Pause' ? '⏸️' :
                 config.icon === 'Plus' ? '➕' :
                 config.icon === 'Minus' ? '➖' :
                 config.icon === 'Check' ? '✓' :
                 config.icon === 'X' ? '✗' :
                 '⚙️'}
              </span>
              <div className="text-xs font-medium">{truncateText(config.title || 'App Name', 18)}</div>
            </div>
          </div>
          {/* Action Controls for 1x1 tiles */}
          {config.actionControls && config.actionControls.some(c => c.enabled) && (
            <div className="mt-auto">
              {(() => {
                const enabledControls = config.actionControls.filter(c => c.enabled).slice(0, 3);
                if (enabledControls.length === 0) return null;

                return (
                  <div className="flex justify-center gap-1">
                    {enabledControls.map((control) => (
                      <button
                        key={control.id}
                        className={`${control.color} hover:opacity-80 rounded px-1 py-1 text-xs font-medium transition-all flex items-center justify-center min-h-[20px] min-w-[20px] flex-1`}
                      >
                        <span className="text-sm">
                          {control.icon === 'Play' ? '▶️' :
                           control.icon === 'Pause' ? '⏸️' :
                           control.icon === 'Stop' ? '⏹️' :
                           control.icon === 'Mail' ? '✉️' :
                           control.icon === 'Music' ? '🎵' :
                           control.icon === 'Clock' ? '🕐' :
                           control.icon === 'Cloud' ? '☁️' :
                           control.icon === 'Activity' ? '📊' :
                           control.icon === 'Plus' ? '➕' :
                           control.icon === 'Minus' ? '➖' :
                           control.icon === 'Check' ? '✓' :
                           control.icon === 'X' ? '✗' :
                           '⚙️'}
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      );
    }

    // 2x1 through 4x1 tiles (cols >= 2 && rows === 1)
    if (cols >= 2 && rows === 1) {
      return (
        <div className="flex h-full p-3 gap-3">
          {/* First 1x1 cell with content */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-3xl">
                  {config.icon === 'Mail' ? '✉️' :
                   config.icon === 'Music' ? '🎵' :
                   config.icon === 'Clock' ? '🕐' :
                   config.icon === 'Cloud' ? '☁️' :
                   config.icon === 'Activity' ? '📊' :
                   config.icon === 'Play' ? '▶️' :
                   config.icon === 'Pause' ? '⏸️' :
                   config.icon === 'Plus' ? '➕' :
                   config.icon === 'Minus' ? '➖' :
                   config.icon === 'Check' ? '✓' :
                   config.icon === 'X' ? '✗' :
                   '⚙️'}
                </span>
                <div className="text-xs font-medium">{truncateText(config.title || 'App Name', 18)}</div>
              </div>
            </div>
            {/* Action Controls in first cell */}
            {config.actionControls && config.actionControls.some(c => c.enabled) && (
              <div className="mt-auto">
                {(() => {
                  const enabledControls = config.actionControls.filter(c => c.enabled).slice(0, 3);
                  if (enabledControls.length === 0) return null;

                  return (
                    <div className="flex justify-center gap-1">
                      {enabledControls.map((control) => (
                        <button
                          key={control.id}
                          className={`${control.color} hover:opacity-80 rounded px-1 py-1 text-xs font-medium transition-all flex items-center justify-center min-h-[20px] min-w-[20px] flex-1`}
                        >
                          <span className="text-sm">
                            {control.icon === 'Play' ? '▶️' :
                             control.icon === 'Pause' ? '⏸️' :
                             control.icon === 'Stop' ? '⏹️' :
                             control.icon === 'Mail' ? '✉️' :
                             control.icon === 'Music' ? '🎵' :
                             control.icon === 'Clock' ? '🕐' :
                             control.icon === 'Cloud' ? '☁️' :
                             control.icon === 'Activity' ? '📊' :
                             control.icon === 'Plus' ? '➕' :
                             control.icon === 'Minus' ? '➖' :
                             control.icon === 'Check' ? '✓' :
                             control.icon === 'X' ? '✗' :
                             '⚙️'}
                          </span>
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          {/* Remaining cells are blank */}
          {Array.from({ length: cols - 1 }).map((_, index) => (
            <div key={index} className="flex-1"></div>
          ))}
        </div>
      );
    }

    if (cols === 1 && rows === 2) {
      return (
        <div className="flex flex-col h-full p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl">
                {config.icon === 'Mail' ? '✉️' :
                 config.icon === 'Music' ? '🎵' :
                 config.icon === 'Clock' ? '🕐' :
                 config.icon === 'Cloud' ? '☁️' :
                 config.icon === 'Activity' ? '📊' :
                 config.icon === 'Play' ? '▶️' :
                 config.icon === 'Pause' ? '⏸️' :
                 config.icon === 'Plus' ? '➕' :
                 config.icon === 'Minus' ? '➖' :
                 config.icon === 'Check' ? '✓' :
                 config.icon === 'X' ? '✗' :
                 '⚙️'}
              </span>
              <div className="text-xs font-medium">{truncateText(config.title || 'App Name', 18)}</div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            {/* Centered content area for additional info if needed */}
          </div>
          {/* Action Controls for 1x2 tiles */}
          {config.actionControls && config.actionControls.some(c => c.enabled) && (
            <div className="mt-auto">
              {(() => {
                const enabledControls = config.actionControls.filter(c => c.enabled).slice(0, 3);
                if (enabledControls.length === 0) return null;

                return (
                  <div className="flex justify-center gap-1">
                    {enabledControls.map((control) => (
                      <button
                        key={control.id}
                        className={`${control.color} hover:opacity-80 rounded px-1 py-1 text-xs font-medium transition-all flex items-center justify-center min-h-[20px] min-w-[20px] flex-1`}
                      >
                        <span className="text-sm">
                          {control.icon === 'Play' ? '▶️' :
                           control.icon === 'Pause' ? '⏸️' :
                           control.icon === 'Stop' ? '⏹️' :
                           control.icon === 'Mail' ? '✉️' :
                           control.icon === 'Music' ? '🎵' :
                           control.icon === 'Clock' ? '🕐' :
                           control.icon === 'Cloud' ? '☁️' :
                           control.icon === 'Activity' ? '📊' :
                           control.icon === 'Plus' ? '➕' :
                           control.icon === 'Minus' ? '➖' :
                           control.icon === 'Check' ? '✓' :
                           control.icon === 'X' ? '✗' :
                           '⚙️'}
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      );
    }

    // 2x2 and larger tiles
    if (cols >= 2 && rows >= 2) {
      return (
        <div className="flex flex-col h-full p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl">
                {config.icon === 'Mail' ? '✉️' :
                 config.icon === 'Music' ? '🎵' :
                 config.icon === 'Clock' ? '🕐' :
                 config.icon === 'Cloud' ? '☁️' :
                 config.icon === 'Activity' ? '📊' :
                 config.icon === 'Play' ? '▶️' :
                 config.icon === 'Pause' ? '⏸️' :
                 config.icon === 'Plus' ? '➕' :
                 config.icon === 'Minus' ? '➖' :
                 config.icon === 'Check' ? '✓' :
                 config.icon === 'X' ? '✗' :
                 '⚙️'}
              </span>
              <div className="font-medium text-sm">{truncateText(config.title || 'App Name', 18)}</div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            {/* Centered content area for additional info if needed */}
          </div>
          {/* Action Controls Row */}
          {config.actionControls && config.actionControls.some(c => c.enabled) && (
            <div className="mt-auto">
              {(() => {
                const enabledControls = config.actionControls.filter(c => c.enabled).slice(0, 3);
                if (enabledControls.length === 0) return null;

                return (
                  <div className="flex justify-center gap-1">
                    {enabledControls.map((control) => (
                      <button
                        key={control.id}
                        className={`${control.color} hover:opacity-80 rounded px-1 py-1 text-xs font-medium transition-all flex items-center justify-center min-h-[20px] min-w-[20px] flex-1`}
                      >
                        <span className="text-sm">
                          {control.icon === 'Play' ? '▶️' :
                           control.icon === 'Pause' ? '⏸️' :
                           control.icon === 'Stop' ? '⏹️' :
                           control.icon === 'Mail' ? '✉️' :
                           control.icon === 'Music' ? '🎵' :
                           control.icon === 'Clock' ? '🕐' :
                           control.icon === 'Cloud' ? '☁️' :
                           control.icon === 'Activity' ? '📊' :
                           control.icon === 'Plus' ? '➕' :
                           control.icon === 'Minus' ? '➖' :
                           control.icon === 'Check' ? '✓' :
                           control.icon === 'X' ? '✗' :
                           '⚙️'}
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      );
    }

    // 1x3, 1x4 and other 1xN tiles (cols === 1 && rows > 2)
    if (cols === 1 && rows > 2) {
      return (
        <div className="flex flex-col h-full p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl">
                {config.icon === 'Mail' ? '✉️' :
                 config.icon === 'Music' ? '🎵' :
                 config.icon === 'Clock' ? '🕐' :
                 config.icon === 'Cloud' ? '☁️' :
                 config.icon === 'Activity' ? '📊' :
                 config.icon === 'Play' ? '▶️' :
                 config.icon === 'Pause' ? '⏸️' :
                 config.icon === 'Plus' ? '➕' :
                 config.icon === 'Minus' ? '➖' :
                 config.icon === 'Check' ? '✓' :
                 config.icon === 'X' ? '✗' :
                 '⚙️'}
              </span>
              <div className="text-xs font-medium">{truncateText(config.title || 'App Name', 18)}</div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            {/* Centered content area for additional info if needed */}
          </div>
          {/* Action Controls for 1xN tiles */}
          {config.actionControls && config.actionControls.some(c => c.enabled) && (
            <div className="mt-auto">
              {(() => {
                const enabledControls = config.actionControls.filter(c => c.enabled).slice(0, 3);
                if (enabledControls.length === 0) return null;

                return (
                  <div className="flex justify-center gap-1">
                    {enabledControls.map((control) => (
                      <button
                        key={control.id}
                        className={`${control.color} hover:opacity-80 rounded px-1 py-1 text-xs font-medium transition-all flex items-center justify-center min-h-[20px] min-w-[20px] flex-1`}
                      >
                        <span className="text-sm">
                          {control.icon === 'Play' ? '▶️' :
                           control.icon === 'Pause' ? '⏸️' :
                           control.icon === 'Stop' ? '⏹️' :
                           control.icon === 'Mail' ? '✉️' :
                           control.icon === 'Music' ? '🎵' :
                           control.icon === 'Clock' ? '🕐' :
                           control.icon === 'Cloud' ? '☁️' :
                           control.icon === 'Activity' ? '📊' :
                           control.icon === 'Plus' ? '➕' :
                           control.icon === 'Minus' ? '➖' :
                           control.icon === 'Check' ? '✓' :
                           control.icon === 'X' ? '✗' :
                           '⚙️'}
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Tile Preview</h2>
      <div className="flex justify-center">
        <motion.div
          className={`relative overflow-hidden shadow-md border border-black/20 ${config.color} text-white`}
          style={{
            width: tileWidth,
            height: tileHeight,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px'
          }}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
          />

          {/* Tile content */}
          <div className="relative z-10 h-full">
            {getTileContent()}
          </div>
        </motion.div>
      </div>
      <div className="text-center text-sm text-white/60 space-y-1">
        <div>{cols}×{rows} Grid Span</div>
        <div>Total: {Math.round(tileWidth)}×{Math.round(tileHeight)}px</div>
        <div>Content: {Math.round(contentWidth)}×{Math.round(contentHeight)}px (12px padding)</div>
        <div className="text-xs text-white/40">Based on 6-column flexible grid with 96px row height</div>
      </div>
    </div>
  );
}