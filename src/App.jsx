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

// Memoized window wrapper to prevent unnecessary re-renders
const WindowWrapper = memo(({ win, active, setActive, act, AppComponent }) => {
  const handleAction = useCallback((type, payload) => act(win.id, type, payload), [act, win.id]);
  
  return (
    <Win win={win} active={active} setActive={setActive} on={handleAction}>
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
  const { wns, actId, badges, drag, setActive, openA, act, unmin } = useWindowManager();
  const clock = useClock();
  useSettingsShortcuts(); // Enable Ctrl+Shift+R keyboard shortcut
  const [tests, setTests] = useState({ ran: false, pass: true, list: [] });

  // Run smoke tests on mount
  useEffect(() => {
    const testResults = runSmokeTests(StubApp);
    setTests(testResults);
  }, []);

  // Handle window button clicks (minimize/restore/activate) - memoized
  const handleWindowClick = useCallback((winId, isMinimized, isActive) => {
    if (isMinimized) {
      unmin(winId);
      setActive(winId);
    } else if (isActive) {
      act(winId, "min");
    } else {
      setActive(winId);
    }
  }, [unmin, setActive, act]);

  // Handle window action from taskbar preview - memoized
  const handleWindowAction = useCallback((winId, action) => {
    if (action === 'activate') {
      setActive(winId);
    } else {
      act(winId, action);
    }
  }, [setActive, act]);

  // Memoize visible windows to prevent recalculation on every render
  const visibleWindows = useMemo(() => wns.filter(w => !w.m), [wns]);

  return (
    <div className="relative w-full h-[100vh] font-sans text-slate-900 overflow-hidden" style={{ backgroundColor: 'var(--theme-background)' }}>
      {/* Taskbar */}
      <Taskbar 
        windows={wns} 
        activeId={actId} 
        clock={clock} 
        onWindowClick={handleWindowClick}
        onWindowAction={handleWindowAction}
      />

      {/* Desktop grid */}
      <DesktopGrid 
        apps={APPS} 
        badges={badges} 
        onOpen={openA} 
        onQuick={openA} 
      />

      {/* Windows */}
      {visibleWindows.map(w => {
        const App = (APPS.find(a => a.id === w.appId)?.content || StubApp);
        return (
          <WindowWrapper 
            key={w.id} 
            win={w} 
            active={w.id===actId} 
            setActive={setActive} 
            act={act}
            AppComponent={App}
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


