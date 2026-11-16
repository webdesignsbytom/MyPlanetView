import { test, expect, HOME_MAP, openMap, openTool, toolbar } from './fixtures.js';

const banner = (page) => page.getByRole('region', { name: 'Verify your email' });

/** The mock badge's "Email verified" switch (it reloads the page). */
async function setEmailVerified(page, verified) {
  await page.getByRole('button', { name: 'Mock mode' }).click();
  const toggle = page.getByRole('switch', { name: 'Email verified' });
  await expect(toggle).toBeChecked({ checked: !verified });
  await page.getByText('Email verified', { exact: true }).click();
  await page.waitForLoadState();
  await expect(page.getByRole('switch', { name: 'Email verified' })).toHaveCount(0);
}

test.describe('An unverified email address', () => {
  test('locks the map’s changes, each saying why, and leaves settings and set-up open', { tag: '@phone' }, async ({ page }) => {
    await openMap(page);
    await setEmailVerified(page, false);
    await expect(banner(page)).toBeVisible();
    await expect(banner(page)).toContainText('test@myplanetview.local');
    await banner(page).getByRole('button', { name: 'Send the link again' }).click();
    await expect(banner(page).getByText('Sent. Check your inbox.')).toBeVisible();

    // Countries: statuses are words, with the reason
    const list = await openTool(page, 'Country list', 'Countries');
    await expect(list.getByText('Verify your email address to tick off countries.')).toBeVisible();
    await expect(list.getByRole('button', { name: /^Status for/ })).toHaveCount(0);
    await list.getByRole('searchbox', { name: 'Search countries' }).fill('france');
    await list.getByRole('button', { name: 'France', exact: true }).click();
    const france = page.getByRole('dialog', { name: 'France' });
    await expect(france.getByText('Verify your email address to mark countries, write notes, or add moments and photos.')).toBeVisible();
    await expect(france.getByRole('combobox')).toHaveCount(0);
    await expect(france.getByRole('button', { name: /^Add photos from/ })).toHaveCount(0);
    // Its moment is read, not changed; there's no note box to write in
    await expect(france.getByRole('heading', { name: 'Got engaged at the Eiffel Tower' })).toBeVisible();
    await expect(france.getByRole('button', { name: 'Add a moment' })).toHaveCount(0);
    await expect(france.getByRole('button', { name: /^(Edit|Delete) Got engaged/ })).toHaveCount(0);
    await expect(france.getByRole('textbox', { name: 'Notes' })).toHaveCount(0);

    // Photos, trips, another map
    const upload = await openTool(page, 'Add photos', 'Add photos');
    await expect(upload.getByText('Verify your email address to add photos.')).toBeVisible();
    await expect(upload.getByLabel(/choose photos/i)).toHaveCount(0);
    const trips = await openTool(page, 'Trips', 'Trips');
    await expect(trips.getByText('Verify your email address to plan a trip.')).toBeVisible();
    await expect(trips.getByRole('button', { name: 'Plan a new trip' })).toHaveCount(0);
    await page.getByRole('button', { name: `${HOME_MAP}. Switch map` }).click();
    const switcher = page.getByRole('dialog', { name: 'Your maps' });
    await expect(switcher.getByText('Verify your email address to make another map.')).toBeVisible();
    await expect(switcher.getByRole('button', { name: 'New map' })).toHaveCount(0);
    await switcher.getByRole('button', { name: 'Close Your maps' }).click();

    // Sharing: the link can still be copied; nothing else changes
    await toolbar(page).getByRole('button', { name: 'Share this map', exact: true }).click();
    const share = page.getByRole('dialog', { name: `Share “${HOME_MAP}”` });
    await expect(share.getByText(/need a verified email address/)).toBeVisible();
    await expect(share.getByRole('textbox', { name: 'Email address' })).toHaveCount(0);
    await expect(share.getByRole('combobox', { name: 'General access' })).toBeDisabled();
    await expect(share.getByRole('combobox', { name: 'Role for Alex Morgan' })).toBeDisabled();
    await expect(share.getByRole('button', { name: 'Remove Alex Morgan' })).toBeDisabled();
    await expect(share.getByRole('button', { name: 'Reset link' })).toHaveCount(0);
    await expect(share.getByRole('button', { name: 'Copy link' })).toBeEnabled();
    await share.getByRole('button', { name: 'Done' }).click();

    // Settings stay open: how it looks, and the map's set-up
    const settings = await openTool(page, 'Map settings', 'Settings');
    await settings.getByText('Galaxy', { exact: true }).click();
    await expect(page.locator('#main-content').locator('xpath=..')).toHaveAttribute('data-map-style', 'galaxy');
    await settings.getByRole('tab', { name: 'This map' }).click();
    const thisMap = settings.getByRole('tabpanel', { name: 'This map' });
    await thisMap.getByRole('textbox', { name: 'Map name' }).fill('Our travels');
    await thisMap.getByRole('button', { name: 'Save map' }).click();
    await expect(page.getByRole('button', { name: 'Our travels. Switch map' })).toBeVisible();

    // Verified again: the banner goes and the controls come back
    await setEmailVerified(page, true);
    await expect(page.getByRole('button', { name: 'Our travels. Switch map' })).toBeVisible();
    await expect(banner(page)).toHaveCount(0);
    const unlocked = await openTool(page, 'Country list', 'Countries');
    await unlocked.getByRole('searchbox', { name: 'Search countries' }).fill('france');
    await expect(unlocked.getByRole('button', { name: 'Status for France: Visited' })).toBeVisible();
  });

  test('locks a trip’s changes on its page, and its photos', async ({ page }) => {
    await page.goto('/trips/trip-italy');
    await expect(page.getByRole('heading', { level: 1, name: 'Italian summer' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit trip' })).toBeVisible();
    await setEmailVerified(page, false);

    await expect(page.getByRole('heading', { level: 1, name: 'Italian summer' })).toBeVisible();
    await expect(banner(page)).toBeVisible();
    await expect(page.getByText('Verify your email address to change this trip, its stops, moments or photos.')).toBeVisible();
    for (const name of ['Edit trip', 'Delete trip', 'Add a stop', 'Add photos', 'Add a moment']) {
      await expect(page.getByRole('button', { name, exact: true })).toHaveCount(0);
    }
    await expect(page.getByRole('button', { name: /^Move stop/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^(Edit|Remove) stop/ })).toHaveCount(0);
    // Who went is shown, not toggled; sharing still opens (to copy the link)
    await expect(page.getByRole('group', { name: 'Who’s going' }).getByRole('button')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Share', exact: true })).toBeVisible();

    // The photo: seen and downloadable, not changed
    await page.getByRole('region', { name: 'Photos' }).getByRole('button', { name: 'Open First morning in Rome' }).click();
    const viewer = page.getByRole('dialog', { name: 'First morning in Rome' });
    await expect(viewer.getByText('Verify your email address to change or delete photos.')).toBeVisible();
    await expect(viewer.getByRole('link', { name: 'Download original' })).toBeVisible();
    await expect(viewer.getByRole('button', { name: 'Edit' })).toHaveCount(0);
    await expect(viewer.getByRole('button', { name: 'Delete' })).toHaveCount(0);
  });
});
