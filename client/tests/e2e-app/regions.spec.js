import { test, expect, openMap, openTool, expectStats } from './fixtures.js';

// Regions (utils/map/regionPlaces.js; 18 Nov 2026, the user's wish): Bali, the Galápagos,
// Goa, Hawaii, New Caledonia and Tasmania, each part of a country, with its own visit, card
// and ticket, never counted as a country. The seeded map (src/dev/mock/seed.js) has the US
// visited and Indonesia not; it counts 8 countries on 2 continents.

/** A point on the screen where the map shows the place itself (each of its shapes tried). */
async function pointOn(page, code) {
  return page.evaluate((code) => {
    const pieces = [...document.querySelectorAll(`[data-code="${code}"]`)].flatMap((el) => [...el.querySelectorAll('path, circle'), el]);
    for (const el of pieces) {
      const box = el.getBoundingClientRect();
      for (let fy = 0.1; fy < 1; fy += 0.1) {
        for (let fx = 0.1; fx < 1; fx += 0.1) {
          const x = box.left + box.width * fx;
          const y = box.top + box.height * fy;
          if (document.elementFromPoint(x, y)?.closest('[data-code]')?.getAttribute('data-code') === code) return { x, y };
        }
      }
    }
    return null;
  }, code);
}

test('a region is drawn in its country’s colour, with a card of its own', async ({ page }) => {
  await openMap(page);
  // Hawaii wears the United States' pastel
  const fill = (code) => page.locator(`[data-code="${code}"]`).first().evaluate((el) => getComputedStyle(el).fill);
  expect(await fill('XH')).toBe(await fill('US'));

  const at = await pointOn(page, 'XH');
  expect(at).not.toBeNull();
  const card = page.locator('[data-hover-card="XH"]');
  let nudge = 0;
  await expect(async () => {
    nudge += 1;
    await page.mouse.move(at.x - 3 + (nudge % 2) * 2, at.y);
    await page.mouse.move(at.x, at.y);
    await expect(card).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
  await expect(card).toContainText('Hawaii');
  await expect(card).toContainText('Region');
  await expect(card).toContainText('of United States');
  await expect(card).toContainText('United States: Visited. A region, never counted as a country.');
  await expect(card.locator('img')).toHaveAttribute('src', /visitCountryPosters\/xh-/);
});

test('marking a region visits its country, and only the country counts', async ({ page }) => {
  await openMap(page);
  const list = await openTool(page, 'Country list', 'Countries');
  await expect(list.getByRole('heading', { name: 'Regions' })).toBeVisible();

  await list.getByRole('button', { name: 'Status for Bali: Not yet' }).click();
  await list.getByRole('combobox', { name: 'Status for Bali' }).selectOption('Visited');
  // Indonesia comes with it, and Asia: one more country and continent, and a region
  await expectStats(page, '9 countries, 3 continents, 16 photos', 0, 1);
  await list.getByRole('heading', { name: 'Countries' }).click();
  await expect(list.getByRole('button', { name: 'Status for Indonesia: Visited' })).toBeVisible();

  // Bali's ticket: its own status, its landmarks, and the way to Indonesia's
  await list.getByRole('button', { name: 'Bali', exact: true }).click();
  const bali = page.getByRole('dialog', { name: 'Bali' });
  await expect(bali).toBeVisible();
  await expect(bali.getByText('A region of Indonesia')).toBeVisible();
  await expect(bali.getByRole('heading', { name: 'Part of Indonesia' })).toBeVisible();
  await expect(bali.getByText('Bali Subak Landscape')).toBeVisible();
  await expect(bali.getByRole('heading', { name: 'Photos' })).toHaveCount(0);
  await bali.getByRole('button', { name: 'Open Indonesia' }).click();
  const indonesia = page.getByRole('dialog', { name: 'Indonesia' });
  await expect(indonesia).toBeVisible();
  await expect(indonesia.getByRole('heading', { name: 'Photos' })).toBeVisible();
});

test('zoomed in, the places in view are drawn from their detailed outlines', async ({ page }) => {
  await openMap(page);
  const outline = () => page.locator('[data-code="FR"] path').first().getAttribute('d');
  const usual = await outline();
  // Three double-clicks on France: eight times closer
  for (let i = 0; i < 3; i++) {
    const at = await pointOn(page, 'FR');
    await page.mouse.dblclick(at.x, at.y);
    await page.waitForTimeout(400);
  }
  await expect.poll(async () => (await outline()).length).toBeGreaterThan(usual.length * 2);
});
