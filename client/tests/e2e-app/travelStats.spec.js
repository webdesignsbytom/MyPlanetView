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
