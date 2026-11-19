import { test, expect, HOME_MAP, MOCK_STORE_KEY, expectMapOpen, makeJpeg, openMap, openSwitcher, openTool, openUploader, pressTool } from './fixtures.js';

// Paid plans (docs/API.md, "Plans and billing", "Map limits", "Transferring a map",
// "Leaving") against mock mode, where Checkout applies at once and comes back to
// /account?billing=success. The seeded test user pays monthly for Business with one extra
// map, and owns one map, so one more fits; the mock badge's Plan and Extra maps change that.

const planCard = (page) => page.getByRole('region', { name: 'Your plan' });

/** A mock badge dropdown (Plan, Extra maps paid): choosing reloads the page. */
async function chooseInBadge(page, name, label) {
  const badge = page.getByRole('complementary', { name: 'Mock mode' });
  await badge.getByRole('button', { name: 'Mock mode' }).click();
  await badge.getByRole('combobox', { name }).selectOption({ label });
  await page.waitForLoadState();
  await expect(badge.getByRole('combobox', { name })).toHaveCount(0);
}

/** Change the saved demo data, then load the page again so mock mode reads it. */
async function editStore(page, edit, arg) {
  await page.evaluate(
    ({ key, source, value }) => {
      const db = JSON.parse(localStorage.getItem(key));
      new Function('db', 'value', source)(db, value);
      localStorage.setItem(key, JSON.stringify(db));
    },
    { key: MOCK_STORE_KEY, source: `(${edit.toString()})(db, value);`, value: arg },
  );
  await page.reload();
}

/** A new map from the switcher; resolves once its page is open. */
async function newMap(page, currentName, name) {
  await expectMapOpen(page, currentName);
  const switcher = await openSwitcher(page);
  await switcher.getByRole('button', { name: 'New map' }).click();
  await switcher.getByText('Just me', { exact: true }).click();
  await switcher.getByRole('textbox', { name: 'Map name' }).fill(name);
  await switcher.getByRole('button', { name: 'Create map' }).click();
  return switcher;
}

