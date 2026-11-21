import { test, expect, openMap, openTool } from './fixtures.js';

// "Your year in travel" (docs/API.md "Year in travel"; 21 Nov 2026, the user's wish): a year
// of the map as slides, ending on its share card. The seeded map's 2025: France and Italy
// (Italy new), 4 photos, 4 stamps, the "Italian summer" trip and a moment.

const dialog = (page) => page.getByRole('dialog', { name: 'Your year in travel' });

test('the statistics open any year’s recap, slide by slide, to its share card', async ({ page }) => {
  await openMap(page);
  const stats = await openTool(page, 'Travel statistics', 'Travel statistics');
  await stats.getByRole('button', { name: 'Your year in travel' }).click();
  const recap = dialog(page);
  await expect(recap).toBeVisible();

  await recap.getByRole('combobox', { name: 'Year' }).selectOption('2025');
  await expect(recap.getByRole('heading', { name: '2025' })).toBeVisible();
  await expect(recap.getByText('1 of 6')).toBeVisible();

  await recap.getByRole('button', { name: 'Next' }).click();
  await expect(recap.getByRole('heading', { name: '2 countries' })).toBeFocused();
  await expect(recap.getByText('New this year: Italy.')).toBeVisible();

  // The arrow keys move too
  await page.keyboard.press('ArrowRight');
  await expect(recap.getByRole('heading', { name: '4 photos' })).toBeVisible();
  await expect(recap.getByRole('list', { name: 'A photo from each country' }).getByRole('listitem')).toHaveCount(2);

  await recap.getByRole('button', { name: 'Next' }).click();
  await expect(recap.getByRole('heading', { name: '4 landmarks stamped' })).toBeVisible();
  await recap.getByRole('button', { name: 'Next' }).click();
  await expect(recap.getByRole('heading', { name: '1 trip and 1 moment' })).toBeVisible();
  await expect(recap.getByText('Italian summer')).toBeVisible();

  await recap.getByRole('button', { name: 'Next' }).click();
  await expect(recap.getByRole('heading', { name: 'Share your 2025' })).toBeVisible();
  await expect(recap.locator('img[data-share-card]')).toHaveAttribute('alt', 'Your share card: 2025 in travel, 2 countries, 1 new country, 4 photos');

  await recap.getByRole('button', { name: 'Back' }).click();
  await expect(recap.getByText('5 of 6')).toBeVisible();
  await recap.getByRole('button', { name: 'Next' }).click();
  await recap.getByRole('button', { name: 'Done' }).click();
  await expect(recap).toBeHidden();
});

test('a year with nothing says so, and offers the years that have something', async ({ page }) => {
  // In June 2026 the recap opens on 2026, which the seeded map has nothing in
  await page.clock.setFixedTime(new Date('2026-06-01T12:00:00'));
  await openMap(page);
  const stats = await openTool(page, 'Travel statistics', 'Travel statistics');
  await stats.getByRole('button', { name: 'Your year in travel' }).click();
  const recap = dialog(page);
  await expect(recap.getByText(/Nothing on “.+” for 2026 yet\. .* Choose another year above\./)).toBeVisible();
  await expect(recap.getByRole('button', { name: 'Next' })).toHaveCount(0);
  const years = recap.getByRole('combobox', { name: 'Year' });
  await expect(years.locator('option[value="2025"]')).toHaveCount(1);
  await expect(years.locator('option[value="2022"]')).toHaveCount(0);
  await years.selectOption('2024');
  await expect(recap.getByRole('heading', { name: '2024' })).toBeVisible();
});

test('in December a tag on the map offers the year, and closes for the visit', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2025-12-10T12:00:00'));
  await openMap(page);
  const tag = page.locator('[data-recap-tag]');
  await expect(tag).toContainText('Your 2025 in travel is ready.');
  await tag.getByRole('button', { name: 'See your year' }).click();
  await expect(dialog(page).getByRole('heading', { name: '2025' })).toBeVisible();
  await dialog(page).getByRole('button', { name: 'Close' }).click();

  await tag.getByRole('button', { name: 'Close: your 2025 in travel' }).click();
  await expect(tag).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('application', { name: /: world map$/ })).toBeVisible();
  await expect(page.locator('[data-recap-tag]')).toHaveCount(0);
});
