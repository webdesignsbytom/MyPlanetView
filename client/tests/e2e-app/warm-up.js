// Global set-up for playwright.app.config.js: before any test starts, the dev server has
// pre-bundled its dependencies and transformed the app, the map page and every lazy page and
// map panel. A cold start takes a while, and no test's timeouts should pay for it.
import { chromium } from '@playwright/test';

const COLD_START_MS = 180_000;
const ATTEMPTS = 3;

async function loadEverything(page) {
  await page.goto('/map', { timeout: COLD_START_MS });
  await page.getByRole('application', { name: /: world map$/ }).waitFor({ timeout: COLD_START_MS });
  // ...and its loading screen gone: every panel's data in (MapExperience)
  await page.locator('[data-map-loading]').waitFor({ state: 'detached', timeout: COLD_START_MS });
  // The same modules the app imports (Vite serves them by these paths)
  await page.evaluate(async () => {
    const [pages, panels] = await Promise.all([
      import('/src/utils/navigation/lazyPages.js'),
      import('/src/components/map/lazyMapPanels.js'),
    ]);
    const lazy = [...Object.values(pages), ...Object.values(panels)].filter((item) => typeof item?.preload === 'function');
    await Promise.all(lazy.map((item) => item.preload()));
  });
}

export default async function warmUp(config) {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ baseURL });
    // No hot reload here either (a file saved meanwhile would reload the page mid-way)
    await page.routeWebSocket((url) => url.searchParams.has('token'), () => {});
    // Vite may re-bundle a dependency it meets for the first time, which fails that load:
    // the next attempt gets the new bundle
    for (let attempt = 1; ; attempt++) {
      try {
        await loadEverything(page);
        return;
      } catch (err) {
        if (attempt === ATTEMPTS) throw err;
      }
    }
  } finally {
    await browser.close();
  }
}
