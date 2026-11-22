import { test, expect, HOME_MAP, HOME_SHARE_CODE, goInApp, mapReady, openMap, pressCountry, pressTool } from './fixtures.js';

// Planned trips on the map (22 Nov 2026, the user's wish): a place a planned trip goes to gets
// its own outline (never a visited one, whose look stays as it is), the map key says so, its
// ticket lists the trip, and "Plan a trip" on a ticket starts one with the place as its first
// stop. Never on a share link.

const outlined = (page, code) => page.locator(`[data-code="${code}"][data-planned]`);
const mapKey = (page) => page.getByRole('list', { name: 'Map key' });

test('a planned trip’s places are outlined, listed on their tickets, and a trip is planned from one', async ({ page }) => {
  await openMap(page);
  // The seed's "Japan in spring" (planned, stops in Japan, which is "want to go")
  await expect(outlined(page, 'JP')).toHaveCount(1);
  await expect(mapKey(page).getByText('Planned trip')).toBeVisible();
  // A visited country keeps its look; one with no trip has no outline
  await expect(outlined(page, 'FR')).toHaveCount(0);
  await expect(outlined(page, 'DE')).toHaveCount(0);

  await pressCountry(page, 'JP');
  const japan = page.getByRole('dialog', { name: 'Japan', exact: true });
  await expect(japan.getByRole('heading', { name: 'Planned trip' })).toBeVisible();
  await expect(japan.getByRole('link', { name: 'Japan in spring' })).toHaveAttribute('href', /\/trips\//);
  await japan.getByRole('button', { name: /^Close/ }).click();

  // Germany: "Plan a trip" opens the form titled for it, and the trip starts there
  await pressCountry(page, 'DE');
  const germany = page.getByRole('dialog', { name: 'Germany', exact: true });
  await expect(germany.getByRole('region', { name: /Planned trip/ })).toHaveCount(0);
  await germany.getByRole('button', { name: 'Plan a trip' }).click();
  const trips = page.getByRole('dialog', { name: 'Trips', exact: true });
  await expect(trips.getByText('A trip to Germany: it starts with Germany as its first stop')).toBeVisible();
  await expect(trips.getByRole('textbox', { name: 'Title' })).toHaveValue('Trip to Germany');
  await trips.getByRole('button', { name: 'Create trip' }).click();

  await expect(page).toHaveURL(/\/trips\/[^/]+$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Trip to Germany' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Stops' }).getByRole('listitem').filter({ hasText: 'Germany' })).toHaveCount(1);

  // Back on the map, Germany is outlined too
  await page.getByRole('link', { name: `Back to ${HOME_MAP}` }).click();
  await mapReady(page);
  await expect(outlined(page, 'DE')).toHaveCount(1);
});

test('a share link shows no planned trips', async ({ page }) => {
  await openMap(page);
  await expect(outlined(page, 'JP')).toHaveCount(1);
  await pressTool(page, 'Share this map');
  const dialog = page.getByRole('dialog', { name: `Share “${HOME_MAP}”` });
  await dialog.getByRole('combobox', { name: 'General access' }).selectOption('Anyone with the link');
  await expect(dialog.getByRole('combobox', { name: 'General access' })).toHaveValue('ANYONE_WITH_LINK');
  await dialog.getByRole('button', { name: 'Done' }).click();

  await goInApp(page, `/shared/${HOME_SHARE_CODE}`);
  await expect(page).toHaveURL(new RegExp(`/shared/${HOME_SHARE_CODE}$`));
  await mapReady(page);
  await expect(page.locator('[data-code="JP"]').first()).toBeAttached();
  await expect(page.locator('[data-planned]')).toHaveCount(0);
  await expect(mapKey(page).getByText('Planned trip')).toHaveCount(0);
});
