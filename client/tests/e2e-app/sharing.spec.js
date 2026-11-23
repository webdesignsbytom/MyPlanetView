import { test, expect, HOME_MAP, HOME_SHARE_CODE, MOCK_STORE_KEY, SAM_MAP, SAM_SHARE_CODE, expectMapOpen, expectStats, goInApp, openMap, openSwitcher, openTool, pressTool, showsBanner, showTools, signOut, toolbar } from './fixtures.js';

async function openShareDialog(page) {
  await pressTool(page, 'Share this map');
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

    // Anyone else gets an invite, which can be cancelled, after being asked
    await dialog.getByRole('textbox', { name: 'Email address' }).fill('new.friend@example.test');
    await dialog.getByRole('button', { name: 'Share', exact: true }).click();
    const cancel = dialog.getByRole('button', { name: 'Cancel the invite to new.friend@example.test' });
    await expect(cancel).toBeVisible();
    await cancel.click();
    const cancelling = page.getByRole('dialog', { name: 'Cancel the invite?' });
    await expect(cancelling).toContainText('The invite to new.friend@example.test will stop working');
    await cancelling.getByRole('button', { name: 'Cancel the invite', exact: true }).click();
    await expect(cancelling).toBeHidden();
    await expect(cancel).toHaveCount(0);

    // A role changed, someone removed: asked first, "Keep them" changes nothing
    await dialog.getByRole('combobox', { name: 'Role for Sam Rivers' }).selectOption('Editor');
    await expect(dialog.getByRole('combobox', { name: 'Role for Sam Rivers' })).toHaveValue('EDITOR');
    const removeAlex = dialog.getByRole('button', { name: 'Remove Alex Morgan' });
    await removeAlex.click();
    const removing = page.getByRole('dialog', { name: 'Remove Alex Morgan?' });
    await removing.getByRole('button', { name: 'Keep them' }).click();
    await expect(removing).toBeHidden();
    await expect(removeAlex).toBeVisible();
    await removeAlex.click();
    await removing.getByRole('button', { name: 'Remove', exact: true }).click();
    await expect(removing).toBeHidden();
    await expect(removeAlex).toHaveCount(0);

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
    // Five page loads (signing out and in between): about 36 s of the 60, so a busy machine
    // timed it out once (19 Nov 2026, the audit); three times the time
    test.slow();
    await openMap(page);
    const dialog = await openShareDialog(page);
    const access = dialog.getByRole('combobox', { name: 'General access' });
    await expect(access).toHaveValue('RESTRICTED');
    await access.selectOption('Anyone with the link');
    await expect(access).toHaveValue('ANYONE_WITH_LINK');
    await expect(dialog.getByText('Anyone with the link can view it in their browser: no app or account needed')).toBeVisible();

    // Signed out, the link opens the map to view, without its hidden photo
    await signOut(page);
    await goInApp(page, `/shared/${HOME_SHARE_CODE}`);
    await expect(page.getByRole('application', { name: `${HOME_MAP}: world map` })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Map banner' })).toContainText(HOME_MAP);
    await expectStats(page, '8 countries, 2 continents, 15 photos');

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
    // The map's name on the banner (wide screens)
    if (showsBanner(page)) await expect(page.getByRole('region', { name: 'Map banner' })).toContainText(SAM_MAP);
    await expectStats(page, '4 countries, 2 continents, 1 photo');

    // No switcher, no adding or sharing
    await expect(page.getByRole('button', { name: /Switch map$/ })).toHaveCount(0);
    // With the phone's menu open, so a tool that's missing is really missing
    await showTools(page);
    await expect(toolbar(page).getByRole('button', { name: 'Your maps' })).toHaveCount(0);
    await expect(toolbar(page).getByRole('button', { name: 'Share this map' })).toHaveCount(0);
    // The map's photos, with their countries, and nothing to add them with
    const gallery = await openTool(page, 'Photo album', 'Photo album');
    await expect(gallery.getByRole('button', { name: 'Open Temple roofs' })).toBeVisible();
    await expect(gallery.getByText('Thailand', { exact: true })).toBeVisible();
    await expect(gallery.getByRole('button', { name: 'Add photos' })).toHaveCount(0);

    // Statuses are words, not controls
    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('searchbox', { name: 'Search countries' }).fill('thai');
    await expect(list.getByRole('button', { name: /^Status for/ })).toHaveCount(0);
    await expect(list.getByRole('listitem')).toHaveText([/^Thailand\s*Visited$/]);
    await list.getByRole('button', { name: 'Thailand', exact: true }).click();

    const thailand = page.getByRole('dialog', { name: 'Thailand' });
    await expect(thailand.getByText(/^Visited, first on /)).toBeVisible();
    await expect(thailand.getByRole('combobox')).toHaveCount(0);
    await expect(thailand.getByRole('button', { name: 'Add photos', exact: true })).toHaveCount(0);

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
    await pressTool(page, 'Share this map');
    const dialog = page.getByRole('dialog', { name: `Share “${SAM_MAP}”` });
    await expect(dialog.getByText('You’re a viewer on this map. Only its owner and co-owners can change who has access.')).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'Email address' })).toHaveCount(0);

    await dialog.getByRole('button', { name: 'Remove me from this map' }).click();
    await expect(page).toHaveURL(/\/map$/);
    await expectMapOpen(page, HOME_MAP);
    const switcher = await openSwitcher(page);
    await expect(switcher.getByRole('link', { name: new RegExp(`^${HOME_MAP}`) })).toBeVisible();
    await expect(switcher.getByRole('link', { name: new RegExp(`^${SAM_MAP}`) })).toHaveCount(0);
  });
});

