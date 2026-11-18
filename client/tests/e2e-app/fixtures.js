// Shared set-up for the travel-page tests (playwright.app.config.js). Every test gets a
// fresh browser context, so mock mode seeds its demo data afresh (src/dev/mock/seed.js):
// the test user owns "Charlie & Alex's travels" (8 countries, 2 continents, 16 photos, 3
// trips: two of its own and Tom's stag do, a group trip Alex added; 6 moments, one hidden).
import { test as base, expect } from '@playwright/test';
// Constants
import { COOKIE_POLICY_NAME } from '../../src/utils/constants/constants.js';
import { TIPS_SHOWN_KEY } from '../../src/utils/map/mapTips.js';
import { REGION_CODES } from '../../src/utils/map/regionPlaces.js';

// How many regions there are (Bali, the Azores…): the stats say "Regions 1 of <this>"
export const REGION_COUNT = REGION_CODES.length;

export { expect };

export const HOME_MAP = "Charlie & Alex's travels";
// Seeded maps and codes (seed.js): Sam's map is shared with anyone who has the link
export const SAM_MAP = "Sam's gap year";
export const SAM_SHARE_CODE = 'SAMG-4PYE-AR22';
export const HOME_SHARE_CODE = 'K7QX-M2PA-9RTW';
// Where mock mode keeps its demo data (src/dev/mock/store.js STORE_KEY)
export const MOCK_STORE_KEY = 'mpvMockStore.v5';

export const test = base.extend({
  // The tips the map opens with (MapTipsDialog) cover it, so every test starts as if they'd
  // shown already this visit; mapTips.spec.js turns this on to see them
  mapTips: [false, { option: true }],

  page: async ({ page, mapTips }, provide) => {
    // Vite's hot-reload socket, answered here and kept silent: a source file saved during
    // a run would otherwise reload the page in the middle of a test
    // (the app opens no other socket; Vite's is ws://<host>/?token=…)
    await page.routeWebSocket((url) => url.searchParams.has('token'), () => {});

    // A refusal is already on record: no cookie pop-up after 10 s (on a phone it covers the
    // map's toolbar), and no analytics
    await page.addInitScript((key) => {
      try {
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, JSON.stringify({ analytics: 'denied', version: '1.1.0', timestamp: new Date().toISOString() }));
        }
      } catch {
        // Storage blocked: the pop-up may show, which no test relies on
      }
    }, COOKIE_POLICY_NAME);

    if (!mapTips) {
      await page.addInitScript((key) => {
        try {
          sessionStorage.setItem(key, '1');
        } catch {
          // Storage blocked: the tips may show
        }
      }, TIPS_SHOWN_KEY);
    }

    // An uncaught error, or a mock handler that threw or is missing, fails the test
    const problems = [];
    page.on('pageerror', (err) => problems.push(`Uncaught: ${err.message}`));
    page.on('console', (msg) => {
      const text = msg.text();
      if (/Handler failed|No mock handler|Mock mode failed/.test(text)) problems.push(`Console: ${text}`);
    });

    await provide(page);
    expect(problems, 'errors in the page').toEqual([]);
  },
});

// The map page

/** Open a map page and wait for the map itself. */
export async function openMap(page, path = '/map') {
  await page.goto(path);
  await mapReady(page);
}

/**
 * The map is up and usable: drawn, and its loading screen gone (it stays over the map, the
 * map inert, until every panel's data is in: MapExperience, 17 Nov 2026).
 */
export async function mapReady(page) {
  await expect(page.getByRole('application', { name: /: world map$/ })).toBeVisible();
  await expect(page.locator('[data-map-loading]')).toHaveCount(0);
}

export const toolbar = (page) => page.getByRole('navigation', { name: 'Map tools' });

/**
 * Whether the map shows its banner (the map's name, top centre): wide screens (1024px and up,
 * the desktop project), with the banner switched on, as it is by default. The map has had no
 * title tag anywhere since 16 Nov 2026 (the user's wish).
 */
export const showsBanner = (page) => page.viewportSize().width >= 1024;

/** The map that's open, by the page's h1 (the banner shows the same name on wide screens). */
export const expectMapOpen = (page, name) => expect(page.getByRole('heading', { level: 1, name, exact: true })).toBeAttached();

