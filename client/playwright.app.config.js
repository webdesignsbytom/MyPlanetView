import { defineConfig, devices } from '@playwright/test';

// E2E for the signed-in travel pages (map, trips, photos, sharing), against the dev
// server in mock mode: the API is answered in the browser, signed in as the test user,
// with the demo data seeded fresh in each new browser context (src/dev/mock/). No server,
// no build, and no env file is read (there is no .env.mock).
// Run: npm run test:e2e:app (the public pages' tests are playwright.config.js).
const PORT = 5195;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e-app',
  // Waits out the dev server's cold start before the first test (warm-up.js)
  globalSetup: './tests/e2e-app/warm-up.js',
  fullyParallel: true,
  // One dev server serves every worker, and each page runs the whole mock API and makes
  // its photo copies on a canvas: four at a time stays quick without starving the machine
  workers: 4,
  // Tracing every test only to throw the trace away when it passes cost about 45% of a
  // run, so a test runs untraced, and one that fails runs once more with a trace
  // (on-first-retry, saved in test-results/). Passing on that retry still fails the run
  // (failOnFlakyTests): a flaky test is reported, never let through.
  retries: 1,
  failOnFlakyTests: true,
  reporter: 'list',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    // "Copy link" in the share dialog
    permissions: ['clipboard-read', 'clipboard-write'],
    // The map's animated sea never stops: two full-screen layers fading for ever (and the
    // waves canvas), so a map page draws 60 frames a second. Headless Chromium composites
    // them on the CPU, and a trace screencasts each frame: with four browsers at once the
    // pages starved, and steps of a few ms took 10–60 s (6–9 minute runs, timeouts).
    // The app honours reduced motion (no sea animation or waves, near-instant
    // transitions), so the pages sit still between steps. Nothing tested depends on motion.
    // (A context option: Playwright Test has no `reducedMotion` of its own and ignores one.)
    contextOptions: { reducedMotion: 'reduce' },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // The flows that differ on a phone (the map opens zoomed in, panels are sheets above
    // the toolbar along the bottom): the tests tagged @phone
    { name: 'phone', use: { ...devices['Pixel 7'] }, grep: /@phone/ },
  ],
  webServer: {
    // vite.e2e-app.config.js is the site's Vite config with its own dependency cache, every
    // file transformed at start-up and no tab opened (BROWSER=none as well, in case).
    // Its hot reload is kept away from the tests' pages (fixtures.js).
    command: `npx vite --config vite.e2e-app.config.js --mode mock --port ${PORT} --strictPort`,
    env: { BROWSER: 'none' },
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
