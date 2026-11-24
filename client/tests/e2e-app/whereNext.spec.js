import { test, expect, openMap, openTool } from './fixtures.js';

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
