import { test, expect, openMap, openTool } from './fixtures.js';

// How far they've gone (docs/API.md "Stats"; 21 Nov 2026, the user's wish): the share of the
// world's countries, the days away and the distance on completed trips, and the place
// furthest from home, which the map's home (Settings, "This map") changes. The seeded map's
// one completed trip is "Italian summer", 2 to 16 July 2025; Charlie, its owner, was born in
// the UK.

const tile = (stats, label) => stats.locator('div').filter({ has: stats.page().getByText(label, { exact: true }) }).last();

test('the statistics say how much of the world, the days away, the distance and the furthest place', async ({ page }) => {
  await openMap(page);
  const stats = await openTool(page, 'Travel statistics', 'Travel statistics');
  await expect(tile(stats, 'Of the world')).toContainText(/\d+(\.\d)?%/);
  await expect(tile(stats, 'Of the world')).toContainText(/of 22[69] countries/);
  await expect(tile(stats, 'Days away')).toContainText('15');
  await expect(tile(stats, 'Distance travelled')).toContainText(/[1-9][\d,]* km/);
  await expect(tile(stats, 'Distance travelled')).toContainText(/About [\d,]+ miles/);
  await expect(tile(stats, 'Furthest from home')).toContainText(/km from the United Kingdom/);
});

// Time away in more detail (23 Nov 2026, the user's wish): the longest trip, the days each
// year and in each country, and each traveller's days
test('the statistics name the longest trip and split the days away by year, country and person', { tag: '@phone' }, async ({ page }) => {
  await openMap(page);
  const stats = await openTool(page, 'Travel statistics', 'Travel statistics');
  await expect(tile(stats, 'Longest trip')).toContainText('15 days');
  await expect(tile(stats, 'Longest trip')).toContainText('Italian summer');

  const years = stats.getByRole('region', { name: 'Days away each year' });
  await expect(years.getByRole('listitem')).toHaveCount(1);
  await expect(years.getByRole('listitem').first()).toContainText('2025');
  await expect(years.getByRole('listitem').first()).toContainText('15 days');

  const places = stats.getByRole('region', { name: 'Days in each country' });
  await expect(places.getByRole('listitem').first()).toContainText('Italy');
  await expect(places.getByRole('listitem').first()).toContainText('15 days');

  // Charlie and Alex both went to Italy
  const people = stats.getByRole('region', { name: 'Each traveller, from completed trips' });
  await expect(people.locator('[data-traveller-stats]').filter({ hasText: 'Charlie' })).toContainText('15 days');
  await expect(people.locator('[data-traveller-stats]').filter({ hasText: 'Alex' })).toContainText('15 days');
});

// 23 Nov 2026, the user's wish: an optional date of birth, asked when people are added to a
// map (Settings), never at sign-up (the welcome page)
test('a date of birth set in Settings gives a traveller the share of their life away; sign-up never asks', { tag: '@phone' }, async ({ page }) => {
  await openMap(page);
  const settings = await openTool(page, 'Map settings', 'Settings');
  await settings.getByRole('tab', { name: 'This map' }).click();
  const born = settings.locator('#traveller-0-born-on');
  await expect(born).toHaveAttribute('type', 'date');
  await born.fill('2025-01-01');
  await settings.getByRole('button', { name: 'Save map' }).click();
  await expect(settings.getByText(/Saved/).first()).toBeVisible();
  await settings.getByRole('button', { name: 'Close Settings' }).click();

  const stats = await openTool(page, 'Travel statistics', 'Travel statistics');
  const people = stats.getByRole('region', { name: 'Each traveller, from completed trips' });
  await expect(people.locator('[data-traveller-stats]').filter({ hasText: 'Charlie' })).toContainText(/15 days · \d+(\.\d)?% of their life/);
  // Alex has no date of birth: no share
  await expect(people.locator('[data-traveller-stats]').filter({ hasText: 'Alex' })).not.toContainText('of their life');

  // The welcome page, straight after sign-up, asks no date of birth
  await page.goto('/welcome');
  await expect(page.locator('#traveller-0-name')).toBeVisible();
  await expect(page.locator('#traveller-0-born-on')).toHaveCount(0);
});

test('the map’s home, set in Settings, is where the distances start', async ({ page }) => {
  await openMap(page);
  const settings = await openTool(page, 'Map settings', 'Settings');
  await settings.getByRole('tab', { name: 'This map' }).click();
  const home = settings.getByRole('region', { name: 'Home' });
  await expect(home.getByText(/Not set, home is the United Kingdom/)).toBeVisible();
  await home.getByLabel('Where you live').selectOption({ label: 'Australia' });
  await expect(home.getByRole('status')).toContainText('Saved');
  await settings.getByRole('button', { name: 'Close Settings' }).click();

  const stats = await openTool(page, 'Travel statistics', 'Travel statistics');
  await expect(tile(stats, 'Furthest from home')).toContainText(/km from Australia/);
});
