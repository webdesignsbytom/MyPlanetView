import { test, expect } from './fixtures.js';

// A trip's days and events (23 Nov 2026, the user's wish: "a trip to Kenya, and inside it a
// safari day"): the trip page's Moments card lists each moment under its day of the trip,
// with where the trip was that day, and a trip's moment form offers a day's kinds first (a
// safari, a hike, a meal to remember). The seeded "Italian summer" (2 to 16 July 2025: Rome
// at the Colosseum, Florence from the 7th, Cinque Terre from the 12th) has the gelato moment
// in Florence on the 9th.

test('a trip’s moments are laid out day by day, and a safari day is added to one', { tag: '@phone' }, async ({ page }) => {
  await page.goto('/trips/trip-italy');
  const moments = page.getByRole('region', { name: 'Moments' });
  const gelatoDay = moments.locator('[data-moment-day="2025-07-09"]');
  await expect(gelatoDay.getByRole('heading', { level: 3 })).toHaveText('Day 8 · Wednesday 9 July 2025');
  await expect(gelatoDay).toContainText('Florence');
  await expect(gelatoDay.getByRole('article', { name: 'Best gelato of the trip' })).toBeVisible();

  await moments.getByRole('button', { name: 'Add a moment' }).click();
  const form = moments.getByRole('region', { name: 'Add a moment' });
  const kind = form.getByRole('combobox', { name: 'What kind' });
  // A day's kinds come first on a trip
  await expect(kind.locator('optgroup').first()).toHaveAttribute('label', 'A day on the trip');
  await kind.selectOption({ label: 'Safari' });
  await form.getByRole('textbox', { name: 'Title' }).fill('Lions in the Borghese gardens');
  await form.getByRole('combobox', { name: 'When' }).selectOption('DAY');
  await form.getByLabel('Day', { exact: true }).fill('2025-07-04');
  await form.getByRole('button', { name: 'Add moment' }).click();

  // It lands on its day, before the gelato's, with the day's place and the kind on its card
  const safariDay = moments.locator('[data-moment-day="2025-07-04"]');
  await expect(safariDay.getByRole('heading', { level: 3 })).toHaveText('Day 3 · Friday 4 July 2025');
  await expect(safariDay).toContainText('Colosseum');
  await expect(safariDay.getByRole('article', { name: 'Lions in the Borghese gardens' })).toContainText('Safari · 4 Jul 2025');
  await expect(moments.locator('[data-moment-day]')).toHaveCount(2);
  await expect(moments.locator('[data-moment-day]').first()).toHaveAttribute('data-moment-day', '2025-07-04');
});
