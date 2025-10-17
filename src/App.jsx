import React, { useEffect, useState } from "react";
import { APPS } from "./config/apps.js";
import { useWindowManager } from "./hooks/useWindowManager.js";
import { useClock } from "./hooks/useClock.js";
import { runSmokeTests } from "./tests/smokeTests.js";
import { Taskbar } from "./components/Taskbar.jsx";
import { DesktopGrid } from "./components/DesktopGrid.jsx";
import { SnapOverlay } from "./components/SnapOverlay.jsx";
import { Win } from "./components/Win.jsx";
import { StubApp } from "./apps/StubApp.jsx";

// ---------- Desktop Environment ----------
export default function App() {
  // Use custom hooks for state management
  const { wns, actId, badges, drag, setActive, openA, act, unmin } = useWindowManager();
  const clock = useClock();
  const [tests, setTests] = useState({ ran: false, pass: true, list: [] });

  // Run smoke tests on mount
  useEffect(() => {
    const testResults = runSmokeTests(StubApp);
    setTests(testResults);
  }, []);

  // Handle window button clicks (minimize/restore/activate)
  const handleWindowClick = (winId, isMinimized, isActive) => {
    if (isMinimized) {
      unmin(winId);
      setActive(winId);
    } else if (isActive) {
      act(winId, "min");
    } else {
      setActive(winId);
    }
  };

  // Handle window action from taskbar preview
  const handleWindowAction = (winId, action) => {
    if (action === 'activate') {
      setActive(winId);
    } else {
      act(winId, action);
    }
  };

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
      {wns.filter(w => !w.m).map(w => {
        const App = (APPS.find(a => a.id === w.appId)?.content || StubApp);
        return (
          <Win key={w.id} win={w} active={w.id===actId} setActive={setActive} on={(t, p) => act(w.id, t, p)}>
            <div className="w-full h-full bg-white">
              <App init={w.init} />
            </div>
          </Win>
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


