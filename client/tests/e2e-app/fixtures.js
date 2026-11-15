// Shared set-up for the travel-page tests (playwright.app.config.js). Every test gets a
// fresh browser context, so mock mode seeds its demo data afresh (src/dev/mock/seed.js):
// the test user owns "Test & Alex's travels" (8 countries, 2 continents, 5 photos).
import { test as base, expect } from '@playwright/test';
// Constants
import { COOKIE_POLICY_NAME } from '../../src/utils/constants/constants.js';

export { expect };

export const HOME_MAP = "Test & Alex's travels";
// Seeded maps and codes (seed.js): Sam's map is shared with anyone who has the link
export const SAM_MAP = "Sam's gap year";
export const SAM_SHARE_CODE = 'SAMG-4PYE-AR22';
export const HOME_SHARE_CODE = 'K7QX-M2PA-9RTW';

export const test = base.extend({
  page: async ({ page }, provide) => {
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
  await expect(page.getByRole('application', { name: /: world map$/ })).toBeVisible();
}

export const toolbar = (page) => page.getByRole('navigation', { name: 'Map tools' });

/** The luggage tag under the title: "8 countries, 2 continents, 5 photos. Open travel statistics". */
export const statsBadge = (page) => page.getByRole('button', { name: /\. Open travel statistics$/ });

export const expectStats = (page, text) => expect(statsBadge(page)).toHaveAccessibleName(`${text}. Open travel statistics`);

/** Press a toolbar stamp and return the panel it opens. */
export async function openTool(page, label, panelTitle) {
  await toolbar(page).getByRole('button', { name: label, exact: true }).click();
  const panel = page.getByRole('dialog', { name: panelTitle, exact: true });
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
