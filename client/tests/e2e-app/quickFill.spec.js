import { test, expect, expectMapOpen, expectStats, openMap, openSwitcher, openTool } from './fixtures.js';

// "Where have you been?" (22 Nov 2026, the user's wish): optional, once, the first time a new
// map loads (never on the sign-up or welcome pages), and from the country list any time after.
test.use({ quickFill: true });

async function newMap(page, name) {
  await openMap(page);
  const switcher = await openSwitcher(page);
  await switcher.getByRole('button', { name: 'New map' }).click();
  await switcher.getByRole('textbox', { name: 'Map name' }).fill(name);
  await switcher.getByRole('button', { name: 'Create map' }).click();
  await expect(page).toHaveURL(/\/maps\/[^/]+$/);
  await expectMapOpen(page, name);
}

const dialog = (page) => page.getByRole('dialog', { name: 'Where have you been?' });

test('a new map offers to tick its countries at once, and only once', async ({ page }) => {
  // The seeded map is full: it never asks
  await openMap(page);
  await expect(dialog(page)).toHaveCount(0);

  await newMap(page, 'Ticked trips');
  await expect(dialog(page)).toContainText('Your map is ready.');
  await dialog(page).getByRole('searchbox', { name: 'Find a country' }).fill('fra');
  await dialog(page).getByRole('checkbox', { name: 'France', exact: true }).check();
  await dialog(page).getByRole('searchbox', { name: 'Find a country' }).fill('');
  await dialog(page).getByRole('checkbox', { name: 'Japan', exact: true }).check();
  await dialog(page).getByRole('button', { name: 'Colour in 2 countries' }).click();
  await expect(dialog(page)).toHaveCount(0);
  await expectStats(page, '2 countries, 2 continents, 0 photos');

  // Asked once: not again on this map, or the next new one
  await page.reload();
  await expectMapOpen(page, 'Ticked trips');
  await expect(dialog(page)).toHaveCount(0);

  // The country list opens it any time, with what's on the map ticked and fixed
  const list = await openTool(page, 'Country list', 'Countries');
  await list.getByRole('button', { name: 'Tick several countries' }).click();
  await expect(dialog(page).getByRole('checkbox', { name: 'France (on your map)' })).toBeChecked();
  await expect(dialog(page).getByRole('checkbox', { name: 'France (on your map)' })).toBeDisabled();
  await dialog(page).getByRole('checkbox', { name: 'Peru', exact: true }).check();
  await dialog(page).getByRole('button', { name: 'Colour in 1 country' }).click();
  await expect(dialog(page)).toHaveCount(0);
  await expectStats(page, '3 countries, 3 continents, 0 photos');
});

test('it can be skipped', async ({ page }) => {
  await newMap(page, 'Skipped');
  await dialog(page).getByRole('button', { name: 'Skip' }).click();
  await expect(dialog(page)).toHaveCount(0);
  await expectStats(page, '0 countries, 0 continents, 0 photos');
});
