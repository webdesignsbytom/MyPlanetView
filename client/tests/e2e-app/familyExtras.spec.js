import { test, expect, openMap } from './fixtures.js';

// Family extras (21 Nov 2026, the user's wish). Each traveller's own passport on a family's
// map: the seeded "The Morgans" (the test user a viewer), whose Charlie went on "Spain at
// Easter" (2010) and was born in the UK. And anniversaries as moments: the test user's
// engagement at the Eiffel Tower, 12 April 2019, comes round on 12 April.

const pageStatus = (page) => page.getByRole('status').filter({ hasText: /^Page \d+ of \d+/ });

test('a family’s passport has a passport for each traveller, with only their places', async ({ page }) => {
  await page.goto('/maps/map-morgans/passport');
  await expect(pageStatus(page)).toHaveText(/^Page 1 of \d+: Cover$/);
  const whose = page.getByRole('group', { name: 'Whose passport' });
  await expect(whose.getByRole('button', { name: 'The whole family' })).toHaveAttribute('aria-pressed', 'true');

  await whose.getByRole('button', { name: 'Charlie', exact: true }).click();
  await expect(page).toHaveURL(/\?traveller=trav-morgan-charlie$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Charlie’s passport' })).toBeVisible();
  // Cover, the traveller's page, Spain (2010), the UK (born there, undated), the totals
  await expect(pageStatus(page)).toHaveText('Page 1 of 5: Cover');
  const pages = page.getByRole('combobox', { name: 'Go to a page' });
  await expect(pages.locator('option')).toHaveText([/Cover/, /Travellers/, /Spain/, /United Kingdom/, /Totals/]);

  // Back to the whole family's
  await whose.getByRole('button', { name: 'The whole family' }).click();
  await expect(page).toHaveURL(/\/passport$/);
  await expect(page.getByRole('heading', { level: 1, name: 'The Morgans' })).toBeVisible();
});

test('a couple’s passport has no switch', async ({ page }) => {
  await page.goto('/maps/map-home/passport');
  await expect(pageStatus(page)).toHaveText(/^Page 1 of \d+: Cover$/);
  await expect(page.getByRole('group', { name: 'Whose passport' })).toHaveCount(0);
});

test('a moment’s day come round shows on the map, and opens its country', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-04-12T12:00:00'));
  await openMap(page);
  const tag = page.getByRole('region', { name: 'On this day' });
  await expect(tag).toContainText('7 years ago today: Got engaged at the Eiffel Tower');
  await tag.getByRole('button', { name: 'Open France' }).click();
  const france = page.getByRole('dialog', { name: 'France' });
  await expect(france).toBeVisible();
  // The ticket opens over the dimmed map, tags and all (22 Nov 2026): closed first
  await france.getByRole('button', { name: /^Close/ }).first().click();
  await expect(france).toBeHidden();

  // Closed, it stays away for the day
  await tag.getByRole('button', { name: 'Close: on this day' }).click();
  await expect(tag).toHaveCount(0);
});

test('no tag on a day nothing happened', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-04-13T12:00:00'));
  await openMap(page);
  await expect(page.locator('[data-recap-tag], [data-anniversary-tag]')).toHaveCount(0);
});
