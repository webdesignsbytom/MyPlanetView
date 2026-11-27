import { test, expect, MOCK_STORE_KEY, openMap, openTool } from './fixtures.js';

// Where to go next (22 Nov 2026, the user's wish): the map's "want to go" countries by the
// best time for each, from the country guides. The seeded map wants Japan, Peru and Iceland;
// in August Iceland and Peru are at their best, and Japan's next best month is October.

test('lists the want-to-go countries good now, then the rest at their next best month', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-08-10T12:00:00'));
  await openMap(page);
  const panel = await openTool(page, 'Where to go next', 'Where to go next');

  const now = panel.getByRole('region', { name: 'Good in August' });
  await expect(now.locator('[data-where-next]')).toHaveCount(2);
  await expect(now.locator('[data-where-next]').nth(0)).toContainText('Iceland');
  await expect(now.locator('[data-where-next]').nth(0)).toContainText('Best time');
  await expect(now.locator('[data-where-next]').nth(1)).toContainText('Peru');

  const october = panel.getByRole('region', { name: 'October' });
  await expect(october.locator('[data-where-next]')).toHaveText([/Japan.*Best time.*Best: Mar–May, Oct–Nov/]);
  await expect(october.getByRole('link', { name: 'Read the guide' })).toHaveAttribute('href', '/countries/japan');

  // A country opens its ticket
  await october.getByRole('button', { name: 'Japan' }).click();
  await expect(page.getByRole('dialog', { name: 'Japan' })).toBeVisible();
});

// 24 Nov 2026, the user's wish: the passport from here and from the country list
test('opens the passport from Where to go next and from the country list', async ({ page }) => {
  await openMap(page);
  const next = await openTool(page, 'Where to go next', 'Where to go next');
  await next.getByRole('link', { name: 'Open passport' }).click();
  await expect(page).toHaveURL(/\/maps\/map-home\/passport$/);
  await expect(page.getByRole('region', { name: 'Passport book' })).toBeVisible();

  await openMap(page);
  const list = await openTool(page, 'Country list', 'Countries');
  // Beside "Tick several countries", the same height
  const passport = list.getByRole('link', { name: 'Open passport' });
  const tick = list.getByRole('button', { name: 'Tick several countries' });
  const [a, b] = [await passport.boundingBox(), await tick.boundingBox()];
  expect(Math.abs(a.y - b.y)).toBeLessThan(1);
  expect(Math.abs(a.height - b.height)).toBeLessThan(1);
  await passport.click();
  await expect(page).toHaveURL(/\/maps\/map-home\/passport$/);
});

// 27 Nov 2026, the user's wish: with nothing marked "want to go", a page in the middle of the
// panel (as the trips' empty one), not a line of text at the top
test('with nothing wanted, fills the panel with what to do, and opens the country list', async ({ page }) => {
  // The store is saved once mock mode has started on a page
  await openMap(page);
  await page.evaluate((key) => {
    const db = JSON.parse(localStorage.getItem(key));
    db.visits = db.visits.filter((v) => !(v.mapId === 'map-home' && v.status === 'WANT_TO_GO'));
    localStorage.setItem(key, JSON.stringify(db));
  }, MOCK_STORE_KEY);
  await openMap(page);
  const panel = await openTool(page, 'Where to go next', 'Where to go next');
  const empty = panel.getByRole('heading', { name: 'Where will you go?' });
  await expect(empty).toBeVisible();
  await expect(panel.getByText('Nothing is marked “Want to go” yet.', { exact: false })).toBeVisible();
  await expect(panel.getByRole('listitem')).toHaveText([
    'Mark a country “Want to go”, on the map or in the country list.',
    'See the best month for each, from our country guides.',
    'Plan the trip, and count down the days.',
  ]);
  // Centred in the panel, under the passport link
  const sheet = panel.locator('section:has(h3)');
  const [box, link, body] = await Promise.all([
    sheet.boundingBox(),
    panel.getByRole('link', { name: 'Open passport' }).boundingBox(),
    panel.boundingBox(),
  ]);
  expect(box.y).toBeGreaterThan(link.y + link.height - 1);
  expect(box.y + box.height).toBeGreaterThan(body.y + body.height - 60);
  await panel.getByRole('button', { name: 'Open the country list' }).click();
  await expect(page.getByRole('dialog', { name: 'Countries', exact: true })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Where to go next', exact: true })).toHaveCount(0);
});