// Co-owners (19 Nov 2026, docs/API.md "Co-owners"): one of the map's travellers with their own login
test.describe('Co-owners', () => {
  test('a co-owner is a traveller with no login yet: with none free, the form says so', async ({ page }) => {
    await openMap(page);
    const dialog = await openShareDialog(page);
    // Charlie and Alex both have logins
    await dialog.getByRole('combobox', { name: 'Role', exact: true }).selectOption('Co-owner');
    await expect(dialog.getByText(/every traveller here has one/)).toBeVisible();
    await dialog.getByRole('textbox', { name: 'Email address' }).fill('riley@example.test');
    await expect(dialog.getByRole('button', { name: 'Share' })).toBeDisabled();
  });

  test('invites a traveller as a co-owner, who signs up from the link with the address kept', async ({ page }) => {
    await openMap(page);
    // A family map with a traveller who has no login yet
    await page.evaluate(
      ({ key, name }) => {
        const store = JSON.parse(localStorage.getItem(key));
        const map = store.maps.find((m) => m.name === name);
        map.groupType = 'FAMILY';
        store.travellers.push({ id: 'trav-riley', mapId: map.id, name: 'Riley', position: 2, userId: null, birthCountryCode: null, favouriteCountryCode: null });
        localStorage.setItem(key, JSON.stringify(store));
      },
      { key: MOCK_STORE_KEY, name: HOME_MAP },
    );
    await page.reload();
    await expectMapOpen(page, HOME_MAP);

    const dialog = await openShareDialog(page);
    await dialog.getByRole('textbox', { name: 'Email address' }).fill('riley@example.test');
    await dialog.getByRole('combobox', { name: 'Role', exact: true }).selectOption('Co-owner');
    await expect(dialog.getByRole('combobox', { name: 'Which traveller is this?' })).toHaveValue('trav-riley');
    await dialog.getByRole('button', { name: 'Share' }).click();
    await expect(people(dialog).last()).toHaveText(/riley@example\.test\s*Invited as co-owner \(Riley\)/);

    const token = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).invites.find((i) => i.email === 'riley@example.test').token, MOCK_STORE_KEY);
    await signOut(page);
    await goInApp(page, `/invite/${token}`);
    await expect(page.getByText(`Charlie Reid invited you to be a co-owner of the map “${HOME_MAP}”, as Riley.`)).toBeVisible();
    // The map is on Business: a new account gets it at half price (the invite offer)
    await expect(page.getByTestId('invite-offer')).toHaveText('Join within 7 days and get Business at half price for your first 3 months (or £7.49 off your first year).');
    await page.getByRole('link', { name: 'Create an account' }).click();

    const email = page.getByRole('textbox', { name: 'Email' });
    await expect(email).toHaveValue('riley@example.test');
    await expect(email).toHaveAttribute('readonly', '');
    await expect(page.getByRole('textbox', { name: 'Username' })).toHaveValue('Riley');

    // Signed up from the link: verified at once, straight to the map (mock mode's one user owns it)
    await page.getByLabel('Password', { exact: true }).fill('Riley-Travels-2026');
    await page.getByLabel('Confirm Password', { exact: true }).fill('Riley-Travels-2026');
    await page.getByRole('checkbox', { name: /13 or over/ }).check();
    await page.getByRole('button', { name: 'Register your account' }).click();
    await expect(page).toHaveURL(/\/maps\/[^/]+$/);
    await expectMapOpen(page, HOME_MAP);
    await expect(page.getByRole('region', { name: 'Verify your email' })).toHaveCount(0);
  });
});
