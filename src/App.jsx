import React, { useEffect, useState, useCallback, useMemo, memo } from "react";
import { APPS } from "./config/apps.js";
import { useWindowManager } from "./hooks/useWindowManager.js";
import { useClock } from "./hooks/useClock.js";
import { useSettingsShortcuts } from "./hooks/useSettings.jsx";
import { runSmokeTests } from "./tests/smokeTests.js";
import { Taskbar } from "./components/Taskbar.jsx";
import { DesktopGrid } from "./components/DesktopGrid.jsx";
import { SnapOverlay } from "./components/SnapOverlay.jsx";
import { Win } from "./components/Win.jsx";
import { AppErrorBoundary } from "./components/ErrorBoundary.jsx";
import { StubApp } from "./apps/StubApp.jsx";
import eventBus from "./utils/eventBus.js";

// Memoized window wrapper to prevent unnecessary re-renders
const WindowWrapper = memo(({ win, active, setActive, act, AppComponent, app }) => {
  const handleAction = useCallback((type, payload) => act(win.id, type, payload), [act, win.id]);
  
  return (
    <Win win={win} active={active} setActive={setActive} on={handleAction} app={app}>
      <AppErrorBoundary appId={win.appId} appName={win.t}>
        <div className="w-full h-full bg-white">
          <AppComponent init={win.init} />
        </div>
      </AppErrorBoundary>
    </Win>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance
  return (
    prevProps.win.id === nextProps.win.id &&
    prevProps.win.b === nextProps.win.b &&
    prevProps.win.sn === nextProps.win.sn &&
    prevProps.win.z === nextProps.win.z &&
    prevProps.active === nextProps.active &&
    prevProps.AppComponent === nextProps.AppComponent
  );
});

// ---------- Desktop Environment ----------
export default function App() {
  // Use custom hooks for state management
  const { wns, actId, badges, drag, animatingBadge, setActive, openA, act, unmin } = useWindowManager();
  const clock = useClock();
  useSettingsShortcuts(); // Enable Ctrl+Shift+R keyboard shortcut
  const [tests, setTests] = useState({ ran: false, pass: true, list: [] });
  const [tileEditMode, setTileEditMode] = useState(false);
  const [tileSizes, setTileSizes] = useState(() => {
    const saved = localStorage.getItem('tileSizes');
    return saved ? JSON.parse(saved) : {};
  });

  // Run smoke tests on mount
  useEffect(() => {
    const testResults = runSmokeTests(StubApp);
    setTests(testResults);
  }, []);

  // Ctrl+Shift+Esc keyboard shortcut for Task Manager
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'Escape') {
        e.preventDefault();
        openA('taskmgr');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openA]);

  // Subscribe to tile long press
  useEffect(() => {
    const unsubscribe = eventBus.subscribe(eventBus.TOPICS.TILE_LONG_PRESS, () => {
      setTileEditMode(true);
    });
    const unsubscribeExit = eventBus.subscribe(eventBus.TOPICS.TILE_EDIT_EXIT, () => {
      setTileEditMode(false);
    });
    return () => {
      unsubscribe();
      unsubscribeExit();
    };
  }, []);

  // Update tile size
  const updateTileSize = useCallback((appId, size) => {
    setTileSizes(prev => {
      const newSizes = { ...prev, [appId]: size };
      localStorage.setItem('tileSizes', JSON.stringify(newSizes));
      return newSizes;
    });
  }, []);

  // Memoize visible windows to prevent recalculation on every render
  const visibleWindows = useMemo(() => wns.filter(w => !w.m), [wns]);

  return (
    <div className="relative w-full h-[100vh] font-sans text-slate-900 overflow-hidden" style={{ backgroundColor: 'var(--theme-background)' }}>
      {/* Taskbar */}
      <Taskbar 
        windows={wns} 
        activeId={actId} 
        clock={clock}
      />

      {/* Desktop grid */}
      <DesktopGrid 
        apps={APPS} 
        badges={badges} 
        onOpen={openA} 
        onQuick={openA}
        tileEditMode={tileEditMode}
        tileSizes={tileSizes}
        onUpdateTileSize={updateTileSize}
        animatingBadge={animatingBadge}
      />

      {/* Windows */}
      {visibleWindows.map(w => {
        const App = (APPS.find(a => a.id === w.appId)?.content || StubApp);
        const app = APPS.find(a => a.id === w.appId);
        return (
          <WindowWrapper 
            key={w.id} 
            win={w} 
            active={w.id===actId} 
            setActive={setActive} 
            act={act}
            AppComponent={App}
            app={app}
          />
        );
      })}

      {/* Drag snap overlay */}
      <SnapOverlay drag={drag} />

      {/* Tests status */}
      <div className={`absolute bottom-1 right-1 px-2 py-1 text-[10px] ${tests.pass ? "bg-emerald-700" : "bg-rose-700"} text-white/90`}>
        tests: {tests.pass ? "pass" : "fail"}
      </div>
    </div>
  );
}


