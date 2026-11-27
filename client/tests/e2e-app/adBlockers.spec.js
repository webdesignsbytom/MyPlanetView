import { test, expect, HOME_MAP, openMap, openTool } from './fixtures.js';
import { loadBlockerMatcher } from '../../scripts/lib/blockerLists.mjs';

// The site loads with an ad or tracker blocker on (27 Nov 2026, the user's wish: "the site should
// always load even with adblockers". An ad blocker blocked /src/utils/analytics/events.js on the
// dev server and the site stayed blank). Every request the page makes is tested against the
// lists the common blockers use (scripts/lib/blockerLists.mjs, cached for a week) and refused as
// a blocker refuses it; the pages must load and work all the same. On this dev server every file
// is its own request, as it was when the site went blank.

const TYPES = { xhr: 'xmlhttprequest', fetch: 'xmlhttprequest', manifest: 'other', texttrack: 'other', eventsource: 'other' };

let matcher = null;
test.beforeAll(async () => {
  const loaded = await loadBlockerMatcher();
  if (loaded.missing.length < 12) matcher = loaded.matcher;
});

/** Refuse what a blocker would, as it does; -> the addresses refused. */
async function blockLikeAnAdBlocker(page) {
  const refused = [];
  await page.route('**/*', (route) => {
    const request = route.request();
    const kind = request.resourceType();
    const rule = matcher.blockedBy(request.url(), TYPES[kind] || kind);
    if (!rule) return route.continue();
    refused.push(`${request.url()} (${rule.list}: ${rule.raw})`);
    return route.abort('blockedbyclient');
  });
  return refused;
}

test('with an ad blocker on, every page loads and the map works', async ({ page }) => {
  test.skip(!matcher, 'The blockers’ lists could not be downloaded');
  test.setTimeout(180_000);
  const refused = await blockLikeAnAdBlocker(page);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await openMap(page);
  await expect(page.getByRole('heading', { level: 1, name: HOME_MAP })).toBeAttached();
  const list = await openTool(page, 'Country list', 'Countries');
  await list.getByRole('searchbox', { name: 'Search countries' }).fill('france');
  await list.getByRole('button', { name: 'France', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'France' })).toBeVisible();
  await page.keyboard.press('Escape');
  await openTool(page, 'Map settings', 'Settings');

  await page.goto('/maps/map-home/passport');
  await expect(page.getByRole('heading', { level: 1, name: HOME_MAP })).toBeVisible();
  await page.goto('/account');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // Nothing of the site's own was refused, and nothing broke
  expect(refused, `refused: ${refused.join('\n')}`).toEqual([]);
  expect(errors).toEqual([]);
});
