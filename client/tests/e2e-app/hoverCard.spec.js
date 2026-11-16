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
  // The card's code loads in the background (lazy), and the card follows the pointer from
  // its first move after it arrives: keep nudging until it shows (a slow machine, CI, can
  // finish both moves before the code is there)
  const card = page.locator('[data-hover-card="FR"]');
  let nudge = 0;
  await expect(async () => {
    nudge += 1;
    await page.mouse.move(at.x - 3 + (nudge % 2) * 2, at.y);
    await page.mouse.move(at.x, at.y);
    await expect(card).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 15000 });
  await expect(card).toContainText('France');
  await expect(card.locator('img')).toHaveAttribute('src', /visitCountryPosters\//);
  await expect(card.locator('img[src*="seed-photos"]')).toHaveCount(0);
});
