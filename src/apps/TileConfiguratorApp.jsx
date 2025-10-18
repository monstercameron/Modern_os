import React, { useState } from 'react';
import { TileInputs } from './TileInputs.jsx';
import { TilePreview } from './TilePreview.jsx';

/**
 * Tile Configurator App
 * Demonstrates all tile features with live configuration
 */
export function TileConfiguratorApp() {
  const [config, setConfig] = useState({
    size: '1x1',
    icon: 'Mail',
    title: 'Sample App',
    showBadge: true,
    badgeCount: 3,
    showControls: true,
    backgroundImage: null,
    widgetType: 'basic', // basic, progress, list, complex
    color: 'bg-blue-600', // Add color selection
    actionControls: [
      { id: 1, icon: 'Play', text: 'Action 1', color: 'bg-blue-600', enabled: true, position: { x: 0, y: 0 }, span: { width: 1, height: 1 } },
      { id: 2, icon: 'Pause', text: 'Action 2', color: 'bg-green-600', enabled: true, position: { x: 1, y: 0 }, span: { width: 1, height: 1 } },
      { id: 3, icon: 'Stop', text: 'Action 3', color: 'bg-red-600', enabled: true, position: { x: 2, y: 0 }, span: { width: 1, height: 1 } }
    ]
  });

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Top Panel - Preview */}
      <div className="h-1/2 p-8 border-b border-white/10">
        <div className="h-full flex items-center justify-center">
          <TilePreview config={config} />
        </div>
      </div>

      {/* Bottom Panel - Inputs */}
      <div className="h-1/2 p-8 overflow-y-auto">
        <TileInputs config={config} setConfig={setConfig} />
      </div>
    </div>
  );
}
