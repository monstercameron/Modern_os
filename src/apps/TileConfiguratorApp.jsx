import React, { useState, useEffect } from 'react';
import { TileInputs } from './TileInputs.jsx';
import { TilePreview } from './TilePreview.jsx';

/**
 * Widget Library Component
 * Shows available widgets that can be selected for tiles
 */
function WidgetLibrary({ onSelectWidget, onDragStart, tileSize, placedWidgetsCount, availableSlots }) {
  const widgets = [
    { id: 'clock', name: 'Digital Clock', size: '1x1', icon: '🕐', description: 'Live digital time display', color: 'bg-blue-600', type: 'clock' },
    { id: 'analog-clock', name: 'Analog Clock', size: '2x2', icon: '🕰️', description: 'Classic analog clock face', color: 'bg-indigo-600', type: 'analog-clock' },
    { id: 'progress-task', name: 'Task Progress', size: '2x1', icon: '📊', description: 'Project completion progress bar', color: 'bg-green-600', type: 'progress', data: { progress: 75, label: 'Project Alpha' } },
    { id: 'progress-download', name: 'Download Progress', size: '1x1', icon: '⬇️', description: 'File download progress', color: 'bg-orange-600', type: 'progress', data: { progress: 45, label: 'app-update.zip' } },
    { id: 'media-player', name: 'Media Player', size: '2x1', icon: '🎵', description: 'Music player with controls', color: 'bg-purple-600', type: 'media-player', data: { title: 'Bohemian Rhapsody', artist: 'Queen', isPlaying: true } },
    { id: 'checklist', name: 'Daily Tasks', size: '1x2', icon: '✅', description: 'Interactive checklist', color: 'bg-teal-600', type: 'checklist', data: { items: ['Review code', 'Write tests', 'Deploy app'], completed: [true, false, false] } },
    { id: 'step-counter', name: 'Step Counter', size: '1x1', icon: '👟', description: 'Daily step tracking', color: 'bg-pink-600', type: 'counter', data: { current: 8432, goal: 10000, unit: 'steps' } },
    { id: 'pomodoro', name: 'Pomodoro Timer', size: '1x1', icon: '🍅', description: 'Focus timer with breaks', color: 'bg-red-600', type: 'timer', data: { minutes: 25, seconds: 0, mode: 'focus' } },
    { id: 'weather', name: 'Weather', size: '2x1', icon: '🌤️', description: 'Current weather with forecast', color: 'bg-yellow-600', type: 'weather', data: { temp: 72, condition: 'Sunny', location: 'San Francisco' } },
    { id: 'battery', name: 'Battery Status', size: '1x1', icon: '🔋', description: 'Battery level and charging status', color: 'bg-cyan-600', type: 'battery', data: { level: 85, isCharging: false } },
    { id: 'cpu-monitor', name: 'CPU Monitor', size: '1x2', icon: '💻', description: 'Real-time CPU usage', color: 'bg-orange-600', type: 'cpu-monitor', data: { usage: 67, cores: 8 } },
    { id: 'network-speed', name: 'Network Speed', size: '1x1', icon: '📶', description: 'Internet connection speed', color: 'bg-indigo-600', type: 'network', data: { download: 95, upload: 23, ping: 12 } },
    { id: 'calendar-mini', name: 'Mini Calendar', size: '2x2', icon: '�', description: 'Current month with events', color: 'bg-green-600', type: 'calendar', data: { today: new Date() } },
    { id: 'quick-notes', name: 'Quick Notes', size: '1x2', icon: '📝', description: 'Sticky notes for reminders', color: 'bg-yellow-500', type: 'notes', data: { notes: ['Call mom', 'Buy groceries', 'Meeting at 3pm'] } },
    { id: 'rss-feed', name: 'News Feed', size: '2x2', icon: '�', description: 'Latest headlines', color: 'bg-gray-600', type: 'rss', data: { headlines: ['Tech stocks rise', 'New AI breakthrough', 'Weather update'] } },
  ];

  const [tileCols, tileRows] = tileSize.split('x').map(Number);
  const is1x1Tile = tileCols === 1 && tileRows === 1;

  const isWidgetCompatible = (widget) => {
    if (is1x1Tile) return false; // No widgets allowed on 1x1 tiles
    const [widgetCols, widgetRows] = widget.size.split('x').map(Number);
    const sizeCompatible = widgetCols <= tileCols && widgetRows <= tileRows;
    const slotsAvailable = placedWidgetsCount < availableSlots;
    return sizeCompatible && slotsAvailable;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white/90">Widget Library</h3>
      <p className="text-sm text-white/60">
        {is1x1Tile 
          ? "1x1 tiles cannot have widgets - they only have space for title and action controls"
          : placedWidgetsCount >= availableSlots
          ? `Maximum widgets reached (${placedWidgetsCount}/${availableSlots})`
          : "Click a widget to configure the tile"
        }
      </p>
      
      <div className="grid grid-cols-2 gap-3">
        {widgets.map((widget) => {
          const compatible = isWidgetCompatible(widget);
          return (
            <button
              key={widget.id}
              draggable={compatible}
              onDragStart={compatible ? (e) => onDragStart(e, widget) : undefined}
              onClick={compatible ? () => onSelectWidget(widget) : undefined}
              disabled={!compatible}
              className={`p-3 border rounded-lg transition-all text-left ${
                compatible 
                  ? "bg-white/5 hover:bg-white/10 border-white/10 hover:scale-105 cursor-grab active:cursor-grabbing" 
                  : "bg-white/5 border-white/5 cursor-not-allowed opacity-50"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{widget.icon}</span>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${compatible ? 'text-white/90' : 'text-white/50'}`}>{widget.name}</div>
                  <div className="text-xs text-white/50">{widget.size} slots</div>
                </div>
              </div>
              <div className={`text-xs ${compatible ? 'text-white/60' : 'text-white/40'}`}>{widget.description}</div>
              {!compatible && (
                <div className="text-xs text-red-400 mt-1">
                  {placedWidgetsCount >= availableSlots 
                    ? `No slots available (${placedWidgetsCount}/${availableSlots})`
                    : `Not compatible with ${tileSize} tile`
                  }
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Tile Configurator App
 * Demonstrates all tile features with live configuration
 */
export function TileConfiguratorApp() {
  const [config, setConfig] = useState({
    icon: 'Mail',
    title: 'Sample App',
    showBadge: true,
    badgeCount: 3,
    showControls: true,
    backgroundImage: null,
    widgetType: 'basic', // basic, progress, list, complex
    color: 'bg-blue-600', // Add color selection
    size: '1x1', // Add default size
    placedWidgets: [], // Store widgets with position: {id, x, y, widget}
    widgetHistory: [], // For undo functionality
    actionControls: [
      { id: 1, icon: 'Play', text: 'Action 1', color: 'bg-blue-600', enabled: true, span: { width: 1, height: 1 } },
      { id: 2, icon: 'Pause', text: 'Action 2', color: 'bg-green-600', enabled: true, span: { width: 1, height: 1 } },
      { id: 3, icon: 'Stop', text: 'Action 3', color: 'bg-red-600', enabled: true, span: { width: 1, height: 1 } }
    ]
  });

  const [draggedWidget, setDraggedWidget] = useState(null);
  const [dragCounter, setDragCounter] = useState(0);

  // Global handlers for widget drag operations
  useEffect(() => {
    window.handleWidgetDragStart = (widget) => {
      setDraggedWidget(widget);
    };
    window.handleWidgetDragEnd = () => {
      setDraggedWidget(null);
    };
    return () => {
      delete window.handleWidgetDragStart;
      delete window.handleWidgetDragEnd;
    };
  }, []);

  const handleDragStart = (e, widget) => {
    e.dataTransfer.setData('application/json', JSON.stringify(widget));
    e.dataTransfer.effectAllowed = 'copy';
    setDraggedWidget(widget);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDraggedWidget(null);
    setDragCounter(0);
    
    try {
      const tileRect = e.currentTarget.getBoundingClientRect();
      const [cols, rows] = config.size.split('x').map(Number);
      
      // Check if this is a widget move operation
      const dragData = e.dataTransfer.getData('application/json');
      if (dragData) {
        const parsedData = JSON.parse(dragData);
        if (parsedData.type === 'move') {
          // This is a widget move operation
          const { widgetId } = parsedData;
          
          // Calculate drop position
          const relativeX = e.clientX - tileRect.left;
          const relativeY = e.clientY - tileRect.top;
          
          // Calculate grid cell size (accounting for padding)
          const padding = 24; // 12px * 2
          const availableWidth = tileRect.width - padding;
          const availableHeight = tileRect.height - padding;
          
          const cellWidth = availableWidth / cols;
          const cellHeight = availableHeight / rows;
          
          // Calculate grid coordinates
          const gridX = Math.floor((relativeX - padding/2) / cellWidth);
          const gridY = Math.floor((relativeY - padding/2) / cellHeight);
          
          // Clamp to valid grid positions
          const clampedX = Math.max(0, Math.min(gridX, cols - 1));
          const clampedY = Math.max(0, Math.min(gridY, rows - 1));
          
          // Check if dropped outside the tile (for removal)
          if (e.clientX < tileRect.left || e.clientX > tileRect.right || 
              e.clientY < tileRect.top || e.clientY > tileRect.bottom) {
            // Remove the widget
            const newPlacedWidgets = config.placedWidgets.filter(w => w.id !== widgetId);
            setConfig({
              ...config,
              placedWidgets: newPlacedWidgets,
              widgetHistory: [...config.widgetHistory, config.placedWidgets]
            });
            return;
          }
          
          // Check if position is valid
          if (!isValidGridPosition(config.size, clampedX, clampedY)) {
            return;
          }
          
          // Check if position is already occupied by another widget (accounting for multi-cell widgets)
          const existingWidget = config.placedWidgets.find(w => w.id === widgetId);
          if (!existingWidget) return;
          
          const [widgetCols, widgetRows] = existingWidget.widget.size.split('x').map(Number);
          const isOccupied = config.placedWidgets.some(w => {
            if (w.id === widgetId) return false; // Don't check against itself
            const [existingCols, existingRows] = w.widget.size.split('x').map(Number);
            
            // Check if the moved widget overlaps with this existing widget
            const newRight = clampedX + widgetCols;
            const newBottom = clampedY + widgetRows;
            const existingRight = w.x + existingCols;
            const existingBottom = w.y + existingRows;
            
            return !(clampedX >= existingRight || newRight <= w.x || 
                     clampedY >= existingBottom || newBottom <= w.y);
          });
          
          if (isOccupied) {
            return;
          }
          
          // Move the widget to the new position
          const newPlacedWidgets = config.placedWidgets.map(w => 
            w.id === widgetId ? { ...w, x: clampedX, y: clampedY } : w
          );
          
          setConfig({
            ...config,
            placedWidgets: newPlacedWidgets,
            widgetHistory: [...config.widgetHistory, config.placedWidgets]
          });
          return;
        }
      }
      
      // Original logic for new widget placement
      if (!draggedWidget) return;
      
      // Calculate grid position based on drop location
      const relativeX = e.clientX - tileRect.left;
      const relativeY = e.clientY - tileRect.top;
      
      // Calculate grid cell size (accounting for padding)
      const padding = 24; // 12px * 2
      const availableWidth = tileRect.width - padding;
      const availableHeight = tileRect.height - padding;
      
      const cellWidth = availableWidth / cols;
      const cellHeight = availableHeight / rows;
      
      // Calculate grid coordinates
      const gridX = Math.floor((relativeX - padding/2) / cellWidth);
      const gridY = Math.floor((relativeY - padding/2) / cellHeight);
      
      // Clamp to valid grid positions
      const clampedX = Math.max(0, Math.min(gridX, cols - 1));
      const clampedY = Math.max(0, Math.min(gridY, rows - 1));
      
      // Check if position is available (not occupied by title/action areas for small tiles)
      if (!isValidGridPosition(config.size, clampedX, clampedY)) {
        return;
      }
      
      // Check if position is already occupied (accounting for multi-cell widgets)
      const [widgetCols, widgetRows] = draggedWidget.size.split('x').map(Number);
      const isOccupied = config.placedWidgets.some(existingWidget => {
        if (existingWidget.id === undefined) return false; // Skip invalid widgets
        const [existingCols, existingRows] = existingWidget.widget.size.split('x').map(Number);
        
        // Check if the new widget overlaps with this existing widget
        const newRight = clampedX + widgetCols;
        const newBottom = clampedY + widgetRows;
        const existingRight = existingWidget.x + existingCols;
        const existingBottom = existingWidget.y + existingRows;
        
        return !(clampedX >= existingRight || newRight <= existingWidget.x || 
                 clampedY >= existingBottom || newBottom <= existingWidget.y);
      });
      
      if (isOccupied) {
        return;
      }
      
      // Add widget at the calculated position
      const newWidget = {
        id: Date.now(), // Unique ID for the placed widget
        x: clampedX,
        y: clampedY,
        widget: draggedWidget
      };
      
      const newPlacedWidgets = [...config.placedWidgets, newWidget];
      
      setConfig({
        ...config,
        placedWidgets: newPlacedWidgets,
        widgetHistory: [...config.widgetHistory, config.placedWidgets] // Save state for undo
      });
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setDragCounter(prev => prev + 1);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragCounter(prev => {
      const newCounter = prev - 1;
      if (newCounter <= 0) {
        setDraggedWidget(null);
        return 0;
      }
      return newCounter;
    });
  };

  const isValidGridPosition = (size, x, y) => {
    const [cols, rows] = size.split('x').map(Number);
    
    // For 1x1 tiles, no valid positions (only title and action controls)
    if (cols === 1 && rows === 1) return false;
    
    // For all other tiles that support widgets, all grid positions are valid
    return true;
  };

  const getAvailableSlots = (size) => {
    const [cols, rows] = size.split('x').map(Number);
    if (cols === 1 && rows === 1) return 0;
    // All grid positions are available for widget placement
    return cols * rows;
  };

  const handleReset = () => {
    setConfig({
      ...config,
      placedWidgets: [],
      widgetHistory: [...config.widgetHistory, config.placedWidgets]
    });
  };

  const handleUndo = () => {
    if (config.widgetHistory.length > 0) {
      const previousState = config.widgetHistory[config.widgetHistory.length - 1];
      const newHistory = config.widgetHistory.slice(0, -1);
      
      setConfig({
        ...config,
        placedWidgets: previousState,
        widgetHistory: newHistory
      });
    }
  };

  const handleSelectWidget = (widget) => {
    // For select widget, we'll place it in the first available position
    const [cols, rows] = config.size.split('x').map(Number);
    const [widgetCols, widgetRows] = widget.size.split('x').map(Number);
    
    // Find first available position that can fit the widget
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (isValidGridPosition(config.size, x, y) && x + widgetCols <= cols && y + widgetRows <= rows) {
          // Check if this position is occupied by any existing widget
          const isOccupied = config.placedWidgets.some(existingWidget => {
            const [existingCols, existingRows] = existingWidget.widget.size.split('x').map(Number);
            
            // Check for overlap
            const newRight = x + widgetCols;
            const newBottom = y + widgetRows;
            const existingRight = existingWidget.x + existingCols;
            const existingBottom = existingWidget.y + existingRows;
            
            return !(x >= existingRight || newRight <= existingWidget.x || 
                     y >= existingBottom || newBottom <= existingWidget.y);
          });
          
          if (!isOccupied) {
            const newWidget = {
              id: Date.now(),
              x,
              y,
              widget
            };
            
            setConfig({
              ...config,
              placedWidgets: [...config.placedWidgets, newWidget],
              widgetHistory: [...config.widgetHistory, config.placedWidgets]
            });
            return;
          }
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Top Panel - Preview */}
      <div className="h-1/2 p-8 border-b border-white/10">
        <div className="h-full flex items-center justify-center">
          <TilePreview 
            config={config} 
            onDrop={handleDrop} 
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            draggedWidget={draggedWidget}
            isValidGridPosition={isValidGridPosition}
          />
        </div>
      </div>

      {/* Bottom Panel - Inputs and Widget Library */}
      <div className="h-1/2 overflow-y-auto">
        <div className="flex min-h-full">
          {/* Configuration Inputs */}
          <div className="flex-1 p-8 border-r border-white/10">
            <TileInputs config={config} setConfig={setConfig} />
          </div>

          {/* Widget Library */}
          <div className="w-80 p-6">
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleReset}
                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleUndo}
                disabled={config.widgetHistory.length === 0}
                className="flex-1 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
              >
                Undo
              </button>
            </div>
            <WidgetLibrary 
              onSelectWidget={handleSelectWidget} 
              onDragStart={handleDragStart} 
              tileSize={config.size}
              placedWidgetsCount={config.placedWidgets.length}
              availableSlots={getAvailableSlots(config.size)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
