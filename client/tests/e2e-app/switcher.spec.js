import { test, expect, HOME_MAP, SAM_MAP, expectStats, openMap, openTool, toolbar } from './fixtures.js';

const switchButton = (page, name) => page.getByRole('button', { name: `${name}. Switch map` });

async function openSwitcher(page, currentName) {
  await switchButton(page, currentName).click();
  const switcher = page.getByRole('dialog', { name: 'Your maps' });
  await expect(switcher).toBeVisible();
  return switcher;
}

async function openThisMapSettings(page) {
  const settings = await openTool(page, 'Map settings', 'Settings');
  await settings.getByRole('tab', { name: 'This map' }).click();
  return settings.getByRole('tabpanel', { name: 'This map' });
}

test.describe('The map switcher', () => {
  test('lists your maps, maps and trips shared with you, and opens another', async ({ page }) => {
    await openMap(page);
    const switcher = await openSwitcher(page, HOME_MAP);
    await expect(switcher.getByRole('link', { name: new RegExp(`^${HOME_MAP}`) })).toHaveAttribute('aria-current', 'page');
    await expect(switcher.getByRole('heading', { name: 'Shared with you', exact: true })).toBeVisible();
    await expect(switcher.getByRole('link', { name: /Viewer, Sam Rivers’s map/ })).toBeVisible();
    await expect(switcher.getByRole('heading', { name: 'Group trips' })).toBeVisible();
    await expect(switcher.getByRole('link', { name: /Lisbon weekend/ })).toBeVisible();

    // A map shared with you as a viewer: no editing, no sharing it on
    await switcher.getByRole('link', { name: new RegExp(`^${SAM_MAP}`) }).click();
    await expect(page).toHaveURL(/\/maps\/map-sam$/);
    await expect(switchButton(page, SAM_MAP)).toBeVisible();
    await expect(page.getByText('Solo · Viewer', { exact: true })).toBeVisible();
    await expect(toolbar(page).getByRole('button', { name: 'Add photos' })).toHaveCount(0);
    const list = await openTool(page, 'Country list', 'Countries');
    await expect(list.getByRole('button', { name: /^Status for / })).toHaveCount(0);
  });

  test('a map you have no role on can’t be opened, and offers your own', async ({ page }) => {
    // Jo's map: the invite to it hasn't been accepted
    await page.goto('/maps/map-jo');
    await expect(page.getByRole('heading', { level: 1, name: 'This map can’t be opened' })).toBeVisible();
    await page.getByRole('link', { name: 'Go to your own map' }).click();
    await expect(page).toHaveURL(/\/map$/);
    await expect(switchButton(page, HOME_MAP)).toBeVisible();
  });

  test('a new map is created, renamed and deleted; the default map can’t be deleted', async ({ page }) => {
    await openMap(page);
    const homeSettings = await openThisMapSettings(page);
    await expect(homeSettings.getByRole('textbox', { name: 'Map name' })).toHaveValue(HOME_MAP);
    await expect(homeSettings.getByRole('button', { name: 'Delete map' })).toHaveCount(0);

    // New
    const switcher = await openSwitcher(page, HOME_MAP);
    await switcher.getByRole('button', { name: 'New map' }).click();
    await switcher.getByText('Just me', { exact: true }).click();
    await expect(switcher.getByRole('radio', { name: /^Just me/ })).toBeChecked();
    // A name is required
    await switcher.getByRole('button', { name: 'Create map' }).click();
    await expect(switcher.getByRole('alert')).toHaveText('Give the map a name.');
    await switcher.getByRole('textbox', { name: 'Map name' }).fill('Road trips');
    await switcher.getByRole('button', { name: 'Create map' }).click();

    await expect(page).toHaveURL(/\/maps\/[^/]+$/);
    await expect(switchButton(page, 'Road trips')).toBeVisible();
    await expect(page.getByText('Solo', { exact: true })).toBeVisible();
    await expectStats(page, '0 countries, 0 continents, 0 photos');

    // Renamed, in its settings
    const settings = await openThisMapSettings(page);
    await settings.getByRole('textbox', { name: 'Map name' }).fill('Road trips 2027');
    await settings.getByRole('button', { name: 'Save map' }).click();
    await expect(switchButton(page, 'Road trips 2027')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Road trips 2027' })).toBeAttached();

    const renamed = await openSwitcher(page, 'Road trips 2027');
    await expect(renamed.getByRole('link', { name: /^Road trips 2027/ })).toHaveAttribute('aria-current', 'page');

    // Deleted: asked first, then back to the default map
    const again = await openThisMapSettings(page);
    await again.getByRole('button', { name: 'Delete map' }).click();
    await again.getByRole('button', { name: 'Keep it' }).click();
    await again.getByRole('button', { name: 'Delete map' }).click();
    await again.getByRole('button', { name: 'Yes, delete it' }).click();

    await expect(page).toHaveURL(/\/map$/);
    await expect(switchButton(page, HOME_MAP)).toBeVisible();
    const after = await openSwitcher(page, HOME_MAP);
    await expect(after.getByRole('link', { name: new RegExp(`^${HOME_MAP}`) })).toBeVisible();
    await expect(after.getByRole('link', { name: /^Road trips/ })).toHaveCount(0);
  });
});
