import { test, expect, openMap, openStats, SAM_SHARE_CODE } from './fixtures.js';

// Comparing two maps (22 Nov 2026, the user's wish): the test user's map (20 countries: the demo
// couple's travels, none in South-East Asia or Australia) and Sam's gap year, which
// they can view (Thailand, Vietnam, Cambodia, and Australia lived in): nothing in common.

const group = (page, id) => page.locator(`[data-compare-group="${id}"]`);
// Leaving the map: on the dev server the next page's code waits behind the map's idle
// preloads (each landmark model's picture is a module of its own there, about 1,770), which
// took 7 to 10 s (26 Nov 2026). A build bundles them, so only the tests wait longer.
const AFTER_THE_MAP = { timeout: 30_000 };

test('the statistics open the comparison, which lists both, only one and only the other', async ({ page }) => {
  await openMap(page);
  await openStats(page);
  await page.getByRole('dialog', { name: 'Travel statistics' }).getByRole('link', { name: 'Compare with another map' }).click();
  await expect(page).toHaveURL(/\/compare\?a=map-home$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Compare two maps' })).toBeVisible(AFTER_THE_MAP);

  await page.getByLabel('Compare with').selectOption({ label: "Sam's gap year (Sam Rivers)" });
  await expect(page).toHaveURL(/\/compare\?a=map-home&b=map-sam$/);
  await expect(page.locator('[data-compare-summary]')).toHaveText(
    "Both have been to 0 countries. Charlie & Alex's travels has 20 countries the other doesn’t, and Sam's gap year 4 countries.",
  );
  await expect(group(page, 'compare-only-b').locator('[data-compare-names]')).toHaveText('Australia · Cambodia · Thailand · Vietnam');
  await expect(group(page, 'compare-only-a')).toContainText("Only Charlie & Alex's travels: 20 countries");
  await expect(group(page, 'compare-both')).toContainText('None yet: somewhere to go together?');
  await expect(page.locator('[data-compare-picture]')).toBeVisible();
});

test('a map’s share link can be compared too', async ({ page }) => {
  await page.goto('/compare?a=map-home');
  await page.getByLabel('Compare with').selectOption({ label: 'A map’s share link…' });
  await page.getByRole('textbox', { name: 'Their share link' }).fill(`https://example.test/shared/${SAM_SHARE_CODE}`);
  await page.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(group(page, 'compare-only-b')).toContainText("Only Sam's gap year: 4 countries");

  // A link that matches nothing says so
  await page.getByRole('textbox', { name: 'Their share link' }).fill('ZZZZ-ZZZZ-ZZZZ');
  await page.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(page.getByText('That link doesn’t work.', { exact: false })).toBeVisible();
});
