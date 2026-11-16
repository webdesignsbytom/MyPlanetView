import { test, expect, openMap } from './fixtures.js';

// The postcard that follows the pointer over a country (HoverPreview): the country's poster,
// visited or not, never the map's own photos (17 Nov 2026, the user's wish). France is
// visited on the seeded map and has photos (src/dev/mock/seed.js).

/** A point on the screen where the map shows the country itself (not a badge or a pin over it). */
async function pointOn(page, code) {
  return page.evaluate((code) => {
    for (const el of document.querySelectorAll(`[data-code="${code}"]`)) {
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

test('hovering a visited country with photos shows its poster, not a photo', async ({ page }) => {
  await openMap(page);
  const at = await pointOn(page, 'FR');
  expect(at).not.toBeNull();
  await page.mouse.move(at.x - 3, at.y);
  await page.mouse.move(at.x, at.y);
  const card = page.locator('[data-hover-card="FR"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('France');
  await expect(card.locator('img')).toHaveAttribute('src', /visitCountryPosters\//);
  await expect(card.locator('img[src*="seed-photos"]')).toHaveCount(0);
});
