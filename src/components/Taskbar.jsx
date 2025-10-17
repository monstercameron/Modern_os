import React, { useState, useRef, memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Wifi, 
  Battery, 
  Volume2, 
  ChevronDown, 
  Minimize2, 
  Maximize2, 
  X 
} from 'lucide-react';
import { TB, SN, clampX } from '../utils/constants.js';
import { NotificationCenter } from './NotificationCenter.jsx';
import { useSettings } from '../hooks/useSettings.jsx';
import eventBus, { TOPICS } from '../utils/eventBus.js';

// Fixed: showQuickSettings error - using showNotificationCenter instead
// Refactored: Now uses event bus for window control communication

/**
 * Taskbar preview popup (shows window preview on hover)
 */
const TaskbarPreview = memo(function TaskbarPreview({ win, cx, onClose, onMinMax, onActivate, onMouseEnter, onMouseLeave }) {
  const W = 280;
  const top = TB + 1;
  const left = clampX(cx - W / 2, W);

  return (
    <div 
      className="absolute z-[1600]" 
      style={{ left, top }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <motion.div 
        initial={{ opacity: 0, y: -4 }} 
        animate={{ opacity: 1, y: 0 }} 
        exit={{ opacity: 0, y: -4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
        className="mt-0.5 border shadow-lg w-[280px]"
        style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}
      >
        <div 
          className="flex items-center justify-between px-3 py-2 border-b" 
          style={{ borderColor: 'var(--theme-border)' }}
        >
          <div className="text-xs font-semibold truncate pr-2">{win.t}</div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => { onActivate(); onClose(); }} 
              className="px-2 py-1 hover:bg-white/10" 
              title={win.m ? "Unminimize" : win.id === win.actId ? "Minimize" : "Activate"}
            >
              <ChevronDown size={16}/>
            </button>
            <button 
              onClick={() => { onMinMax(); onClose(); }} 
              className="px-2 py-1 hover:bg-white/10" 
              title={win.sn === SN.FULL ? "Restore" : "Maximize"}
            >
              {win.sn === SN.FULL ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
            </button>
            <button 
              onClick={() => { win.onClose(); onClose(); }} 
              className="px-2 py-1 hover:bg-white/10" 
              title="Close"
            >
              <X size={16}/>
            </button>
          </div>
        </div>
        <div 
          className="relative" 
          onClick={() => { onActivate(); onClose(); }}
        >
          <div className="h-[150px] bg-white grid place-items-center text-slate-500 cursor-pointer">
            <div className="text-xs">Preview</div>
          </div>
          <div className="absolute inset-0 pointer-events-none border-2 border-white/10"></div>
        </div>
      </motion.div>
    </div>
  );
});

/**
 * Top taskbar with window buttons, system tray, and clock
 * Now decoupled from App.jsx - uses event bus for window control
 */
export const Taskbar = memo(function Taskbar({ windows, activeId, clock }) {
  const [preview, setPreview] = useState({ id: null, cx: 0 });
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const previewTimer = useRef(null);
  const { settings } = useSettings();

  // Handle window button clicks via event bus
  const handleWindowClick = useCallback((winId, isMinimized, isActive) => {
    eventBus.publish(TOPICS.TASKBAR_WINDOW_CLICK, { winId, isMinimized, isActive });
  }, []);

  // Handle window actions via event bus
  const handleWindowAction = useCallback((winId, action) => {
    eventBus.publish(TOPICS.TASKBAR_WINDOW_ACTION, { winId, action });
  }, []);

  const handleMouseEnter = useCallback((e, winId) => {
    const r = e.currentTarget.getBoundingClientRect();
    if (previewTimer.current) {
      clearTimeout(previewTimer.current);
      previewTimer.current = null;
    }
    setPreview({ id: winId, cx: r.left + r.width / 2 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => setPreview({ id: null, cx: 0 }), 250);
  }, []);

  const handlePreviewMouseEnter = useCallback(() => {
    if (previewTimer.current) {
      clearTimeout(previewTimer.current);
      previewTimer.current = null;
    }
    setPreview(p => ({ ...p }));
  }, []);

  const handlePreviewMouseLeave = useCallback(() => {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => setPreview({ id: null, cx: 0 }), 200);
  }, []);

  const previewWin = windows.find(w => w.id === preview.id);

  const handleSystemTrayClick = useCallback(() => {
    setShowNotificationCenter(prev => !prev);
  }, []);

  const handleCloseNotificationCenter = useCallback(() => {
    setShowNotificationCenter(false);
  }, []);

  return (
    <>
      {/* Taskbar */}
      <div 
        className="absolute top-0 left-0 right-0 h-10 px-3 flex items-center justify-between border-b" 
        style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}
      >
        <div className="flex items-center gap-1 ml-2">
          {windows.map(w => (
            <button
              key={w.id}
              onClick={() => handleWindowClick(w.id, w.m, w.id === activeId)}
              onMouseEnter={(e) => handleMouseEnter(e, w.id)}
              onMouseLeave={handleMouseLeave}
              className={`relative px-3 py-1.5 text-xs font-medium transition-all duration-200 border ${
                w.m 
                  ? "bg-slate-600/40 border-slate-500/50 text-slate-300 italic" 
                  : w.id === activeId 
                    ? "border-blue-400 text-white shadow-lg ring-2 ring-blue-300/50" 
                    : "border-white/20 text-white/90 hover:bg-white/15"
              }`}
              style={{
                backgroundColor: w.m 
                  ? 'rgba(100, 116, 139, 0.4)' 
                  : w.id === activeId 
                    ? 'var(--theme-accent)' 
                    : 'rgba(255, 255, 255, 0.1)',
                borderColor: w.m 
                  ? 'rgba(100, 116, 139, 0.5)' 
                  : w.id === activeId 
                    ? 'var(--theme-accent)' 
                    : 'rgba(255, 255, 255, 0.2)',
                color: w.m 
                  ? 'rgb(203, 213, 225)' 
                  : w.id === activeId 
                    ? 'var(--theme-text)' 
                    : 'rgba(255, 255, 255, 0.9)'
              }}
              title={w.m ? "Minimized - Click to restore" : w.id === activeId ? "Active window - Click to minimize" : "Inactive window - Click to activate"}
            >
              {w.t}
            </button>
          ))}
        </div>
        
        {/* System tray - now clickable */}
        <button
          onClick={handleSystemTrayClick}
          className="flex items-center gap-3 text-white/80 px-2 py-1 rounded hover:bg-white/10 transition-colors"
          title="Quick Settings"
        >
          <Wifi size={18} className={settings.system.wifi ? '' : 'opacity-40'}/>
          <Volume2 size={18} className={settings.system.volume === 0 ? 'opacity-40' : ''}/>
          <Battery size={18}/>
          <div className="text-sm tabular-nums">{clock}</div>
        </button>
      </div>

      {/* Taskbar preview popup */}
      {previewWin && (
        <TaskbarPreview
          win={previewWin}
          cx={preview.cx}
          onClose={() => setPreview({ id: null, cx: 0 })}
          onMinMax={() => {
            handleWindowAction(previewWin.id, previewWin.sn === SN.FULL ? 'unmax' : 'max');
          }}
          onActivate={() => {
            if (previewWin.m) {
              handleWindowAction(previewWin.id, 'unmin');
            }
            handleWindowAction(previewWin.id, 'activate');
          }}
          onMouseEnter={handlePreviewMouseEnter}
          onMouseLeave={handlePreviewMouseLeave}
        />
      )}

      {/* Notification Center overlay */}
      <NotificationCenter 
        isOpen={showNotificationCenter} 
        onClose={handleCloseNotificationCenter} 
      />
    </>
  );
});