/** Opens "Your maps", a tool like the others (openTool), on every screen. */
export const openSwitcher = (page) => openTool(page, 'Your maps', 'Your maps');

/**
 * Open the statistics from the tools (the stamp, or the phone's menu). The map had a stats
 * tag under its title until 16 Nov 2026.
 */
export const openStats = (page) => pressTool(page, 'Travel statistics');

/**
 * The map's counts, from the statistics stamp's description: "8 countries, 2 continents, 16
 * photos. Special places 0 of 5" (special places: Antarctica and the poles), and ". Regions
 * 1 of 7" once one's visited (out of every region: regionPlaces.js). Read from the page, as
 * the stamp is hidden on phones.
 */
export const expectStats = (page, text, specialPlaces = 0, regions = 0) =>
  expect
    .poll(() =>
      toolbar(page)
        // The wide stamp and the phone menu's item both carry the counts (one of them hidden)
        .locator('button[aria-label="Travel statistics"]')
        .first()
        .evaluate((stamp) => document.getElementById(stamp.getAttribute('aria-describedby'))?.textContent ?? ''),
    )
    .toBe(`${text}. Special places ${specialPlaces} of 5${regions ? `. Regions ${regions} of ${REGION_COUNT}` : ''}`);

/**
 * On a phone the map's tools are a "Menu" button at the top right that drops the list
 * (MapToolbar, 16 Nov 2026): open it, if it's there and shut. Wide screens show the stamps.
 */
export async function showTools(page) {
  // The tools first (after a reload the map may not have drawn them yet: isVisible doesn't wait)
  await expect(toolbar(page)).toBeVisible();
  const menu = toolbar(page).getByRole('button', { name: 'Menu', exact: true });
  if (!(await menu.isVisible()) || (await menu.getAttribute('aria-expanded')) === 'true') return;
  // On a phone an open panel covers the Menu stamp (17 Nov 2026): shut it first, as a person would
  const panels = page.locator('[data-map-panels]');
  if (await panels.count()) await panels.getByRole('button', { name: /^Close/ }).first().click();
  await menu.click();
}

/** One of the map's tools, by name: a stamp on wide screens, an item of the phone's menu (opened). */
export async function toolButton(page, label) {
  await showTools(page);
  return toolbar(page).getByRole('button', { name: label, exact: true });
}

/** Press one of the map's tools (through the phone's menu on a phone). */
export async function pressTool(page, label) {
  await (await toolButton(page, label)).click();
}

/** Press a toolbar stamp and return the panel it opens. */
export async function openTool(page, label, panelTitle) {
  await pressTool(page, label);
  const panel = page.getByRole('dialog', { name: panelTitle, exact: true });
  await expect(panel).toBeVisible();
  return panel;
}

/**
 * Open the upload panel ("Add photos"): the toolbar's Photos stamp opens the map's photos,
 * whose "Add photos" button (editors only) opens it (16 Nov 2026; the stamp opened it before).
 */
export async function openUploader(page) {
  const photos = await openTool(page, 'Photo album', 'Photo album');
  await photos.getByRole('button', { name: 'Add photos', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Add photos', exact: true });
  await expect(panel).toBeVisible();
  return panel;
}

/**
 * Tap or click a country on the map itself. The shapes have no role (the country list is
 * the accessible way in), so this finds a point of the shape that is on screen and not
 * under a tag or the toolbar, and presses there. The map then waits 300 ms (a second tap
 * would zoom instead) before it opens the country's panel.
 */
export async function pressCountry(page, code, { touch = false } = {}) {
  const shape = page.locator(`[data-code="${code}"]`);
  await expect(shape).toBeAttached();
  const point = await shape.evaluate((g) => {
    const box = g.getBoundingClientRect();
    const centre = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    const points = [];
    const steps = 16;
    for (let i = 1; i < steps; i++) {
      for (let j = 1; j < steps; j++) points.push({ x: box.left + (box.width * i) / steps, y: box.top + (box.height * j) / steps });
    }
    points.sort((a, b) => Math.hypot(a.x - centre.x, a.y - centre.y) - Math.hypot(b.x - centre.x, b.y - centre.y));
    return (
      points.find(({ x, y }) => x > 0 && y > 0 && x < window.innerWidth && y < window.innerHeight && g.contains(document.elementFromPoint(x, y))) ||
      null
    );
  });
  expect(point, `a visible point of ${code} on the map`).not.toBeNull();
  if (touch) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
}

// Photos

/**
 * A small JPEG made by the browser's canvas, optionally with a GPS position written into
 * its EXIF (as a phone would), for the upload tests. Returns setInputFiles' file payload.
 */
export async function makeJpeg(page, { name = 'photo.jpg', gps = null } = {}) {
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgb(40, 110, 170)';
    ctx.fillRect(0, 0, 320, 240);
    ctx.fillStyle = 'rgb(240, 220, 160)';
    ctx.fillRect(80, 60, 160, 120);
    return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
  });
  let buffer = Buffer.from(base64, 'base64');
  if (gps) buffer = Buffer.concat([buffer.subarray(0, 2), gpsExifSegment(gps.latitude, gps.longitude), buffer.subarray(2)]);
  return { name, mimeType: 'image/jpeg', buffer };
}

