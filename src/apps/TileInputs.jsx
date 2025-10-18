import React from 'react';

/**
 * Tile Inputs Component
 * Handles all the configuration inputs for the tile
 */
export function TileInputs({ config, setConfig }) {
  const icons = [
    'Mail', 'Music', 'Clock', 'Cloud', 'Activity', 'Play', 'Pause', 'Plus', 'Minus', 'Check', 'X', 'Settings'
  ];

  const colors = [
    'bg-blue-600', 'bg-red-600', 'bg-green-600', 'bg-purple-600', 'bg-teal-600',
    'bg-indigo-600', 'bg-yellow-600', 'bg-cyan-600', 'bg-amber-600', 'bg-rose-600',
    'bg-sky-600', 'bg-emerald-600', 'bg-zinc-700', 'bg-neutral-700'
  ];

  // Parse current size
  const getCurrentSize = () => {
    const [cols, rows] = config.size.split('x').map(Number);
    return { cols, rows };
  };

  const { cols: currentCols, rows: currentRows } = getCurrentSize();

  const handleCellClick = (col, row) => {
    // Toggle the cell - if clicking on current size, reset to 1x1
    if (col === currentCols && row === currentRows) {
      setConfig({ ...config, size: '1x1' });
    } else {
      setConfig({ ...config, size: `${col}x${row}` });
    }
  };

  const isCellSelected = (col, row) => {
    return col <= currentCols && row <= currentRows;
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-300 mb-2">Desktop Grid System</h3>
        <p className="text-xs text-white/70">
          Tiles use a 6-column CSS Grid with flexible column widths and fixed 96px row heights.
          Actual dimensions vary based on container width. Content area has 12px padding all around.
        </p>
      </div>

      <h2 className="text-xl font-bold">Tile Configuration</h2>

      {/* Size Grid */}
      <div>
        <label className="block text-sm font-medium mb-3">Size (Click cells to resize)</label>
        <div className="inline-block p-4 bg-black/20 rounded-lg">
          <div className="grid grid-cols-4 gap-1" style={{ width: '320px', height: '320px' }}>
            {Array.from({ length: 4 }, (_, row) =>
              Array.from({ length: 4 }, (_, col) => {
                const cellCol = col + 1;
                const cellRow = row + 1;
                const selected = isCellSelected(cellCol, cellRow);
                return (
                  <button
                    key={`${cellCol}-${cellRow}`}
                    onClick={() => handleCellClick(cellCol, cellRow)}
                    className={`w-20 h-20 border-2 transition-all duration-200 ${
                      selected
                        ? 'border-blue-500 bg-blue-500/30 shadow-lg'
                        : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40'
                    }`}
                    style={{
                      backgroundSize: '20px 20px',
                      backgroundImage: selected ? 'none' : 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)'
                    }}
                  >
                    {cellCol === 1 && cellRow === 1 && (
                      <span className="text-xs text-white/60">{cellCol}×{cellRow}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
          <div className="mt-2 text-center text-sm text-white/60 space-y-1">
            <div>Current: {currentCols}×{currentRows} Grid Span</div>
            <div>Height: {currentRows * 96}px (fixed)</div>
            <div>Width: Flexible based on container</div>
            <div className="text-xs text-white/40">Desktop uses 6-column CSS Grid</div>
          </div>
        </div>
      </div>

      {/* Title Input */}
      <div>
        <label className="block text-sm font-medium mb-2">Title</label>
        <input
          type="text"
          value={config.title}
          onChange={(e) => setConfig({ ...config, title: e.target.value })}
          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50"
          placeholder="Enter tile title"
        />
      </div>

      {/* Color Selection */}
      <div>
        <label className="block text-sm font-medium mb-3">Color</label>
        <div className="grid grid-cols-7 gap-2">
          {colors.map(color => (
            <button
              key={color}
              onClick={() => setConfig({ ...config, color })}
              className={`w-8 h-8 rounded border-2 transition-all ${
                config.color === color
                  ? 'border-white scale-110'
                  : 'border-white/20 hover:border-white/40'
              } ${color}`}
            />
          ))}
        </div>
      </div>

      {/* Icon Selection */}
      <div>
        <label className="block text-sm font-medium mb-3">Icon</label>
        <div className="grid grid-cols-6 gap-2">
          {icons.map(iconName => (
            <button
              key={iconName}
              onClick={() => setConfig({ ...config, icon: iconName })}
              className={`p-2 rounded border transition-colors ${
                config.icon === iconName
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-white/20 bg-white/5 hover:bg-white/10'
              }`}
            >
              <span className="text-lg">{iconName === 'Mail' ? '✉️' :
                                         iconName === 'Music' ? '🎵' :
                                         iconName === 'Clock' ? '🕐' :
                                         iconName === 'Cloud' ? '☁️' :
                                         iconName === 'Activity' ? '📊' :
                                         iconName === 'Play' ? '▶️' :
                                         iconName === 'Pause' ? '⏸️' :
                                         iconName === 'Plus' ? '➕' :
                                         iconName === 'Minus' ? '➖' :
                                         iconName === 'Check' ? '✓' :
                                         iconName === 'X' ? '✗' :
                                         '⚙️'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Badge Settings */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.showBadge}
            onChange={(e) => setConfig({ ...config, showBadge: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm">Show Badge</span>
        </label>
        {config.showBadge && (
          <div className="flex items-center gap-2">
            <span className="text-sm">Count:</span>
            <input
              type="number"
              min="0"
              max="99"
              value={config.badgeCount}
              onChange={(e) => setConfig({ ...config, badgeCount: parseInt(e.target.value) || 0 })}
              className="w-16 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-center"
            />
          </div>
        )}
      </div>

      {/* Size-specific controls */}
      {config.size === '2x1' && (
        <div>
          <label className="block text-sm font-medium mb-2">Progress Value</label>
          <input
            type="range"
            min="0"
            max="100"
            value={config.progressValue || 65}
            onChange={(e) => setConfig({ ...config, progressValue: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="text-xs text-white/60 mt-1">{config.progressValue || 65}%</div>
        </div>
      )}

      {config.size === '1x2' && (
        <div>
          <label className="block text-sm font-medium mb-2">List Items</label>
          <textarea
            value={config.listItems || '• Task 1\n• Task 2\n• Task 3'}
            onChange={(e) => setConfig({ ...config, listItems: e.target.value })}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 h-20"
            placeholder="Enter list items (one per line)"
          />
        </div>
      )}

      {/* Action Controls */}  
      <div>
        <label className="block text-sm font-medium mb-3">Action Controls</label>
        
        {/* Simple Action Controls Widget */}
        <div className="mb-4">
          <label className="block text-xs font-medium mb-3">Action Controls</label>
          <div className="bg-black/20 rounded-lg p-4">
            <div className="text-xs text-white/60 mb-3">
              Click cells to add controls. Use stretch toggle to make controls span multiple cells.
            </div>
            
            {/* Dynamic Cell Grid based on tile size */}
            {(() => {
              const [cols, rows] = config.size.split('x').map(Number);
              
              // All tile sizes - 3-cell grid for icons only
              return (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {(() => {
                    return [0, 1, 2].map((cellIndex) => {
                      const control = config.actionControls.find(c => c.enabled && c.position?.x === cellIndex);
                      
                      if (control) {
                        return (
                          <div key={cellIndex} className="col-span-1">
                            <button
                              onClick={() => {
                                // Could add edit functionality here
                              }}
                              className={`w-full h-16 rounded border-2 transition-all ${control.color} border-white/50 hover:opacity-80 flex items-center justify-center text-sm`}
                            >
                              <div className="flex items-center gap-2">
                                <span>{control.icon === 'Play' ? '▶️' : '⚙️'}</span>
                              </div>
                            </button>
                            
                            {/* Remove button */}
                            <div className="flex justify-center mt-2">
                              <button
                                onClick={() => {
                                  const newControls = config.actionControls.map(c => 
                                    c.id === control.id ? { ...c, enabled: false } : c
                                  );
                                  setConfig({ ...config, actionControls: newControls });
                                }}
                                className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 hover:text-red-300"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      }
                      
                      // Empty cell
                      return (
                        <div key={cellIndex} className="col-span-1">
                          <button
                            onClick={() => {
                              // Add new control
                              const newControl = {
                                id: Date.now(),
                                icon: 'Play',
                                text: `Action ${cellIndex + 1}`,
                                color: 'bg-blue-600',
                                enabled: true,
                                position: { x: cellIndex, y: 0 },
                                span: { width: 1, height: 1 }
                              };
                              setConfig({ ...config, actionControls: [...config.actionControls, newControl] });
                            }}
                            className="w-full h-16 rounded border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 flex items-center justify-center text-sm"
                          >
                            <span className="text-white/40">Click to add</span>
                          </button>
                        </div>
                      );
                    });
                  })()}
                </div>
              );
            })()}            {/* Control Properties */}
            <div className="space-y-3">
              {config.actionControls.filter(c => c.enabled).map((control) => (
                <div key={control.id} className="bg-white/5 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{control.text}</span>
                    <button
                      onClick={() => {
                        const newControls = config.actionControls.map(c => 
                          c.id === control.id ? { ...c, enabled: false } : c
                        );
                        setConfig({ ...config, actionControls: newControls });
                      }}
                      className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded bg-red-500/20"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs mb-1">Icon</label>
                      <select
                        value={control.icon}
                        onChange={(e) => {
                          const newControls = config.actionControls.map(c => 
                            c.id === control.id ? { ...c, icon: e.target.value } : c
                          );
                          setConfig({ ...config, actionControls: newControls });
                        }}
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                      >
                        {icons.map(iconName => (
                          <option key={iconName} value={iconName}>{iconName}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs mb-1">Text</label>
                      <input
                        type="text"
                        value={control.text}
                        onChange={(e) => {
                          const newControls = config.actionControls.map(c => 
                            c.id === control.id ? { ...c, text: e.target.value } : c
                          );
                          setConfig({ ...config, actionControls: newControls });
                        }}
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs mb-1">Color</label>
                      <select
                        value={control.color}
                        onChange={(e) => {
                          const newControls = config.actionControls.map(c => 
                            c.id === control.id ? { ...c, color: e.target.value } : c
                          );
                          setConfig({ ...config, actionControls: newControls });
                        }}
                        className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                      >
                        {colors.map(color => (
                          <option key={color} value={color}>{color.replace('bg-', '')}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}