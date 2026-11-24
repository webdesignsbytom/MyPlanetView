import { test, expect, HOME_MAP, REGION_COUNT, expectStats, openMap, openStats, openTool } from './fixtures.js';

const stopsCard = (page) => page.getByRole('region', { name: 'Stops' });
const stopItems = (page) => stopsCard(page).getByRole('listitem');

async function addStop(page, country, place) {
  const form = stopsCard(page).getByRole('region', { name: 'Add a stop' });
  await form.getByRole('combobox', { name: 'Country', exact: true }).selectOption({ label: country });
  await form.getByRole('textbox', { name: 'Town or place' }).fill(place);
  await form.getByRole('button', { name: 'Add stop' }).click();
  await expect(stopItems(page).filter({ hasText: place })).toBeVisible();
  // The form empties for the next one
  await expect(form.getByRole('textbox', { name: 'Town or place' })).toHaveValue('');
}

test.describe('Trips', () => {
  test('a trip is planned, its stops added and reordered, and completing it marks its countries visited', { tag: '@phone' }, async ({ page }) => {
    await openMap(page);
    const trips = await openTool(page, 'Trips', 'Trips');
    await expect(trips.getByRole('link', { name: /Italian summer/ })).toBeVisible();
    await trips.getByRole('button', { name: 'Plan a new trip' }).click();
    await trips.getByRole('textbox', { name: 'Title' }).fill('Nordic loop');
    await expect(trips.getByRole('combobox', { name: 'Status' })).toHaveValue('PLANNED');
    // Both travellers go by default
    await expect(trips.getByRole('button', { name: 'Charlie', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(trips.getByRole('button', { name: 'Alex', exact: true })).toHaveAttribute('aria-pressed', 'true');
    // Every trip has its days (23 Nov 2026): without them the form says so
    await trips.getByRole('button', { name: 'Create trip' }).click();
    await expect(trips.getByRole('alert')).toHaveText('Give the trip the day it starts and the day it ends.');
    await trips.getByLabel(/^From/).fill('2027-06-01');
    await trips.getByLabel(/^To\b/).fill('2027-06-12');
    await trips.getByRole('button', { name: 'Create trip' }).click();

    // The trip's own page
    await expect(page).toHaveURL(/\/trips\/[^/]+$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Nordic loop' })).toBeVisible();
    await expect(page.getByRole('link', { name: `Back to ${HOME_MAP}` })).toBeVisible();
    await expect(stopsCard(page).getByText('No stops yet.')).toBeVisible();

    await addStop(page, 'Norway', 'Oslo');
    await addStop(page, 'Sweden', 'Stockholm');
    await addStop(page, 'Finland', 'Helsinki');
    await expect(stopItems(page)).toHaveText([/Stop 1: Norway — Oslo/, /Stop 2: Sweden — Stockholm/, /Stop 3: Finland — Helsinki/]);
    await expect(page.getByRole('img', { name: 'Route map: Norway, then Sweden, then Finland' })).toBeVisible();

    // Reordered with the move stamps (the first can't go up, the last can't go down)
    await expect(stopsCard(page).getByRole('button', { name: 'Move stop 1, Norway up' })).toBeDisabled();
    await expect(stopsCard(page).getByRole('button', { name: 'Move stop 3, Finland down' })).toBeDisabled();
    await stopsCard(page).getByRole('button', { name: 'Move stop 3, Finland up' }).click();
    await expect(stopItems(page)).toHaveText([/Norway/, /Finland/, /Sweden/]);
    await stopsCard(page).getByRole('button', { name: 'Move stop 1, Norway down' }).click();
    await expect(stopItems(page)).toHaveText([/Stop 1: Finland/, /Stop 2: Norway/, /Stop 3: Sweden/]);
    await expect(page.getByRole('img', { name: 'Route map: Finland, then Norway, then Sweden' })).toBeVisible();

    // Removed: Sweden
    await stopsCard(page).getByRole('button', { name: 'Remove stop 3, Sweden' }).click();
    await expect(stopItems(page)).toHaveText([/Finland — Helsinki/, /Norway — Oslo/]);

    // Edited: a stop's place
    await stopsCard(page).getByRole('button', { name: 'Edit stop 2, Norway' }).click();
    const editStop = stopsCard(page).getByRole('region', { name: 'Edit stop 2' });
    await editStop.getByRole('textbox', { name: 'Town or place' }).fill('Bergen');
    await editStop.getByRole('button', { name: 'Save stop' }).click();
    await expect(stopItems(page).nth(1)).toHaveText(/Norway — Bergen/);

    // Completed
    await page.getByRole('button', { name: 'Edit trip' }).click();
    const edit = page.getByRole('region', { name: 'Edit trip' });
    await edit.getByRole('combobox', { name: 'Status' }).selectOption('Done');
    await edit.getByRole('button', { name: 'Save trip' }).click();
    await expect(edit).toBeHidden();
    // The status beside the trip's days
    await expect(page.getByText('Done · 1 Jun 2027 – 12 Jun 2027', { exact: true })).toBeVisible();

    // Back on the map: Finland and Norway are visited, Sweden isn't
    await page.getByRole('link', { name: `Back to ${HOME_MAP}` }).click();
    await expectStats(page, '10 countries, 2 continents, 16 photos');
    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('combobox', { name: 'Show' }).selectOption('Visited');
    await expect(list.getByRole('button', { name: 'Status for Finland: Visited' })).toBeVisible();
    await expect(list.getByRole('button', { name: 'Status for Norway: Visited' })).toBeVisible();
    await expect(list.getByRole('button', { name: 'Status for Sweden: Visited' })).toHaveCount(0);

    const tripsAfter = await openTool(page, 'Trips', 'Trips');
    await expect(tripsAfter.getByRole('link', { name: /Nordic loop/ })).toContainText('Done · 1 Jun 2027 – 12 Jun 2027 · 2 stops · 0 photos');
  });

  test('a trip’s page shows its stops, travellers and photos', async ({ page }) => {
    await page.goto('/trips/trip-italy');
    await expect(page.getByRole('heading', { level: 1, name: 'Italian summer' })).toBeVisible();
    await expect(page.getByText('Rome to Florence by train, with a few days by the sea.')).toBeVisible();
    await expect(stopItems(page)).toHaveText([/Italy — Colosseum, Rome/, /Italy — Florence/, /Italy — Cinque Terre/]);

    // Who went: a toggle per traveller, saved
    const alex = page.getByRole('group', { name: 'Who’s going' }).getByRole('button', { name: 'Alex', exact: true });
    await expect(alex).toHaveAttribute('aria-pressed', 'true');
    await alex.click();
    await expect(alex).toHaveAttribute('aria-pressed', 'false');
    await page.reload();
    await expect(page.getByRole('group', { name: 'Who’s going' }).getByRole('button', { name: 'Alex', exact: true })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    // Its photo opens in the viewer; Escape closes it and focus goes back
    const photos = page.getByRole('region', { name: 'Photos' });
    const thumb = photos.getByRole('button', { name: 'Open First morning in Rome' });
    await thumb.click();
    const viewer = page.getByRole('dialog', { name: 'First morning in Rome' });
    await expect(viewer.getByText('Italy', { exact: true })).toBeVisible();
    await expect(viewer.getByText('Colosseum', { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(viewer).toBeHidden();
    await expect(thumb).toBeFocused();
  });

  test('from the keyboard, focus follows a moved stop and lands on a neighbour after a removal', async ({ page }) => {
    await page.goto('/trips/trip-japan');
    await expect(stopItems(page)).toHaveText([/Japan — Tokyo/, /Japan — .*Fuji/, /Japan — Kyoto/]);

    await stopsCard(page).getByRole('button', { name: 'Move stop 1, Japan down' }).focus();
    await page.keyboard.press('Enter');
    await expect(stopItems(page)).toHaveText([/Fuji/, /Tokyo/, /Kyoto/]);
    await expect(stopsCard(page).getByRole('button', { name: 'Move stop 2, Japan down' })).toBeFocused();

    // At the bottom its down stamp is disabled, so focus takes its up stamp
    await page.keyboard.press('Enter');
    await expect(stopItems(page)).toHaveText([/Fuji/, /Kyoto/, /Tokyo/]);
    await expect(stopsCard(page).getByRole('button', { name: 'Move stop 3, Japan up' })).toBeFocused();

    // Removing the middle stop puts focus on the next one's Edit button
    await stopsCard(page).getByRole('button', { name: 'Remove stop 2, Japan' }).focus();
    await page.keyboard.press('Enter');
    await expect(stopItems(page)).toHaveText([/Fuji/, /Tokyo/]);
    await expect(stopsCard(page).getByRole('button', { name: 'Edit stop 2, Japan' })).toBeFocused();
  });

  test('someone added to a trip alone edits it but can’t delete it or open its map', async ({ page }) => {
    // The test user is an editor of Jo's Lisbon trip, with no role on Jo's map
    await page.goto('/trips/trip-jo-lisbon');
    await expect(page.getByRole('heading', { level: 1, name: 'Lisbon weekend' })).toBeVisible();
    await expect(page.getByText(/You can edit$/)).toBeVisible();
    await expect(page.getByRole('link', { name: /^Back to/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Edit trip' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete trip' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Add a stop' }).click();
    await addStop(page, 'Portugal', 'Sintra');
    await expect(stopItems(page)).toHaveText([/Portugal — Tower of Belém, Lisbon/, /Portugal — Sintra/]);
  });

  test('deleting a trip asks first, then goes back to its map', async ({ page }) => {
    await page.goto('/trips/trip-japan');
    await expect(page.getByRole('heading', { level: 1, name: 'Japan in spring' })).toBeVisible();

    await page.getByRole('button', { name: 'Delete trip' }).click();
    const confirm = page.getByRole('group', { name: 'Delete this trip' });
    await confirm.getByRole('button', { name: 'Keep it' }).click();
    await expect(confirm).toBeHidden();

    await page.getByRole('button', { name: 'Delete trip' }).click();
    await confirm.getByRole('button', { name: 'Yes, delete the trip' }).click();
    await expect(page).toHaveURL(/\/maps\/map-home$/);

    const trips = await openTool(page, 'Trips', 'Trips');
    await expect(trips.getByRole('link', { name: /Italian summer/ })).toBeVisible();
    await expect(trips.getByRole('link', { name: /Japan in spring/ })).toHaveCount(0);
    await openStats(page);
    // Countries, continents, special places, photos, landmarks, trips
    await expect(page.getByRole('dialog', { name: 'Travel statistics' }).getByRole('definition')).toHaveText([
      '8',
      '3.5%',
      '8 of 226 countries',
      '2 of 7',
      '0 of 5',
      `0 of ${REGION_COUNT}`,
      '16',
      '13 of 1,366',
      '10 of 1,273',
      '2',
      // The longest trip, "Italian summer" (23 Nov 2026)
      '15', 'On completed trips', '15 days', 'Italian summer', '27,300 km', 'About 17,000 miles', 'United States', 'About 7,000 km from the United Kingdom',
    ]);

    // The old address now says so
    await page.goto('/trips/trip-japan');
    await expect(page.getByRole('heading', { level: 1, name: 'Trip not found' })).toBeVisible();
  });
});
