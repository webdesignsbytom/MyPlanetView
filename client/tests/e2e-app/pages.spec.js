import { test, expect, HOME_MAP } from './fixtures.js';

// /welcome and /invite/:token are being restyled: these check roles and words only
test.describe('Account, welcome and invite pages', () => {
  test('the account page opens for the signed-in user', { tag: '@phone' }, async ({ page }) => {
    await page.goto('/account');
    await expect(page.getByRole('heading', { level: 1, name: 'Your account' })).toBeVisible();
    await expect(page.getByText('test@myplanetview.local').first()).toBeVisible();
    for (const name of ['Profile', 'Email', 'Password', 'Devices', 'Delete account']) {
      await expect(page.getByRole('region', { name, exact: true })).toBeVisible();
    }
  });

  test('the welcome page sets up the map and goes to it', { tag: '@phone' }, async ({ page }) => {
    await page.goto('/welcome');
    await expect(page.getByRole('heading', { level: 1, name: /^Welcome/ })).toBeVisible();
    await expect(page.getByRole('group', { name: 'Who is this map for?' })).toBeVisible();
    await expect(page.getByRole('radio', { name: /^A couple/ })).toBeChecked();
    const name = page.getByRole('textbox', { name: 'Map name' });
    await expect(name).toHaveValue(HOME_MAP);
    await expect(page.getByRole('group', { name: 'Traveller 1' }).getByRole('textbox', { name: 'Name' })).toHaveValue('Test');
    await expect(page.getByRole('group', { name: 'Traveller 2' }).getByRole('textbox', { name: 'Name' })).toHaveValue('Alex');

    await name.fill('Test and Alex abroad');
    await page.getByRole('button', { name: 'Start my map' }).click();
    await expect(page).toHaveURL(/\/map$/);
    await expect(page.getByRole('button', { name: 'Test and Alex abroad. Switch map' })).toBeVisible();
  });

  test('an invite link is accepted and opens what was shared', { tag: '@phone' }, async ({ page }) => {
    // The seeded invite: Jo's family map, as a viewer, for the test user's address
    await page.goto('/invite/demo-invite');
    await expect(page).toHaveURL(/\/maps\/map-jo$/);
    await expect(page.getByRole('button', { name: "Jo's family trips. Switch map" })).toBeVisible();
    await expect(page.getByText('Family · Viewer', { exact: true })).toBeVisible();

    // Used once: opening it again says so
    await page.goto('/invite/demo-invite');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('expired or has already been used');
  });
});
