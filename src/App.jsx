import React, { useEffect, useState, useCallback, memo } from "react";
import { APPS } from "./config/apps.js";
import { useWindowManager, hydrateTileSizes } from "./hooks/useWindowManager.js";
import { useClock } from "./hooks/useClock.js";
import { useSettingsShortcuts } from "./hooks/useSettings.jsx";
import { useDesktopKeymap } from "./hooks/useDesktopKeymap.js";
import { runSmokeTests } from "./tests/smokeTests.js";
import { Taskbar } from "./components/Taskbar.jsx";
import { SnapOverlay } from "./components/SnapOverlay.jsx";
import { Win } from "./components/Win.jsx";
import { AppErrorBoundary } from "./components/ErrorBoundary.jsx";
import { StubApp } from "./apps/StubApp.jsx";
import { Launcher } from "./features/launcher/Launcher.jsx";
import { ShortcutHelper } from "./features/shortcuts/ShortcutHelper.jsx";
import { ResizeModeBar } from "./features/shortcuts/ResizeModeBar.jsx";
import { useKernel, dispatch, actions, select } from "./kernel/index.js";
import { migrateLegacyKeys } from "./services/persistence.js";
import eventBus from "./utils/eventBus.js";

const APP_BY_ID = new Map(APPS.map((a) => [a.id, a]));

const WindowWrapper = memo(function WindowWrapper({ win, active, setActive, act, AppComponent, app }) {
  const handleAction = useCallback((type, payload) => act(win.id, type, payload), [act, win.id]);

  return (
    <Win win={win} active={active} setActive={setActive} on={handleAction} app={app}>
      <AppErrorBoundary appId={win.appId} appName={win.t}>
        {/* data-app-surface is what the theme bridge in index.css hangs off,
            so an app inherits the theme even when it hardcodes Tailwind
            neutrals internally. */}
        <div className="w-full h-full" data-app-surface data-app-id={win.appId}>
          <AppComponent init={win.init} />
        </div>
      </AppErrorBoundary>
    </Win>
  );
}, (prev, next) =>
  prev.win.id === next.win.id &&
  prev.win.b === next.win.b &&
  prev.win.sn === next.win.sn &&
  prev.win.z === next.win.z &&
  prev.win.ws === next.win.ws &&
  prev.active === next.active &&
  prev.AppComponent === next.AppComponent
);

// Boot-time work that must happen once, before the first render commits.
migrateLegacyKeys();
hydrateTileSizes();

export default function App() {
  const { actId, badges, drag, animatingBadge, setActive, openA, act } = useWindowManager();
  const clock = useClock();
  useSettingsShortcuts();
  useDesktopKeymap();

  const visibleWindows = useKernel(select.visibleWindows);
  const workspaceWindows = useKernel(select.windowsOnWorkspace);

  const [tests, setTests] = useState({ ran: false, pass: true, list: [] });

  // Smoke tests read the viewport, so run them after layout has settled.
  useEffect(() => {
    const id = requestAnimationFrame(() => setTests(runSmokeTests(StubApp)));
    return () => cancelAnimationFrame(id);
  }, []);

  // Tile edit mode is published by long-press and by the tile context menu.
  useEffect(() => {
    const offEnter = eventBus.subscribe(eventBus.TOPICS.TILE_LONG_PRESS, () =>
      dispatch(actions.setTileEditMode(true))
    );
    const offExit = eventBus.subscribe(eventBus.TOPICS.TILE_EDIT_EXIT, () =>
      dispatch(actions.setTileEditMode(false))
    );
    return () => { offEnter(); offExit(); };
  }, []);

  return (
    <div
      className="relative w-full h-[100vh] font-sans text-slate-900 overflow-hidden"
      style={{ backgroundColor: 'var(--theme-background)' }}
      data-desktop
    >
      <Taskbar windows={workspaceWindows} activeId={actId} clock={clock} />

      {/* Windows on the current workspace */}
      {visibleWindows.map((w) => {
        const app = APP_BY_ID.get(w.appId);
        return (
          <WindowWrapper
            key={w.id}
            win={w}
            active={w.id === actId}
            setActive={setActive}
            act={act}
            AppComponent={app?.content || StubApp}
            app={app}
          />
        );
      })}

      <SnapOverlay drag={drag} />

      {/* Start screen, above the windows */}
      <Launcher
        apps={APPS}
        badges={badges}
        onOpen={openA}
        onQuick={openA}
        animatingBadge={animatingBadge}
      />

      {/* Hold the modifier to see what is bound. */}
      <ShortcutHelper />
      <ResizeModeBar />

      <div
        className={`absolute bottom-1 right-1 px-2 py-1 text-[10px] z-[1700] ${
          tests.pass ? "bg-emerald-700" : "bg-rose-700"
        } text-white/90`}
      >
        tests: {tests.pass ? "pass" : "fail"}
      </div>
    </div>
  );
}
