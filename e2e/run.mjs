/**
 * End-to-end tests against a real browser.
 *
 * Everything else in the suite dispatches synthetic events or calls the kernel
 * directly. Neither proves that pressing a key on a keyboard reaches a binding:
 * a synthetic KeyboardEvent has `isTrusted: false`, skips the browser's own
 * shortcut handling, and will happily "pass" against a keymap that a real
 * browser would never deliver to. These press real keys.
 *
 * It drives Edge over CDP rather than through puppeteer's own launcher, which
 * cannot start this Edge build — see connect() below.
 *
 * Usage: node e2e/run.mjs [url]
 */

import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.argv[2] || 'http://localhost:5173';
const PORT = 9444;
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

let passed = 0;
const failures = [];

const check = (name, ok, detail = '') => {
  if (ok) { passed += 1; console.log(`  ok   ${name}`); }
  else { failures.push(`${name}${detail ? ` — ${detail}` : ''}`); console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`); }
};

/** Wait for a condition in the page, so nothing depends on a fixed sleep. */
async function until(page, fn, label, timeout = 8000) {
  try {
    await page.waitForFunction(fn, { timeout, polling: 100 });
    return true;
  } catch {
    console.log(`  (timed out waiting for ${label})`);
    return false;
  }
}

const kernel = (page, fn, ...args) => page.evaluate(fn, ...args);

async function main() {
  const profile = mkdtempSync(join(tmpdir(), 'modernos-e2e-'));
  const edge = spawn(EDGE, [
    '--headless=new', '--disable-gpu', '--no-sandbox',
    '--no-first-run', '--no-default-browser-check',
    `--remote-debugging-port=${PORT}`,
    '--window-size=1400,900', '--hide-scrollbars',
    `--user-data-dir=${profile}`,
    'about:blank',
  ], { stdio: 'ignore' });

  // Wait for CDP rather than guessing how long Edge takes to come up.
  let browser;
  for (let i = 0; i < 40; i += 1) {
    try {
      browser = await puppeteer.connect({
        browserURL: `http://127.0.0.1:${PORT}`,
        defaultViewport: { width: 1400, height: 900 },
        // The desktop can be busy mid-animation; the default 30s is enough
        // until a step lands while framer-motion is settling a dozen windows.
        protocolTimeout: 60000,
      });
      break;
    } catch { await sleep(250); }
  }
  if (!browser) throw new Error('Edge never exposed a debugging port');

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e.message)));
  page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(m.text()); });

  await page.goto(URL, { waitUntil: 'networkidle2' });
  await page.waitForFunction('!!globalThis.__kernel', { timeout: 20000 });

  const reset = async () => {
    await kernel(page, () => {
      const K = globalThis.__kernel;
      K.store.getState().windows.slice().forEach((w) => K.dispatch(K.actions.closeWindow(w.id)));
      K.dispatch(K.actions.setWorkspaceCount(5));
      K.dispatch(K.actions.switchWorkspace(1));
      K.dispatch(K.actions.closeLauncher());
    });
    await sleep(400);
  };

  const openApps = async (ids) => {
    await kernel(page, async (list) => {
      const K = globalThis.__kernel;
      const { APPS } = await import('/src/config/apps.js');
      K.dispatch(K.actions.closeLauncher());
      for (const id of list) K.dispatch(K.actions.openWindow(APPS.find((a) => a.id === id), {}));
    }, ids);
    await until(page, `document.querySelectorAll('[data-window]').length === ${ids.length}`, 'windows');
    await sleep(700);
  };

  const state = () => kernel(page, () => {
    const s = globalThis.__kernel.store.getState();
    return {
      activeId: s.activeId,
      workspace: s.workspaces.current,
      launcherOpen: s.launcherOpen,
      resizeMode: s.resizeMode,
      windows: s.windows.map((w) => ({
        id: w.id, appId: w.appId, ws: w.ws, m: w.m, floating: w.floating, sn: w.sn, b: w.b,
      })),
    };
  });

  const mod = async (key, extra = []) => {
    await page.keyboard.down('Control');
    await page.keyboard.down('Shift');
    for (const k of extra) await page.keyboard.down(k);
    await page.keyboard.press(key);
    for (const k of [...extra].reverse()) await page.keyboard.up(k);
    await page.keyboard.up('Shift');
    await page.keyboard.up('Control');
    await sleep(450);
  };

  console.log(`\ne2e against ${URL}\n`);

  // ---------------------------------------------------------------- keyboard
  console.log('real keystrokes reach the window manager');
  await reset();
  await openApps(['terminal', 'browser', 'notes']);

  let before = await state();
  await mod('ArrowLeft');
  let after = await state();
  check('Ctrl+Shift+Left moves focus', after.activeId !== before.activeId,
    `${before.activeId} -> ${after.activeId}`);

  before = after;
  await mod('ArrowRight', ['Alt']);
  after = await state();
  const movedA = before.windows.find((w) => w.id === before.activeId);
  const movedB = after.windows.find((w) => w.id === before.activeId);
  check('Ctrl+Shift+Alt+Right rearranges the layout',
    JSON.stringify(movedA.b) !== JSON.stringify(movedB.b),
    `${JSON.stringify(movedA.b)} -> ${JSON.stringify(movedB.b)}`);
  check('and it stays tiled', movedB.floating === false);

  await mod('Digit3');
  check('Ctrl+Shift+3 switches workspace', (await state()).workspace === 3);
  await mod('Digit1');
  check('and back', (await state()).workspace === 1);

  await mod('KeyV');
  after = await state();
  check('Ctrl+Shift+V floats the focused window',
    after.windows.find((w) => w.id === after.activeId).floating === true);
  await mod('KeyV');

  await mod('KeyH');
  after = await state();
  check('Ctrl+Shift+H hides it', after.windows.some((w) => w.m));
  await mod('KeyU');
  after = await state();
  check('Ctrl+Shift+U brings it back', after.windows.every((w) => !w.m));

  // ------------------------------------------------------ typing does not eat
  console.log('\nthe window manager works while the caret is in a field');
  await reset();
  await openApps(['terminal', 'notes']);
  await page.evaluate(() => {
    const field = document.querySelector('[data-window] input, [data-window] textarea');
    if (field) field.focus();
  });
  await page.keyboard.type('hello');
  const typed = await page.evaluate(() => document.activeElement.value || '');
  check('typing reaches the field', typed.includes('hello'), typed);
  await mod('Digit4');
  check('Ctrl+Shift+4 still switches workspace while typing', (await state()).workspace === 4);
  await mod('Digit1');

  // ------------------------------------------------------------- resize mode
  console.log('\nresize mode');
  await reset();
  await openApps(['terminal', 'notes']);
  await mod('KeyS');
  check('Ctrl+Shift+S latches resize mode', (await state()).resizeMode === true);
  check('and says so on screen', await page.$('[data-resize-mode]') !== null);

  before = await state();
  await page.keyboard.press('ArrowRight');
  await sleep(500);
  after = await state();
  const sizedBefore = before.windows.find((w) => w.id === before.activeId).b.w;
  const sizedAfter = after.windows.find((w) => w.id === before.activeId).b.w;
  check('a bare arrow resizes in resize mode', sizedBefore !== sizedAfter,
    `${sizedBefore} -> ${sizedAfter}`);

  await page.keyboard.press('Escape');
  await sleep(400);
  check('Escape leaves resize mode', (await state()).resizeMode === false);

  // ----------------------------------------------------------------- the hold
  console.log('\nhold-to-remember');
  await reset();
  await openApps(['terminal']);
  await page.keyboard.down('Control');
  await page.keyboard.down('Shift');
  const shown = await until(page, () => !!document.querySelector('[data-shortcut-helper]'), 'cheatsheet');
  check('holding Ctrl+Shift shows the bindings', shown);
  if (shown) {
    const text = await page.$eval('[data-shortcut-helper]', (el) => el.innerText);
    check('it lists the live keymap', /Focus the window/.test(text) && /workspace/i.test(text));
  }
  await page.keyboard.up('Shift');
  await page.keyboard.up('Control');
  check('releasing dismisses it',
    await until(page, () => !document.querySelector('[data-shortcut-helper]'), 'cheatsheet gone'));

  // ------------------------------------------------------------------- focus
  console.log('\nfocus and Tab');
  await reset();
  await openApps(['notes', 'browser']);

  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const ring = await page.evaluate(() => {
    const el = document.activeElement;
    const cs = getComputedStyle(el);
    return {
      focusVisible: el.matches(':focus-visible'),
      outline: cs.outlineStyle,
      width: cs.outlineWidth,
      inWindow: !!el.closest('[data-window]'),
    };
  });
  check('a real Tab shows a focus ring', ring.focusVisible && ring.outline !== 'none',
    JSON.stringify(ring));

  const contained = await page.evaluate(async () => {
    const win = document.querySelector('[data-window][data-focused="true"]');
    if (!win) return { ok: false, why: 'no focused window' };
    const F = await import('/src/utils/focus.js');
    const items = F.focusablesIn(win);
    if (items.length < 2) return { ok: true, why: 'too few controls to wrap' };
    items[items.length - 1].focus();
    return { ok: true, last: items[items.length - 1] === document.activeElement };
  });
  if (contained.ok && contained.last) {
    await page.keyboard.press('Tab');
    const stayed = await page.evaluate(() =>
      !!document.activeElement.closest('[data-window][data-focused="true"]'));
    check('Tab wraps inside the focused window instead of leaving it', stayed);
  }

  // --------------------------------------------------------------- the mouse
  console.log('\nmouse');
  await reset();
  await kernel(page, () => globalThis.__kernel.dispatch(globalThis.__kernel.actions.openLauncher()));
  await until(page, () => !!document.querySelector('[data-tile="terminal"]'), 'tiles');
  const tile = await page.$('[data-tile="terminal"]');
  await tile.click();
  const opened = await until(page, () => globalThis.__kernel.store.getState().windows.length === 1, 'window from a click');
  check('clicking a tile opens its app', opened);

  await reset();
  await openApps(['terminal']);
  await mod('KeyV');
  const box = await page.$eval('[data-window] [data-titlebar]', (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }).catch(() => null);
  if (box) {
    const startB = (await state()).windows[0].b;
    await page.mouse.move(box.x, box.y);
    await page.mouse.down();
    await page.mouse.move(box.x - 200, box.y + 120, { steps: 12 });
    await page.mouse.up();
    await sleep(700);
    const endB = (await state()).windows[0].b;
    check('dragging a floating window by its title bar moves it',
      startB.x !== endB.x || startB.y !== endB.y,
      `${JSON.stringify(startB)} -> ${JSON.stringify(endB)}`);
  }

  // -------------------------------------------------------------- no errors
  console.log('\nhealth');
  check('no uncaught page errors during the run', pageErrors.length === 0,
    pageErrors.slice(0, 3).join(' | '));

  await browser.disconnect();
  edge.kill();

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log('\nfailures:');
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
