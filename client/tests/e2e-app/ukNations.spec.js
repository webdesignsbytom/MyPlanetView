import { test, expect, HOME_SHARE_CODE, expectStats, goInApp, openMap, openTool, openUploader, mapReady } from './fixtures.js';

// The UK's nations (docs/API.md "The UK's nations"): the owner splits the map's UK into
// England, Scotland, Wales and Northern Ireland in the settings, and back. The seed's map
// has the UK marked "Lived there" by hand, and photos of Tower Bridge and Edinburgh Castle
// with their GPS positions.
const SPLIT = 'Show the UK as England, Scotland, Wales and Northern Ireland';

async function setSplit(page, on) {
  const settings = await openTool(page, 'Map settings', 'Settings');
  await settings.getByRole('tab', { name: 'This map' }).click();
  const panel = settings.getByRole('tabpanel', { name: 'This map' });
  const toggle = panel.getByRole('switch', { name: SPLIT });
  // The switch's own box is visually hidden: its label is what's pressed
  if (on) await expect(toggle).not.toBeChecked();
  else await expect(toggle).toBeChecked();
  await panel.getByText(SPLIT, { exact: true }).click();
  if (on) await expect(toggle).toBeChecked();
  else await expect(toggle).not.toBeChecked();
  await panel.getByRole('button', { name: 'Save map' }).click();
  await expect(panel.getByText('Saved.')).toBeVisible();
  await settings.getByRole('button', { name: 'Close Settings' }).click();
}

test.describe('The UK’s nations', () => {
  test('the owner splits the UK into its nations, gives the old UK mark its nations, and joins them again', async ({ page }) => {
    await openMap(page);
    await expect(page.locator('[data-code="GB"]')).toHaveCount(1);
    await expect(page.locator('[data-code="XC"]')).toHaveCount(0);
    await expectStats(page, '8 countries, 2 continents, 16 photos');

    // Split: the four nations are drawn instead, and the photos with a position went to
    // England and Scotland; the UK, marked by hand, waits for its nations
    await setSplit(page, true);
    for (const code of ['XE', 'XC', 'XW', 'XI']) await expect(page.locator(`[data-code="${code}"]`)).toHaveCount(1);
    await expect(page.locator('[data-code="GB"]')).toHaveCount(0);
    await expect(page.locator('[data-code="XE"]')).toHaveAttribute('data-been', 'true');
    await expect(page.locator('[data-code="XC"]')).toHaveAttribute('data-been', 'true');
    await expect(page.locator('[data-code="XW"]')).toHaveAttribute('data-been', 'false');
    // England and Scotland count as two; the UK no longer counts as well
    await expectStats(page, '9 countries, 2 continents, 16 photos');

    // The country list has the nations, and the UK while it waits; its ticket asks
    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('searchbox', { name: 'Search countries' }).fill('scot');
    await expect(list.getByRole('button', { name: 'Status for Scotland: Visited' })).toBeVisible();
    await list.getByRole('searchbox', { name: 'Search countries' }).fill('united kingdom');
    await list.getByRole('button', { name: 'United Kingdom', exact: true }).click();
    const uk = page.getByRole('dialog', { name: 'United Kingdom' });
    const ask = uk.getByRole('group', { name: 'Which parts of the UK?' });
    await expect(ask.getByRole('checkbox', { name: 'England' })).toBeChecked();
    await expect(ask.getByRole('checkbox', { name: 'Scotland' })).toBeChecked();
    await ask.getByRole('checkbox', { name: 'Wales' }).check();
    await ask.getByRole('button', { name: 'Save' }).click();
    await expect(uk).toHaveCount(0);
    await expect(page.locator('[data-code="XW"]')).toHaveAttribute('data-been', 'true');
    await expectStats(page, '10 countries, 2 continents, 16 photos');

    // Joined again: one UK, counted once
    await setSplit(page, false);
    await expect(page.locator('[data-code="GB"]')).toHaveCount(1);
    await expect(page.locator('[data-code="XC"]')).toHaveCount(0);
    await expect(page.locator('[data-code="GB"]')).toHaveAttribute('data-been', 'true');
    await expectStats(page, '8 countries, 2 continents, 16 photos');
  });

  test('on a split map each nation has its own landmarks, the pickers offer the nations, and a share link draws them', async ({ page }) => {
    await openMap(page);
    await setSplit(page, true);

    // Wales's ticket lists the UK landmarks in Wales, and only those
    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('searchbox', { name: 'Search countries' }).fill('wales');
    await list.getByRole('button', { name: 'Wales', exact: true }).click();
    const wales = page.getByRole('dialog', { name: 'Wales' });
    await expect(wales.getByText('Blaenavon Industrial Landscape')).toBeVisible();
    await expect(wales.getByText('Stonehenge')).toHaveCount(0);
    await wales.getByRole('button', { name: 'Close Wales' }).click();

    // The upload panel offers the nations instead of the UK
    const upload = await openUploader(page);
    const choice = upload.getByRole('combobox', { name: 'Country for photos with no location' });
    await expect(choice.locator('option', { hasText: /^Scotland$/ })).toHaveCount(1);
    await expect(choice.locator('option', { hasText: /^United Kingdom$/ })).toHaveCount(0);
    await upload.getByRole('button', { name: 'Close Add photos' }).click();

    // So does the trip page's stop form, and a stop goes in its nation
    await page.goto('/trips/trip-japan');
    // A trip with stops keeps its form behind this button
    await page.getByRole('region', { name: 'Stops' }).getByRole('button', { name: 'Add a stop' }).click();
    const form = page.getByRole('region', { name: 'Stops' }).getByRole('region', { name: 'Add a stop' });
    await form.getByRole('combobox', { name: 'Country', exact: true }).selectOption({ label: 'Wales' });
    await form.getByRole('textbox', { name: 'Town or place' }).fill('Cardiff');
    await form.getByRole('button', { name: 'Add stop' }).click();
    await expect(page.getByRole('region', { name: 'Stops' }).getByRole('listitem').filter({ hasText: 'Cardiff' })).toContainText('Wales');

    // A share link of the map draws the nations too
    await openMap(page);
    await goInApp(page, `/shared/${HOME_SHARE_CODE}`);
    await expect(page.locator('[data-code="XC"]')).toHaveCount(1);
    await expect(page.locator('[data-code="GB"]')).toHaveCount(0);
  });

  test('a new account’s set-up offers the split, off to start with, and splits the map', async ({ page }) => {
    await page.goto('/welcome');
    const toggle = page.getByRole('switch', { name: SPLIT });
    await expect(toggle).toBeVisible();
    await expect(toggle).not.toBeChecked();
    await page.getByText(SPLIT, { exact: true }).click();
    await expect(toggle).toBeChecked();
    await page.getByRole('button', { name: 'Start my map' }).click();
    // On to the map, drawn with the nations
    await mapReady(page);
    await expect(page.locator('[data-code="XC"]')).toHaveCount(1);
    await expect(page.locator('[data-code="GB"]')).toHaveCount(0);
  });
});
