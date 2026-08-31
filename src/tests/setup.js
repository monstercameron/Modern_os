/**
 * Test setup.
 *
 * Runs for every test file. In Node it does almost nothing; under jsdom it
 * fills the handful of browser APIs jsdom does not implement but the desktop
 * uses on every render, so a component test fails for a real reason rather
 * than because ResizeObserver is missing.
 */

import { afterEach, expect } from 'vitest';

const inDom = typeof window !== 'undefined';

if (inDom) {
  /*
   * jsdom under an opaque origin has no localStorage, and the settings
   * provider reads it during its very first render — so every component test
   * failed with "Cannot read properties of undefined" before the component
   * under test had done anything. A plain in-memory implementation is closer
   * to what the tests want anyway: each file starts empty, with no leakage
   * between runs.
   */
  if (!globalThis.localStorage) {
    const store = new Map();
    const storage = {
      getItem: (k) => (store.has(String(k)) ? store.get(String(k)) : null),
      setItem: (k, v) => { store.set(String(k), String(v)); },
      removeItem: (k) => { store.delete(String(k)); },
      clear: () => store.clear(),
      key: (i) => [...store.keys()][i] ?? null,
      get length() { return store.size; },
    };
    Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
    Object.defineProperty(globalThis, 'sessionStorage', { value: storage, configurable: true });
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
      Object.defineProperty(window, 'sessionStorage', { value: storage, configurable: true });
    }
  }

  // jsdom has none of these, and the shell calls all three on mount.
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  if (!window.matchMedia) {
    window.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    });
  }
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
    window.cancelAnimationFrame = (id) => clearTimeout(id);
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = function scrollIntoView() {};
  }

  /*
   * jsdom reports every element as zero-sized, which would make the focus
   * helpers treat every control as hidden and the tiling look empty. Give
   * elements a plausible box so layout-dependent code has something to read.
   */
  if (!Element.prototype.__boxPatched) {
    Element.prototype.__boxPatched = true;
    const realGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function patched() {
      const rect = realGetBoundingClientRect.call(this);
      if (rect.width || rect.height) return rect;
      const w = Number.parseFloat(this.style?.width) || 100;
      const h = Number.parseFloat(this.style?.height) || 20;
      const x = Number.parseFloat(this.style?.left) || 0;
      const y = Number.parseFloat(this.style?.top) || 0;
      return {
        x, y, width: w, height: h, top: y, left: x, right: x + w, bottom: y + h,
        toJSON() { return this; },
      };
    };
  }

  // offsetParent is null for everything in jsdom, which the focus helpers read
  // as "not rendered". Report the parent element instead.
  if (!Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetParent')?.get) {
    Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
      get() { return this.parentElement; },
      configurable: true,
    });
  }
}

/** Fail a test if the component logged a React error or warning. */
const consoleErrors = [];
if (inDom) {
  const real = console.error;
  console.error = (...args) => {
    consoleErrors.push(args.map((a) => String(a?.message ?? a)).join(' '));
    real(...args);
  };
}

afterEach(() => {
  const found = consoleErrors.splice(0, consoleErrors.length)
    // React's act() advice is noise for these tests; real errors are not.
    .filter((line) => !/not wrapped in act|ReactDOMTestUtils/.test(line));
  expect(found, `component logged errors:\n${found.join('\n')}`).toEqual([]);
});