test.describe('Plans', () => {
  test('the pricing page shows the three plans, their prices and the extra maps', { tag: '@phone' }, async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByRole('heading', { level: 1, name: 'Pricing' })).toBeVisible();
    for (const name of ['Economy', 'Business', 'First Class']) {
      await expect(page.getByRole('heading', { level: 3, name })).toBeVisible();
    }
    const business = page.getByRole('article', { name: 'Business' });
    await expect(business).toContainText('£4.99');
    await expect(business).toContainText('or £49 a year: two months free');
    await expect(business).toContainText('200 photos of each country, on each map');
    await expect(page.getByRole('article', { name: 'First Class' })).toContainText('£8.99');
    await expect(page.getByText('Business and First Class members never see ad cards on a map.')).toBeVisible();
    await expect(page.getByRole('region', { name: 'More than one map' })).toContainText('£5.99 a month');
    await expect(page.getByRole('region', { name: 'On every plan' })).toBeVisible();
    // In the footer's Explore links
    await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Pricing' })).toBeVisible();
  });

  test('the account page shows the plan, upgrades it, and adds an extra map', async ({ page }) => {
    await page.goto('/account');
    const card = planCard(page);
    await expect(card.getByText('Business', { exact: true })).toBeVisible();
    await expect(card.getByText('Paid monthly, £4.99 a month')).toBeVisible();
    await expect(card.getByText(/^Renews on /)).toBeVisible();
    await expect(card).toContainText('You own 1 map. Your plan includes 1 map, and you pay for 1 extra map (0 in use).');

    // An upgrade changes the subscription in place
    await card.getByRole('button', { name: 'Upgrade to First Class' }).click();
    await expect(card.getByRole('status').filter({ hasText: 'Done: you’re on First Class, paid monthly.' })).toBeVisible();
    await expect(card.getByText('First Class', { exact: true }).first()).toBeVisible();
    await expect(card.getByText('Paid monthly, £8.99 a month')).toBeVisible();

    // An extra map on First Class costs more, and goes on the same payment
    await expect(card.getByText(/^£5\.99 a month, on your monthly payment/)).toBeVisible();
    await card.getByRole('button', { name: 'Add an extra map' }).click();
    await expect(card.getByRole('status').filter({ hasText: 'Done: you pay for 2 extra maps.' })).toBeVisible();

    // Stripe's billing page is the account page in mock mode
    await card.getByRole('button', { name: 'Manage billing' }).click();
    await expect(page).toHaveURL(/\/account$/);
  });

  test('on Economy, an upgrade goes through Checkout and comes back to the account page', async ({ page }) => {
    await page.goto('/account');
    await chooseInBadge(page, 'Plan', 'Economy');
    await chooseInBadge(page, 'Extra maps paid', '0');
    const card = planCard(page);
    await expect(card.getByText('Free', { exact: true })).toBeVisible();

    await card.getByText('Yearly', { exact: true }).click();
    await card.getByRole('button', { name: 'Upgrade to Business' }).click();
    await expect(page).toHaveURL(/\/account\?billing=success$/);
    await expect(planCard(page).getByText(/^Thank you: checkout went through/)).toBeVisible();
    await expect(planCard(page).getByText('Paid yearly, £49 a year')).toBeVisible();
  });

  test('a map beyond the paid slots asks to pay for an extra map, then is made', async ({ page }) => {
    await openMap(page);
    // The seed's extra map makes room for one
    await newMap(page, HOME_MAP, 'Road trips');
    await expectMapOpen(page, 'Road trips');

    // The next is refused (402): the dialog offers the plan's price, then makes it
    const switcher = await newMap(page, 'Road trips', 'Family');
    const dialog = page.getByRole('dialog', { name: 'Pay for another map' });
    await expect(dialog.getByText('An extra map is £3.99 a month or £39 a year.')).toBeVisible();
    await dialog.getByRole('button', { name: 'Pay £3.99 a month' }).click();
    await expect(dialog).toBeHidden();
    await expect(switcher).toBeHidden();
    await expectMapOpen(page, 'Family');
  });

  test('on Economy with no extra maps, a new map waits for Checkout and is made on the account page', async ({ page }) => {
    await openMap(page);
    await chooseInBadge(page, 'Plan', 'Economy');
    await chooseInBadge(page, 'Extra maps paid', '0');
    await expectMapOpen(page, HOME_MAP);

    await newMap(page, HOME_MAP, 'Girls’ trips');
    const dialog = page.getByRole('dialog', { name: 'Pay for another map' });
    await dialog.getByText('Yearly', { exact: true }).click();
    await dialog.getByRole('button', { name: 'Go to checkout' }).click();

    await expect(page).toHaveURL(/\/account\?billing=success$/);
    const card = planCard(page);
    await expect(card.getByText('Your new map “Girls’ trips” is ready.')).toBeVisible();
    await card.getByRole('link', { name: 'Open it' }).click();
    await expectMapOpen(page, 'Girls’ trips');
  });

  test('a map that isn’t paid for takes no photos, says why, and paying unlocks it', async ({ page }) => {
    await openMap(page);
    await newMap(page, HOME_MAP, 'Road trips');
    await expectMapOpen(page, 'Road trips');
    // No extra maps paid any more: the newer map is locked
    await chooseInBadge(page, 'Extra maps paid', '0');

    const banner = page.getByRole('region', { name: 'This map isn’t paid for' });
    await expect(banner).toBeVisible();
    const upload = await openUploader(page);
    await expect(upload.getByText(/^This map isn’t paid for, so it can’t take new photos\./)).toBeVisible();
    await expect(upload.getByLabel(/choose photos/i)).toHaveCount(0);
    await upload.getByRole('button', { name: 'Close Add photos' }).click();

    await banner.getByRole('button', { name: 'Pay for this map' }).click();
    const dialog = page.getByRole('dialog', { name: 'Pay for this map' });
    await dialog.getByRole('button', { name: 'Pay £3.99 a month' }).click();
    await expect(banner).toHaveCount(0);
    const unlocked = await openUploader(page);
    await expect(unlocked.getByLabel(/choose photos/i)).toBeAttached();
  });

  test('on Economy an upload keeps a print copy, not the original', async ({ page }) => {
    await openMap(page);
    await chooseInBadge(page, 'Plan', 'Economy');
    const upload = await openUploader(page);
    await expect(upload.getByText('Economy keeps a print-quality copy (good up to A4). Business keeps your full-size originals.')).toBeVisible();
    await upload.getByRole('combobox', { name: 'Country for photos with no location' }).selectOption({ label: 'Germany' });
    await expect(upload.getByText('0 of 30 photos of Germany on this map.')).toBeVisible();
    // The mock bucket and presign refuse an ORIGINAL on Economy, as the server does
    const file = await makeJpeg(page, { name: 'print.jpg' });
    await upload.getByLabel(/choose photos/i).setInputFiles(file);
    await expect(upload.getByRole('listitem').filter({ hasText: 'print.jpg' })).toContainText('Added');
    await expect(upload.getByText('1 of 30 photos of Germany on this map.')).toBeVisible();
    await upload.getByRole('button', { name: 'Close Add photos' }).click();

    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('searchbox', { name: 'Search countries' }).fill('germany');
    await list.getByRole('button', { name: 'Germany', exact: true }).click();
    await page.getByRole('dialog', { name: 'Germany' }).getByRole('button', { name: 'Open Photo' }).click();
    const viewer = page.getByRole('dialog', { name: 'Photo' });
    const download = viewer.getByRole('link', { name: 'Download print copy' });
    await expect(download).toBeVisible();
    await expect(viewer.getByRole('link', { name: 'Download original' })).toHaveCount(0);
    // The kept copy is the browser's JPEG
    const href = await download.getAttribute('href');
    expect(await page.evaluate((url) => fetch(url).then((r) => r.blob()).then((b) => b.type), href)).toBe('image/jpeg');
  });

  test('a full country stops the uploader, and a photo can’t be moved there', async ({ page }) => {
    await openMap(page);
    // France has 3 photos; 27 more fills it on Economy (30 per country), with no subscription
    await editStore(page, (db) => {
      const eiffel = db.photos.find((p) => p.id === 'photo-eiffel');
      for (let i = 0; i < 27; i++) {
        const copy = { ...eiffel, id: `photo-fill-${i}`, caption: `Paris ${i}` };
        delete copy.countryPosition;
        db.photos.push(copy);
      }
      db.subscriptions = [];
    });
    await expectMapOpen(page, HOME_MAP);

    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('searchbox', { name: 'Search countries' }).fill('france');
    await list.getByRole('button', { name: 'France', exact: true }).click();
    await page.getByRole('dialog', { name: 'France' }).getByRole('button', { name: 'Add photos', exact: true }).click();
    const upload = page.getByRole('dialog', { name: 'Add photos: France' });
    await expect(upload.getByText('30 of 30 photos of France on this map.')).toBeVisible();
    await expect(upload.getByLabel(/choose photos/i)).toBeDisabled();
    await expect(upload.getByRole('link', { name: 'Upgrade your plan' })).toBeVisible();
    await upload.getByRole('button', { name: 'Close Add photos: France' }).click();

    // Moving a Dutch photo to France is refused with the cap's message
    const again = await openTool(page, 'Country list', 'Countries');
    await again.getByRole('searchbox', { name: 'Search countries' }).fill('netherlands');
    await again.getByRole('button', { name: 'Netherlands', exact: true }).click();
    await page.getByRole('dialog', { name: 'Netherlands' }).getByRole('button', { name: 'Open Canals at dusk' }).click();
    const viewer = page.getByRole('dialog', { name: 'Canals at dusk' });
    await viewer.getByRole('button', { name: 'Edit' }).click();
    await viewer.getByRole('combobox', { name: 'Country' }).selectOption({ label: 'France' });
    await viewer.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(viewer.getByRole('alert')).toHaveText('30 of 30 photos of France on this map. Upgrade to add more.');
  });

  test('the owner makes an editor the owner and stays on as an editor', async ({ page }) => {
    await openMap(page);
    await pressTool(page, 'Share this map');
    const share = page.getByRole('dialog', { name: `Share “${HOME_MAP}”` });
    await expect(share.getByRole('region', { name: 'People with access' })).toBeVisible();

    // Escape closes the question only
    await share.getByRole('button', { name: 'Make Alex Morgan the owner' }).click();
    const confirm = page.getByRole('dialog', { name: 'Make Alex Morgan the owner?' });
    await expect(confirm.getByRole('checkbox', { name: 'Stay on the map as an editor' })).toBeChecked();
    await page.keyboard.press('Escape');
    await expect(confirm).toBeHidden();
    await expect(share).toBeVisible();

    await share.getByRole('button', { name: 'Make Alex Morgan the owner' }).click();
    await confirm.getByRole('button', { name: 'Make owner' }).click();
    await expect(share).toBeHidden();
    await expect(page).toHaveURL(/\/maps\/map-home$/);

    // The default map went with it, so the test user has a new one of their own; this one
    // is now Alex's, with the test user as its editor
    await expectMapOpen(page, HOME_MAP);
    const switcher = await openSwitcher(page);
    await expect(switcher.getByRole('link', { name: /^My map/ })).toBeVisible();
    await expect(switcher.getByRole('link', { name: /Editor, Alex Morgan’s map/ })).toBeVisible();
  });

  test('the editor cap shows as an error in the share dialog', async ({ page }) => {
    await openMap(page);
    // Alex and nine more editors: ten
    await editStore(page, (db) => {
      for (let i = 0; i < 9; i++) {
        db.mapMembers.push({ mapId: 'map-home', userId: `mock-extra-editor-${i}`, role: 'EDITOR', createdAt: new Date().toISOString() });
      }
    });
    await pressTool(page, 'Share this map');
    const share = page.getByRole('dialog', { name: `Share “${HOME_MAP}”` });
    await share.getByRole('combobox', { name: 'Role for Sam Rivers' }).selectOption('Editor');
    await expect(share.getByRole('alert')).toHaveText('A map can have up to 10 editors.');
    await expect(share.getByRole('combobox', { name: 'Role for Sam Rivers' })).toHaveValue('VIEWER');
  });

  test('deleting the account asks about each map and the photos left on other maps', async ({ page }) => {
    const saved = [];
    page.on('console', (msg) => {
      if (msg.text().startsWith('[mock] leaving plan saved')) saved.push(msg.text());
    });
    await page.goto('/account');
    const card = page.getByRole('region', { name: 'Delete account' });
    const map = card.getByRole('combobox', { name: `“${HOME_MAP}”` });
    // The default is the longest-standing editor, as the server's
    await expect(map).toHaveValue('mock-alex');
    await expect(map.getByRole('option')).toHaveText(['Give to Alex Morgan (editor)', 'Give to Sam Rivers (viewer)', 'Delete it']);
    const photos = card.getByRole('checkbox', { name: 'Leave my photos on maps shared with me' });
    await expect(photos).toBeChecked();

    await map.selectOption({ label: 'Delete it' });
    await photos.uncheck();
    await card.getByLabel('Your password').fill('12345678');
    await card.getByRole('button', { name: 'Delete my account' }).click();
    const confirm = page.getByRole('dialog', { name: 'Delete your account?' });
    await expect(confirm).toContainText(`“${HOME_MAP}” is deleted, with every trip and photo on it.`);
    await expect(confirm).toContainText('Your photos on other people’s maps are deleted.');
    await confirm.getByRole('button', { name: 'Confirm' }).click();

    await expect(page).toHaveURL(/\/$/);
    expect(saved).toEqual(['[mock] leaving plan saved {"maps":[{"mapId":"map-home","action":"DELETE"}],"leavePhotos":false}']);
  });
});
