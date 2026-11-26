import { test, expect, openMap, openTool } from './fixtures.js';

// How far they've gone (docs/API.md "Stats"; 21 Nov 2026, the user's wish): the share of the
// world's countries, the days away and the distance on completed trips, and the place
// furthest from home, which the map's home (Settings, "This map") changes. The seeded map is the
// demo couple's travels (data/demoTravels.js): 11 completed trips, 282 days away, the longest
// "A year off: around the world" (190 days); Charlie, its owner, was born in the UK.

const tile = (stats, label) => stats.locator('div').filter({ has: stats.page().getByText(label, { exact: true }) }).last();

test('the statistics say how much of the world, the days away, the distance and the furthest place', async ({ page }) => {
  await openMap(page);
  const stats = await openTool(page, 'Travel statistics', 'Travel statistics');
  await expect(tile(stats, 'Of the world')).toContainText(/\d+(\.\d)?%/);
  await expect(tile(stats, 'Of the world')).toContainText(/of 22[69] countries/);
  await expect(tile(stats, 'Days away')).toContainText('282');
  // In miles, the map's home being in the UK (25 Nov 2026, the user's wish), kilometres beside
  await expect(tile(stats, 'Distance travelled')).toContainText(/[1-9][\d,]* miles/);
  await expect(tile(stats, 'Distance travelled')).toContainText(/About [\d,]+ km/);
  await expect(tile(stats, 'Furthest from home')).toContainText(/miles from the United Kingdom/);
});

// Time away in more detail (23 Nov 2026, the user's wish): the longest trip, the days each
// year and in each country, and each traveller's days
test('the statistics name the longest trip and split the days away by year, country and person', { tag: '@phone' }, async ({ page }) => {
  await openMap(page);
  const stats = await openTool(page, 'Travel statistics', 'Travel statistics');
  await expect(tile(stats, 'Longest trip')).toContainText('190 days');
  await expect(tile(stats, 'Longest trip')).toContainText('A year off: around the world');

  // Ten years with a trip, the newest first: Venice and Vienna in 2026
  const years = stats.getByRole('region', { name: 'Days away each year' });
  await expect(years.getByRole('listitem')).toHaveCount(10);
  await expect(years.getByRole('listitem').first()).toContainText('2026');
  await expect(years.getByRole('listitem').first()).toContainText('9 days');

  // Three weeks in each of the year off's countries, the first of them by code: Cuba
  const places = stats.getByRole('region', { name: 'Days in each country' });
  await expect(places.getByRole('listitem').first()).toContainText('Cuba');
  await expect(places.getByRole('listitem').first()).toContainText('22 days');

  // Charlie went to Lisbon alone, Alex to Vienna
  const people = stats.getByRole('region', { name: 'Each traveller, from completed trips' });
  await expect(people.locator('[data-traveller-stats]').filter({ hasText: 'Charlie' })).toContainText('278 days');
  await expect(people.locator('[data-traveller-stats]').filter({ hasText: 'Alex' })).toContainText('277 days');
});

// 23 Nov 2026, the user's wish: an optional date of birth, asked when people are added to a
// map (Settings), never at sign-up (the welcome page)
test('a date of birth set in Settings gives a traveller the share of their life away; sign-up never asks', { tag: '@phone' }, async ({ page }) => {
  await openMap(page);
  const settings = await openTool(page, 'Map settings', 'Settings');
  await settings.getByRole('tab', { name: 'This map' }).click();
  const born = settings.locator('#traveller-0-born-on');
  await expect(born).toHaveAttribute('type', 'date');
  // The seed's (data/demoTravels.js), changed
  await expect(born).toHaveValue('1990-01-14');
  await born.fill('2025-01-01');
  await settings.getByRole('button', { name: 'Save map' }).click();
  await expect(settings.getByText(/Saved/).first()).toBeVisible();
  await settings.getByRole('button', { name: 'Close Settings' }).click();

  const stats = await openTool(page, 'Travel statistics', 'Travel statistics');
  const people = stats.getByRole('region', { name: 'Each traveller, from completed trips' });
  await expect(people.locator('[data-traveller-stats]').filter({ hasText: 'Charlie' })).toContainText(/278 days · \d+(\.\d)?% of their life/);
  // Alex's is the seed's: a small share of a longer life
  await expect(people.locator('[data-traveller-stats]').filter({ hasText: 'Alex' })).toContainText(/277 days · [0-9](\.\d)?% of their life/);

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

// 24 Nov 2026, the user's wish: "we need americans in miles always", a choice, and what the
// distance is like ("40000km ... once round the world", "380000 km ... the distance to the moon")
test('the distance travelled says what it’s like', { tag: '@phone' }, async ({ page }) => {
  await openMap(page);
  const stats = await openTool(page, 'Travel statistics', 'Travel statistics');
  // Every completed trip from home and back, around the world among them
  await expect(stats.locator('[data-distance-comparison]')).toHaveText('62,900 miles is about two and a half times round the world.');
});

test('a map whose home is in the United States shows miles; Settings can choose either', async ({ page }) => {
  await openMap(page);
  let settings = await openTool(page, 'Map settings', 'Settings');
  await settings.getByRole('tab', { name: 'This map' }).click();
  const home = settings.getByRole('region', { name: 'Home' });
  await home.getByLabel('Where you live').selectOption({ label: 'United States' });
  await expect(home.getByRole('status')).toContainText('Saved');
  await settings.getByRole('button', { name: 'Close Settings' }).click();

  let stats = await openTool(page, 'Travel statistics', 'Travel statistics');
  await expect(tile(stats, 'Distance travelled')).toContainText(/[1-9][\d,]* miles/);
  await expect(tile(stats, 'Distance travelled')).toContainText(/About [\d,]+ km/);
  await expect(tile(stats, 'Furthest from home')).toContainText(/miles from the United States/);
  await expect(stats.locator('[data-distance-comparison]')).toContainText(/^[\d,]+ miles is /);
  await stats.getByRole('button', { name: /^Close/ }).first().click();

  // Just kilometres or miles (25 Nov 2026, the user's wish), the home's ticked until one's chosen
  settings = await openTool(page, 'Map settings', 'Settings');
  const distances = settings.getByRole('group', { name: 'Distances' });
  await expect(distances.getByRole('radio')).toHaveCount(2);
  await expect(distances.getByLabel('Miles', { exact: true })).toBeChecked();
  await distances.getByText('Kilometres', { exact: true }).click();
  await expect(distances.getByLabel('Kilometres', { exact: true })).toBeChecked();
  await settings.getByRole('button', { name: 'Close Settings' }).click();
  stats = await openTool(page, 'Travel statistics', 'Travel statistics');
  await expect(tile(stats, 'Distance travelled')).toContainText(/[1-9][\d,]* km/);
  await expect(tile(stats, 'Furthest from home')).toContainText(/km from the United States/);
});
