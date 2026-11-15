import {
  test,
  expect,
  HOME_MAP,
  HOME_SHARE_CODE,
  SAM_MAP,
  SAM_SHARE_CODE,
  expectStats,
  goInApp,
  openMap,
  openTool,
  signOut,
  toolbar,
} from './fixtures.js';

async function openShareDialog(page) {
  await toolbar(page).getByRole('button', { name: 'Share this map', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: `Share “${HOME_MAP}”` });
  await expect(dialog.getByRole('region', { name: 'People with access' })).toBeVisible();
  return dialog;
}

const people = (dialog) => dialog.getByRole('region', { name: 'People with access' }).getByRole('listitem');

test.describe('Sharing a map', () => {
  test('the owner copies the link and adds, changes and removes people', async ({ page }) => {
    await openMap(page);
    const dialog = await openShareDialog(page);
    await expect(people(dialog)).toHaveText([/You\s*Owner/, /Alex Morgan/, /Sam Rivers/, /jo@example\.test\s*Invited as viewer/]);
    await expect(dialog.getByRole('combobox', { name: 'Role for Alex Morgan' })).toHaveValue('EDITOR');
    await expect(dialog.getByRole('combobox', { name: 'Role for Sam Rivers' })).toHaveValue('VIEWER');

    // The link, copied
    const link = dialog.getByRole('textbox', { name: 'Share link' });
    await expect(link).toHaveValue(new RegExp(`/shared/${HOME_SHARE_CODE}$`));
    await expect(dialog.getByText(HOME_SHARE_CODE, { exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Copy link' }).click();
    await expect(dialog.getByRole('button', { name: 'Copied' })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await link.inputValue());

    // Someone with an account is added straight away
    await dialog.getByRole('textbox', { name: 'Email address' }).fill('jo@example.test');
    await dialog.getByRole('combobox', { name: 'Role', exact: true }).selectOption('Editor');
    await dialog.getByRole('button', { name: 'Share', exact: true }).click();
    await expect(dialog.getByRole('status').filter({ hasText: 'Shared with jo@example.test.' })).toBeVisible();
    await expect(dialog.getByRole('combobox', { name: 'Role for Jo Patel' })).toHaveValue('EDITOR');
    await expect(dialog.getByRole('textbox', { name: 'Email address' })).toHaveValue('');

    // Anyone else gets an invite, which can be cancelled
    await dialog.getByRole('textbox', { name: 'Email address' }).fill('new.friend@example.test');
    await dialog.getByRole('button', { name: 'Share', exact: true }).click();
    const cancel = dialog.getByRole('button', { name: 'Cancel the invite to new.friend@example.test' });
    await expect(cancel).toBeVisible();
    await cancel.click();
    await expect(cancel).toHaveCount(0);

    // A role changed, someone removed
    await dialog.getByRole('combobox', { name: 'Role for Sam Rivers' }).selectOption('Editor');
    await expect(dialog.getByRole('combobox', { name: 'Role for Sam Rivers' })).toHaveValue('EDITOR');
    await dialog.getByRole('button', { name: 'Remove Alex Morgan' }).click();
    await expect(dialog.getByRole('button', { name: 'Remove Alex Morgan' })).toHaveCount(0);

    // Kept: the dialog opened again shows the same
    await dialog.getByRole('button', { name: 'Done' }).click();
    await expect(dialog).toBeHidden();
    const again = await openShareDialog(page);
    await expect(people(again)).toHaveText([/You\s*Owner/, /Sam Rivers/, /Jo Patel/, /jo@example\.test\s*Invited as viewer/]);
    await expect(again.getByRole('combobox', { name: 'Role for Sam Rivers' })).toHaveValue('EDITOR');
    // Escape closes it too
    await page.keyboard.press('Escape');
    await expect(again).toBeHidden();
  });

  test('link access decides whether a signed-out visitor can open the map, and a new link retires the old one', async ({ page }) => {
    await openMap(page);
    const dialog = await openShareDialog(page);
    const access = dialog.getByRole('combobox', { name: 'General access' });
    await expect(access).toHaveValue('RESTRICTED');
    await access.selectOption('Anyone with the link');
    await expect(access).toHaveValue('ANYONE_WITH_LINK');
    await expect(dialog.getByText('Anyone with the link can view it, without signing in')).toBeVisible();

    // Signed out, the link opens the map to view, without its hidden photo
    await signOut(page);
    await goInApp(page, `/shared/${HOME_SHARE_CODE}`);
    await expect(page.getByRole('application', { name: `${HOME_MAP}: world map` })).toBeVisible();
    await expect(page.getByText('Couple · Viewer, from a shared link')).toBeVisible();
    await expectStats(page, '8 countries, 2 continents, 4 photos');

    // Back as the owner (mock mode signs in again on a page load): a new link
    await openMap(page);
    const reset = await openShareDialog(page);
    await reset.getByRole('button', { name: 'Reset link' }).click();
    await reset.getByRole('button', { name: 'Keep this one' }).click();
    await reset.getByRole('button', { name: 'Reset link' }).click();
    await reset.getByRole('button', { name: 'Reset link' }).click();
    await expect(reset.getByRole('status').filter({ hasText: 'A new link is ready.' })).toBeVisible();
    const newLink = await reset.getByRole('textbox', { name: 'Share link' }).inputValue();
    expect(newLink).not.toContain(HOME_SHARE_CODE);
    const newCode = newLink.split('/shared/')[1];
    expect(newCode).toMatch(/^[2-9A-HJKMNP-TV-Z]{4}-[2-9A-HJKMNP-TV-Z]{4}-[2-9A-HJKMNP-TV-Z]{4}$/);

    // The old link stops working; the new one works, until access is restricted again
    await signOut(page);
    await goInApp(page, `/shared/${HOME_SHARE_CODE}`);
    await expect(page.getByRole('heading', { level: 1, name: 'Link not working' })).toBeVisible();
    await goInApp(page, `/shared/${newCode}`);
    await expect(page.getByRole('application', { name: `${HOME_MAP}: world map` })).toBeVisible();

    await openMap(page);
    const restrict = await openShareDialog(page);
    await restrict.getByRole('combobox', { name: 'General access' }).selectOption('Restricted');
    await expect(restrict.getByText('Only people added here can open it')).toBeVisible();
    await signOut(page);
    await goInApp(page, `/shared/${newCode}`);
    await expect(page.getByRole('heading', { level: 1, name: 'Link not working' })).toBeVisible();
  });

  test('a shared link opens view-only for someone signed out', { tag: '@phone' }, async ({ page }) => {
    await signOut(page);
    await goInApp(page, `/shared/${SAM_SHARE_CODE}`);
    await expect(page.getByRole('application', { name: `${SAM_MAP}: world map` })).toBeVisible();
    await expect(page.getByText('Solo · Viewer, from a shared link')).toBeVisible();
    await expectStats(page, '4 countries, 2 continents, 1 photo');

    // No switcher, no adding or sharing
    await expect(page.getByRole('button', { name: /Switch map$/ })).toHaveCount(0);
    await expect(toolbar(page).getByRole('button', { name: 'Add photos' })).toHaveCount(0);
    await expect(toolbar(page).getByRole('button', { name: 'Share this map' })).toHaveCount(0);

    // Statuses are words, not controls
    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('searchbox', { name: 'Search countries' }).fill('thai');
    await expect(list.getByRole('button', { name: /^Status for/ })).toHaveCount(0);
    await expect(list.getByRole('listitem')).toHaveText([/^Thailand\s*Visited$/]);
    await list.getByRole('button', { name: 'Thailand', exact: true }).click();

    const thailand = page.getByRole('dialog', { name: 'Thailand' });
    await expect(thailand.getByText(/^Visited, first on /)).toBeVisible();
    await expect(thailand.getByRole('combobox')).toHaveCount(0);
    await expect(thailand.getByRole('button', { name: /^Add photos from/ })).toHaveCount(0);

    // Its photo opens, with nothing to change and no original to download
    await thailand.getByRole('button', { name: 'Open Temple roofs' }).click();
    const viewer = page.getByRole('dialog', { name: 'Temple roofs' });
    await expect(viewer.getByText('Thailand', { exact: true })).toBeVisible();
    await expect(viewer.getByRole('button', { name: 'Edit' })).toHaveCount(0);
    await expect(viewer.getByRole('button', { name: 'Delete' })).toHaveCount(0);
    await expect(viewer.getByRole('link', { name: 'Download original' })).toHaveCount(0);
    await viewer.getByRole('button', { name: 'Close' }).click();

    // Trips are listed, not opened, and none can be planned
    const trips = await openTool(page, 'Trips', 'Trips');
    await expect(trips.getByText('South-East Asia loop')).toBeVisible();
    await expect(trips.getByRole('link')).toHaveCount(0);
    await expect(trips.getByRole('button', { name: 'Plan a new trip' })).toHaveCount(0);

    // Settings: only how it looks
    const settings = await openTool(page, 'Map settings', 'Settings');
    await expect(settings.getByRole('tab')).toHaveCount(0);
    await expect(settings.getByRole('radio', { name: 'Old map' })).toBeAttached();
  });

  test('a restricted link, or a code that can’t be one, opens nothing', async ({ page }) => {
    await signOut(page);
    await goInApp(page, `/shared/${HOME_SHARE_CODE}`);
    await expect(page.getByRole('heading', { level: 1, name: 'Link not working' })).toBeVisible();
    await expect(page.getByText(/This link doesn’t work/)).toBeVisible();

    await goInApp(page, '/shared/not-a-code');
    await expect(page.getByRole('heading', { level: 1, name: 'Link not working' })).toBeVisible();
  });

  test('someone the map is shared with sees their role and can leave it', async ({ page }) => {
    await openMap(page, '/maps/map-sam');
    await toolbar(page).getByRole('button', { name: 'Share this map', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: `Share “${SAM_MAP}”` });
    await expect(dialog.getByText('You’re a viewer on this map. Only its owner can change who has access.')).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'Email address' })).toHaveCount(0);

    await dialog.getByRole('button', { name: 'Remove me from this map' }).click();
    await expect(page).toHaveURL(/\/map$/);
    await expect(page.getByRole('button', { name: `${HOME_MAP}. Switch map` })).toBeVisible();
    await page.getByRole('button', { name: `${HOME_MAP}. Switch map` }).click();
    const switcher = page.getByRole('dialog', { name: 'Your maps' });
    await expect(switcher.getByRole('link', { name: new RegExp(`^${HOME_MAP}`) })).toBeVisible();
    await expect(switcher.getByRole('link', { name: new RegExp(`^${SAM_MAP}`) })).toHaveCount(0);
  });
});