// An APP1 Exif segment holding only a GPS position: a big-endian TIFF header, IFD0 with
// one entry (the GPS IFD's offset), then the GPS IFD (latitude and longitude, each a
// reference letter and three rationals: degrees, minutes, seconds).
function gpsExifSegment(latitude, longitude) {
  const tiff = Buffer.alloc(128);
  tiff.write('MM', 0, 'ascii');
  tiff.writeUInt16BE(42, 2);
  tiff.writeUInt32BE(8, 4); // IFD0 at 8
  tiff.writeUInt16BE(1, 8); // one entry
  tiff.writeUInt16BE(0x8825, 10); // GPSInfo, LONG, 1, at 26
  tiff.writeUInt16BE(4, 12);
  tiff.writeUInt32BE(1, 14);
  tiff.writeUInt32BE(26, 18);
  tiff.writeUInt32BE(0, 22); // no next IFD
  tiff.writeUInt16BE(4, 26); // the GPS IFD: four entries
  let at = 28;
  const entry = (tag, type, count, write) => {
    tiff.writeUInt16BE(tag, at);
    tiff.writeUInt16BE(type, at + 2);
    tiff.writeUInt32BE(count, at + 4);
    write(at + 8);
    at += 12;
  };
  entry(1, 2, 2, (o) => tiff.write(latitude >= 0 ? 'N' : 'S', o, 'ascii'));
  entry(2, 5, 3, (o) => tiff.writeUInt32BE(80, o));
  entry(3, 2, 2, (o) => tiff.write(longitude >= 0 ? 'E' : 'W', o, 'ascii'));
  entry(4, 5, 3, (o) => tiff.writeUInt32BE(104, o));
  tiff.writeUInt32BE(0, at); // no next IFD
  const rationals = (value, offset) => {
    const abs = Math.abs(value);
    const degrees = Math.floor(abs);
    const minutes = Math.floor((abs - degrees) * 60);
    const milliSeconds = Math.round(((abs - degrees) * 60 - minutes) * 60 * 1000);
    [
      [degrees, 1],
      [minutes, 1],
      [milliSeconds, 1000],
    ].forEach(([num, den], i) => {
      tiff.writeUInt32BE(num, offset + i * 8);
      tiff.writeUInt32BE(den, offset + i * 8 + 4);
    });
  };
  rationals(latitude, 80);
  rationals(longitude, 104);
  const body = Buffer.concat([Buffer.from('Exif\0\0', 'binary'), tiff]);
  const marker = Buffer.alloc(4);
  marker.writeUInt16BE(0xffe1, 0);
  marker.writeUInt16BE(body.length + 2, 2);
  return Buffer.concat([marker, body]);
}

// Signing out

/**
 * Sign out from the account page (mock mode signs the test user back in on the next page
 * load, so stay in this page and move on with `goInApp`).
 */
export async function signOut(page) {
  await page.goto('/account');
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}

/** Change the address inside the app, as a link would (no page load). */
export async function goInApp(page, path) {
  await page.evaluate((to) => {
    window.history.pushState({}, '', to);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
}
