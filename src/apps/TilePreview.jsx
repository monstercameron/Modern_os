import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Tile Preview Component
 * Shows a live preview of the configured tile
 */
export function TilePreview({ config, onDrop, onDragOver, onDragEnter, onDragLeave, draggedWidget, isValidGridPosition }) {
  const [cols, rows] = config.size.split('x').map(Number);
  
  // State for dynamic widget data
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stepCount, setStepCount] = useState(8432);
  const [pomodoroTime, setPomodoroTime] = useState({ minutes: 25, seconds: 0 });
  const [cpuUsage, setCpuUsage] = useState(67);
  const [networkSpeed, setNetworkSpeed] = useState({ download: 95, upload: 23, ping: 12 });
  
  // Update dynamic data
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      
      // Simulate step counter increment
      setStepCount(prev => prev + Math.floor(Math.random() * 3));
      
      // Simulate CPU usage variation
      setCpuUsage(prev => Math.max(10, Math.min(95, prev + (Math.random() - 0.5) * 10)));
      
      // Simulate network speed variation
      setNetworkSpeed(prev => ({
        download: Math.max(10, Math.min(150, prev.download + (Math.random() - 0.5) * 20)),
        upload: Math.max(5, Math.min(50, prev.upload + (Math.random() - 0.5) * 10)),
        ping: Math.max(5, Math.min(100, prev.ping + (Math.random() - 0.5) * 5))
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

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

  // Function to render different widget types (visual-only, no text)
  const renderWidget = (widget, size = 'normal') => {
    const isSmall = size === 'small';

    switch (widget.type) {
      case 'clock':
        return (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-4xl font-mono font-bold">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        );

      case 'analog-clock':
        return (
          <div className="flex items-center justify-center h-full w-full">
            <div className="relative w-full h-full max-w-16 max-h-16">
              {/* Clock face */}
              <div className="absolute inset-0 border-2 border-white/80 rounded-full">
                {/* Hour markers */}
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-0.5 h-1 bg-white/60"
                    style={{
                      left: '50%',
                      top: '2px',
                      transformOrigin: '50% 14px',
                      transform: `rotate(${i * 30}deg)`
                    }}
                  />
                ))}
                {/* Hour hand */}
                <div
                  className="absolute w-0.5 bg-white left-1/2 top-1/2 origin-bottom"
                  style={{
                    height: '6px',
                    transform: `translateX(-50%) rotate(${currentTime.getHours() * 30 + currentTime.getMinutes() * 0.5}deg)`
                  }}
                />
                {/* Minute hand */}
                <div
                  className="absolute w-0.5 bg-white/80 left-1/2 top-1/2 origin-bottom"
                  style={{
                    height: '10px',
                    transform: `translateX(-50%) rotate(${currentTime.getMinutes() * 6}deg)`
                  }}
                />
                {/* Second hand */}
                <div
                  className="absolute w-0.5 bg-red-400 left-1/2 top-1/2 origin-bottom"
                  style={{
                    height: '12px',
                    transform: `translateX(-50%) rotate(${currentTime.getSeconds() * 6}deg)`
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'progress':
        const progress = widget.data?.progress || 0;
        return (
          <div className="flex items-center justify-center h-full w-full p-2">
            <div className="w-full h-4 bg-white/20 rounded-full">
              <div
                className="bg-green-500 h-4 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        );

      case 'media-player':
        const { isPlaying } = widget.data || {};
        return (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-6xl">
              {isPlaying ? '🎵' : '⏸️'}
            </div>
          </div>
        );

      case 'checklist':
        const { items = [], completed = [] } = widget.data || {};
        const completedCount = completed.filter(Boolean).length;
        const totalCount = items.length;
        return (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-4xl">
              {completedCount === totalCount && totalCount > 0 ? '✅' :
               completedCount > 0 ? '📝' : '⬜'}
            </div>
          </div>
        );

      case 'counter':
        return (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-4xl font-bold">
              {stepCount.toLocaleString()}
            </div>
          </div>
        );

      case 'timer':
        const { minutes = 0, seconds = 0 } = widget.data || {};
        return (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-3xl font-mono font-bold">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
          </div>
        );

      case 'weather':
        const { temp = 72, condition = 'Sunny' } = widget.data || {};
        return (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-6xl">
              {condition === 'Sunny' ? '☀️' :
               condition === 'Cloudy' ? '☁️' :
               condition === 'Rainy' ? '🌧️' :
               condition === 'Snowy' ? '❄️' : '🌤️'}
            </div>
          </div>
        );

      case 'battery':
        const { level = 100, isCharging = false } = widget.data || {};
        return (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-6xl">
              {isCharging ? '🔌' : level > 80 ? '🔋' : level > 20 ? '🪫' : '🔋'}
            </div>
          </div>
        );

      case 'cpu-monitor':
        return (
          <div className="flex items-center justify-center h-full w-full p-2">
            <div className="w-full h-4 bg-white/20 rounded-full">
              <div
                className={`h-4 rounded-full transition-all duration-300 ${
                  cpuUsage > 80 ? 'bg-red-500' : cpuUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${cpuUsage}%` }}
              />
            </div>
          </div>
        );

      case 'network':
        return (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-6xl">📶</div>
          </div>
        );

      case 'calendar':
        return (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-6xl">📅</div>
          </div>
        );

      case 'notes':
        return (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-6xl">📝</div>
          </div>
        );

      case 'rss':
        return (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-6xl">📰</div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full w-full">
            <div className="text-6xl">{widget.icon}</div>
          </div>
        );
    }
  };
  
  // Function to render tile content based on size
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
                const enabledControls = config.actionControls.filter(c => c.enabled);
                const placed = [];
                let currentX = 0;
                enabledControls.forEach((control) => {
                  const width = control.span?.width || 1;
                  if (currentX + width <= 3) {
                    placed.push({ control, startX: currentX });
                    currentX += width;
                  }
                });
                if (placed.length === 0) return null;

                return (
                  <div className="grid grid-cols-3 gap-1">
                    {placed.map(({ control }) => (
                      <button
                        key={control.id}
                        className={`${control.color} hover:opacity-80 rounded px-1 py-1 text-xs font-medium transition-all flex items-center justify-center min-h-[20px] col-span-${control.span?.width || 1}`}
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

    // All tiles that support widgets - use grid-based layout
    if (cols >= 2 || rows >= 2) {
      return (
        <div className="flex flex-col h-full p-3">
          {/* Title area - only show if no widgets in top area */}
          {(!config.placedWidgets || config.placedWidgets.length === 0 || 
            !config.placedWidgets.some(w => w.x === 0 && w.y === 0)) && (
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
          )}

          {/* Grid-based widget layout */}
          <div className="flex-1">
            <div 
              className="h-full grid" 
              style={{ 
                gridTemplateColumns: `repeat(${cols}, 1fr)`, 
                gridTemplateRows: `repeat(${rows}, 1fr)`,
                gap: '2px'
              }}
            >
              {/* Render widgets at their grid positions */}
              {config.placedWidgets && config.placedWidgets.map((placedWidget) => {
                const { x, y, widget } = placedWidget;
                const [widgetCols, widgetRows] = widget.size.split('x').map(Number);
                const gridColumnStart = x + 1;
                const gridColumnEnd = gridColumnStart + widgetCols;
                const gridRowStart = y + 1;
                const gridRowEnd = gridRowStart + widgetRows;
                
                return (
                  <div
                    key={placedWidget.id}
                    className="flex items-center justify-center"
                    style={{
                      gridColumn: `${gridColumnStart} / ${gridColumnEnd}`,
                      gridRow: `${gridRowStart} / ${gridRowEnd}`,
                    }}
                  >
                    {renderWidget(placedWidget.widget)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Controls - only show if no widgets in bottom area */}
          {config.actionControls && config.actionControls.some(c => c.enabled) && 
           (!config.placedWidgets || !config.placedWidgets.some(w => w.y === rows - 1)) && (
            <div className="mt-auto">
              {(() => {
                const enabledControls = config.actionControls.filter(c => c.enabled);
                const placed = [];
                let currentX = 0;
                enabledControls.forEach((control) => {
                  const width = control.span?.width || 1;
                  if (currentX + width <= 3) {
                    placed.push({ control, startX: currentX });
                    currentX += width;
                  }
                });
                if (placed.length === 0) return null;

                return (
                  <div className="grid grid-cols-3 gap-1">
                    {placed.map(({ control }) => (
                      <button
                        key={control.id}
                        className={`${control.color} hover:opacity-80 rounded px-1 py-1 text-xs font-medium transition-all flex items-center justify-center min-h-[20px] col-span-${control.span?.width || 1}`}
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
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
        >
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
          />

          {/* Slot dividers */}
          {(() => {
            const lines = [];
            
            if (cols === 1 && draggedWidget && rows > 1) {
              // Vertical tiles (excluding 1x1): show available content slots only during drag
              const totalSlots = rows === 1 ? 2 : 2 + 3 * (rows - 1);
              const availableSlots = totalSlots - 2; // Exclude title and action slots
              
              // Show available slots as highlighted areas
              for (let i = 1; i <= availableSlots; i++) {
                const slotTop = ((i) * 100) / totalSlots;
                const slotBottom = ((i + 1) * 100) / totalSlots;
                const slotHeight = slotBottom - slotTop;
                
                lines.push(
                  <div
                    key={`slot-area-${i}`}
                    className="absolute border border-blue-400 bg-blue-400/10 z-15"
                    style={{ 
                      top: `${slotTop}%`, 
                      left: '4px', 
                      right: '4px',
                      height: `${slotHeight}%`
                    }}
                  >
                    <div className="absolute top-1 left-1 text-blue-300 text-xs font-bold">
                      Drop Zone {i}
                    </div>
                  </div>
                );
              }
            } else if (rows === 1) {
              // Horizontal tiles
              const slots = cols * 2;
              const numLines = slots - 1;
              for (let i = 0; i < numLines; i++) {
                lines.push(
                  <div
                    key={`v-${i}`}
                    className="absolute border-l border-white/30 z-10"
                    style={{ left: `${((i + 1) * 100) / slots}%`, top: '12px', bottom: '12px' }}
                  />
                );
              }
            } else if (cols >= 2 || rows >= 2) {
              // Larger tiles or tiles that support grid positioning - add both horizontal and vertical dividers
              const hSlots = rows * 2;
              const vSlots = cols * 2;
              const hNumLines = hSlots - 1;
              const vNumLines = vSlots - 1;
              
              for (let i = 0; i < hNumLines; i++) {
                lines.push(
                  <div
                    key={`h-${i}`}
                    className="absolute border-t border-white/30 z-10"
                    style={{ top: `${((i + 1) * 100) / hSlots}%`, left: '12px', right: '12px' }}
                  />
                );
              }
              
              for (let i = 0; i < vNumLines; i++) {
                lines.push(
                  <div
                    key={`v-${i}`}
                    className="absolute border-l border-white/30 z-10"
                    style={{ left: `${((i + 1) * 100) / vSlots}%`, top: '12px', bottom: '12px' }}
                  />
                );
              }
            }
            
            return lines;
          })()}

          {/* Drag highlight overlay */}
          {draggedWidget && (() => {
            const [widgetCols, widgetRows] = draggedWidget.size.split('x').map(Number);
            const canFit = widgetCols <= cols && widgetRows <= rows && !(cols === 1 && rows === 1);
            
            if (!canFit) return null;
            
            // For grid-based tiles, show valid drop zones
            if (cols >= 2 || rows >= 2) {
              const validPositions = [];
              for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                  // Check if widget fits at this position
                  if (x + widgetCols <= cols && y + widgetRows <= rows) {
                    validPositions.push({ x, y });
                  }
                }
              }
              
              return validPositions.map(({ x, y }) => {
                // For grid-based tiles, calculate cell size based on full available area
                const padding = 24; // 24px total padding
                const availableWidth = tileWidth - padding;
                const availableHeight = tileHeight - padding; // Full height since title/controls are conditional
                
                const cellWidth = availableWidth / cols;
                const cellHeight = availableHeight / rows;
                
                const left = 12 + (x * cellWidth); // 12px left padding
                const top = 12 + (y * cellHeight); // 12px top padding
                const width = widgetCols * cellWidth;
                const height = widgetRows * cellHeight;
                
                return (
                  <div
                    key={`drop-${x}-${y}`}
                    className="absolute border-2 border-green-400 bg-green-400/10 z-20 pointer-events-none"
                    style={{
                      left: `${left}px`,
                      top: `${top}px`,
                      width: `${width}px`,
                      height: `${height}px`,
                    }}
                  >
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-green-400 text-black text-xs px-2 py-1 rounded whitespace-nowrap">
                      {draggedWidget.name}
                    </div>
                  </div>
                );
              });
            }
            
            // Fallback for old layout
            const contentTop = 48; // Approximate title area height
            const contentBottom = 32; // Approximate action controls height
            const availableHeight = tileHeight - contentTop - contentBottom - 24; // 24px padding
            const availableWidth = tileWidth - 24; // 24px padding
            
            const widgetWidth = (availableWidth / cols) * widgetCols;
            const widgetHeight = (availableHeight / rows) * widgetRows;
            
            const left = (tileWidth - widgetWidth) / 2;
            const top = contentTop + (availableHeight - widgetHeight) / 2;
            
            return (
              <div
                className="absolute border-2 border-green-400 bg-green-400/20 rounded-lg z-20 pointer-events-none"
                style={{
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${widgetWidth}px`,
                  height: `${widgetHeight}px`,
                }}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-green-400 text-black text-xs px-2 py-1 rounded whitespace-nowrap">
                  {draggedWidget.name} ({draggedWidget.size})
                </div>
              </div>
            );
          })()}

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