import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    /*
     * Which files get a DOM. Kernel tests are pure functions and run in Node,
     * where the 600-step fuzz finishes in milliseconds; anything that renders
     * a component needs jsdom. Matching on the filename beats a per-file
     * docblock, which is easy to leave off and silent when you do.
     */
    environmentMatchGlobs: [
      ['**/*.test.jsx', 'jsdom'],
      ['**/*.dom.test.js', 'jsdom'],
    ],
    /*
     * jsdom defaults to an opaque origin, and an opaque origin has no
     * localStorage — so the settings provider threw on every render and every
     * component test failed for a reason that had nothing to do with the
     * component. Give it a real origin.
     */
    environmentOptions: { jsdom: { url: 'http://localhost:5173' } },
    setupFiles: ['./src/tests/setup.js'],
    // The e2e suite drives a real browser and is run separately by `npm run
    // test:e2e`; it must not be picked up here.
    exclude: ['**/node_modules/**', '**/dist/**', '**/docs/**', 'e2e/**'],
  },
})
