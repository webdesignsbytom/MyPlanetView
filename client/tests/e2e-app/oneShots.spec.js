import { test, expect, MOCK_STORE_KEY, mapReady, openMap, openTool } from './fixtures.js';

// Life's One Shots (24 Nov 2026, the user's wish and name; docs/API.md "Life's One Shots"):
// wildlife seen, nature's wonders (volcanoes too) and great journeys, ticked on the map. The
// seed has two on the test user's map: a puffin off Ireland (June 2013) and New England's
// autumn colours (October 2014).

const oneShots = (page) => openTool(page, 'Life’s One Shots', 'Life’s One Shots');
const card = (panel, key) => panel.locator(`[data-one-shot="${key}"]`);

async function openCountry(page, name) {
  const list = await openTool(page, 'Country list', 'Countries');
  await list.getByRole('button', { name, exact: true }).click();
  return page.getByRole('dialog', { name });
}

test('an item is ticked with when, where and who, and shows on its country’s ticket', { tag: '@phone' }, async ({ page }) => {
  await openMap(page);
  const panel = await oneShots(page);
  await expect(panel.getByRole('tab', { name: /Wildlife/ })).toHaveAttribute('aria-selected', 'true');
  await expect(card(panel, 'puffin')).toContainText('Seen: June 2013, in Ireland');
  // The demo couple's safari (data/demoTravels.js)
  await expect(card(panel, 'lion')).toContainText('Seen: 15 Oct 2023, in Tanzania');
  await expect(card(panel, 'leopard')).toContainText('Not yet');

  // Nature's wonders: a volcano erupting, in Italy
  await panel.getByRole('tab', { name: /Nature’s wonders/ }).click();
  await expect(panel.getByRole('heading', { name: 'Volcanoes' })).toBeVisible();
  await expect(panel.locator('[data-one-shot-progress="WONDERS"]')).toHaveText('0 of 32');
  await card(panel, 'erupting-volcano').getByRole('button').click();
  const dialog = page.getByRole('dialog', { name: 'A volcano erupting' });
  await expect(dialog).toContainText('Nature’s wonders · Volcanoes');
  await dialog.getByRole('combobox', { name: 'Where' }).selectOption('IT');
  await dialog.getByRole('button', { name: 'Charlie', exact: true }).click();
  await dialog.getByRole('button', { name: 'Tick it' }).click();
  await expect(dialog).toBeHidden();
  await expect(card(panel, 'erupting-volcano')).toContainText('Seen: In Italy');
  await expect(panel.locator('[data-one-shot-progress="WONDERS"]')).toHaveText('1 of 32');
  await panel.getByRole('button', { name: /^Close/ }).first().click();

  // Italy's ticket says so, and opens it in the panel
  const italy = await openCountry(page, 'Italy');
  const seen = italy.getByRole('list', { name: 'Seen or done in Italy' });
  await expect(seen).toContainText('A volcano erupting');
  await seen.getByRole('button', { name: 'A volcano erupting' }).click();
  await expect(page.getByRole('dialog', { name: 'A volcano erupting' })).toContainText('Seen: In Italy');
});

test('a tick is changed, and taken off', async ({ page }) => {
  await openMap(page);
  const panel = await oneShots(page);
  await card(panel, 'puffin').getByRole('button').click();
  const dialog = page.getByRole('dialog', { name: 'Atlantic puffin' });
  await expect(dialog.getByRole('textbox', { name: 'A note' })).toHaveValue('On the Skelligs');
  await dialog.getByRole('textbox', { name: 'A note' }).fill('On Skellig Michael, at dawn');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(dialog).toBeHidden();

  await card(panel, 'puffin').getByRole('button').click();
  await expect(dialog).toContainText('On Skellig Michael, at dawn');
  await dialog.getByRole('button', { name: 'Take it off' }).click();
  await expect(dialog).toBeHidden();
  await expect(card(panel, 'puffin')).toContainText('Not yet');
  // The safari's four are still ticked
  await expect(panel.locator('[data-one-shot-progress="WILDLIFE"]')).toHaveText('4 of 80');
});

test('a flight across the equator offers to tick it, with the flight’s day', async ({ page }) => {
  await openMap(page);
  // A flight from London to Nairobi in the flight log
  await page.evaluate((key) => {
    const db = JSON.parse(localStorage.getItem(key));
    db.flights.push({ id: 'flight-nairobi', mapId: 'map-home', tripId: null, from: 'LHR', to: 'NBO', flownOn: '2019-03-02', carrier: 'BA', flightNumber: '65', distanceKm: 6820, source: 'MANUAL', createdAt: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(db));
  }, MOCK_STORE_KEY);
  await page.reload();
  await mapReady(page);

  const panel = await oneShots(page);
  const suggested = panel.locator('[data-one-shot-suggestions]');
  await expect(suggested).toContainText('Across the equator');
  await expect(suggested).toContainText('Your flight from LHR to NBO, 2 Mar 2019');
  await suggested.getByRole('button', { name: 'Tick Across the equator' }).click();
  const dialog = page.getByRole('dialog', { name: 'Across the equator' });
  await dialog.getByRole('button', { name: 'Tick it' }).click();
  await expect(dialog).toBeHidden();
  // The seed's world trip still offers the date line
  await expect(suggested).not.toContainText('Across the equator');
  await panel.getByRole('tab', { name: /Journeys and feats/ }).click();
  await expect(card(panel, 'equator')).toContainText('Done: 2 Mar 2019');
});

test.describe('with the celebration on', () => {
  test.use({ celebrations: true });

  test('a first tick is celebrated with its photo and how far along its list is', async ({ page }) => {
    await openMap(page);
    const panel = await oneShots(page);
    // The lion is ticked already (the seed's safari)
    await card(panel, 'leopard').getByRole('button').click();
    await page.getByRole('dialog', { name: 'Leopard' }).getByRole('button', { name: 'Tick it' }).click();
    const party = page.getByRole('dialog', { name: 'Leopard' }).and(page.locator('[data-celebration]'));
    await expect(party).toBeVisible();
    await expect(party.getByText('Seen it!')).toBeVisible();
    await expect(party).toHaveAccessibleDescription('Ticked in Life’s One Shots.');
    await expect(party.locator('[data-celebration-progress]')).toHaveText('6 of 80 animals ticked.');
    // Nothing of the passport's (24 Nov 2026, the user: not yet)
    await expect(party.getByRole('link', { name: 'Open passport' })).toHaveCount(0);
    await party.getByRole('button', { name: 'Carry on' }).click();
    await expect(party).toBeHidden();
  });
});
