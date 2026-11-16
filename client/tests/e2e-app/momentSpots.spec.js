import { test, expect, HOME_SHARE_CODE, MOCK_STORE_KEY, goInApp, openMap, openTool, signOut } from './fixtures.js';

// A moment's pin on the map (docs/API.md "Moments", "A pin on the map"). Seeded
// (src/dev/mock/seed.js): on the test user's map, the birth in Manchester, pinned but not
// shared (a home), and the engagement at the Eiffel Tower, pinned and shared; the flamenco
// in Granada isn't pinned, but its photo knows where it was taken. On Sam's map, Angkor
// Wat at sunrise, pinned and shared.

/** Open a country's ticket from the country list. */
async function openCountry(page, name) {
  const list = await openTool(page, 'Country list', 'Countries');
  await list.getByRole('searchbox', { name: 'Search countries' }).fill(name.slice(0, 5).toLowerCase());
  await list.getByRole('button', { name, exact: true }).click();
  const panel = page.getByRole('dialog', { name });
  await expect(panel).toBeVisible();
  return panel;
}

const momentsIn = (scope) => scope.getByRole('region', { name: 'Moments' });
const pins = (page) => page.locator('[data-moment-spot]');
const mapsLink = (scope) => scope.getByRole('link', { name: /^See the spot on Google Maps/ });

test.describe('A moment’s spot', () => {
  test('the owner sees every pin; a share link only the shared ones', async ({ page }) => {
    await openMap(page);
    await expect(pins(page)).toHaveCount(2);
    const france = await openCountry(page, 'France');
    const engaged = momentsIn(france).getByRole('article', { name: 'Got engaged at the Eiffel Tower' });
    await expect(mapsLink(engaged)).toHaveAttribute('href', 'https://www.google.com/maps/search/?api=1&query=48.858400%2C2.294500');
    await expect(engaged).toContainText('Everyone the map is shared with sees this spot');
    const uk = await openCountry(page, 'United Kingdom');
    await expect(momentsIn(uk).getByRole('article', { name: 'Charlie was born' })).toContainText('Only you and the map’s editors see this spot');

    // Signed out, through the map's link (turned on here): the engagement's pin, and no
    // word on who sees it
    await page.evaluate((key) => {
      const db = JSON.parse(localStorage.getItem(key));
      db.maps.find((m) => m.id === 'map-home').linkAccess = 'ANYONE_WITH_LINK';
      localStorage.setItem(key, JSON.stringify(db));
    }, MOCK_STORE_KEY);
    await signOut(page);
    await goInApp(page, `/shared/${HOME_SHARE_CODE}`);
    await expect(page.locator('[data-moment-spot]')).toHaveCount(1);
    await expect(page.locator('[data-moment-spot] title')).toHaveText('Got engaged at the Eiffel Tower');
    const sharedFrance = await openCountry(page, 'France');
    const sharedEngaged = momentsIn(sharedFrance).getByRole('article', { name: 'Got engaged at the Eiffel Tower' });
    await expect(mapsLink(sharedEngaged)).toBeVisible();
    await expect(sharedEngaged).not.toContainText('sees this spot');
    const sharedUk = await openCountry(page, 'United Kingdom');
    await expect(mapsLink(momentsIn(sharedUk).getByRole('article', { name: 'Charlie was born' }))).toHaveCount(0);
  });

  test('an editor pins a new moment by tapping the map, shares the spot, then takes the pin off', async ({ page }) => {
    await openMap(page);
    const germany = await openCountry(page, 'Germany');
    const moments = momentsIn(germany);
    await moments.getByRole('button', { name: 'Add a moment' }).click();
    const form = moments.getByRole('region', { name: 'Add a moment' });
    await form.getByRole('textbox', { name: 'Title' }).fill('Picnic by the Spree');
    const pin = form.getByRole('group', { name: 'Pin it on the map' });
    await expect(pin.getByRole('button', { name: 'Use a photo’s location' })).toBeDisabled();
    await pin.getByRole('button', { name: 'Tap the map' }).click();

    // The map opens on Germany: a tap in the middle of it puts the pin there
    const picker = page.getByRole('dialog', { name: 'Pin it in Germany' });
    await expect(picker.getByRole('status')).toHaveText('No pin yet.');
    await expect(picker.getByRole('button', { name: 'Use this spot' })).toBeDisabled();
    const box = await picker.locator('[data-map-style]').boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(picker.getByRole('status')).toHaveText(/^The pin is at \d+\.\d{5}° N, \d+\.\d{5}° E\.$/);
    await expect(picker.locator('[data-moment-spot="draft"]')).toBeAttached();
    await picker.getByRole('button', { name: 'Use this spot' }).click();
    await expect(picker).toBeHidden();

    await expect(pin).toContainText('Pinned at');
    const share = pin.getByRole('checkbox', { name: 'Show the exact spot to everyone the map is shared with' });
    await expect(share).not.toBeChecked();
    await share.check();
    await form.getByRole('button', { name: 'Add moment' }).click();
    const card = moments.getByRole('article', { name: 'Picnic by the Spree' });
    await expect(card).toContainText('Everyone the map is shared with sees this spot');
    await expect(mapsLink(card)).toHaveAttribute('href', /query=5\d\.\d{6}%2C\d+\.\d{6}$/);
    await expect(pins(page)).toHaveCount(3);

    // Taken off again
    await card.getByRole('button', { name: 'Edit Picnic by the Spree' }).click();
    const edit = moments.getByRole('region', { name: 'Edit Picnic by the Spree' });
    await edit.getByRole('button', { name: 'Take the pin off' }).click();
    await expect(edit.getByText('Optional: put the moment on its exact spot.')).toBeVisible();
    await edit.getByRole('button', { name: 'Save moment' }).click();
    await expect(mapsLink(moments.getByRole('article', { name: 'Picnic by the Spree' }))).toHaveCount(0);
    await expect(pins(page)).toHaveCount(2);
  });

  test('a pin comes from a photo that knows where it was taken, or from the device', async ({ page, context }) => {
    await openMap(page);
    const spain = await openCountry(page, 'Spain');
    const moments = momentsIn(spain);
    const flamenco = moments.getByRole('article', { name: 'Saw flamenco in Granada' });
    await flamenco.getByRole('button', { name: 'Edit Saw flamenco in Granada' }).click();
    const edit = moments.getByRole('region', { name: 'Edit Saw flamenco in Granada' });
    await edit.getByRole('group', { name: 'Pin it on the map' }).getByRole('button', { name: 'Use a photo’s location' }).click();
    await expect(edit.getByText('Pinned at 37.17620° N, 3.58820° W')).toBeVisible();
    await edit.getByRole('button', { name: 'Save moment' }).click();
    await expect(mapsLink(moments.getByRole('article', { name: 'Saw flamenco in Granada' }))).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=37.176200%2C-3.588200',
    );
    await expect(pins(page)).toHaveCount(3);

    // Where the device is, once it's allowed to say
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 37.3891, longitude: -5.9845 });
    await moments.getByRole('button', { name: 'Add a moment' }).click();
    const form = moments.getByRole('region', { name: 'Add a moment' });
    await form.getByRole('textbox', { name: 'Title' }).fill('Orange trees in Seville');
    await form.getByRole('group', { name: 'Pin it on the map' }).getByRole('button', { name: 'Use where I am now' }).click();
    await expect(form.getByText('Pinned at 37.38910° N, 5.98450° W')).toBeVisible();
    await form.getByRole('button', { name: 'Add moment' }).click();
    const seville = moments.getByRole('article', { name: 'Orange trees in Seville' });
    // Not shared unless ticked
    await expect(seville).toContainText('Only you and the map’s editors see this spot');
    await expect(pins(page)).toHaveCount(4);
  });

  test('a spot outside the moment’s country is refused', async ({ page, context }) => {
    // The device is in Paris; the moment is in Spain
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 48.8566, longitude: 2.3522 });
    await openMap(page);
    const spain = await openCountry(page, 'Spain');
    const moments = momentsIn(spain);
    await moments.getByRole('button', { name: 'Add a moment' }).click();
    const form = moments.getByRole('region', { name: 'Add a moment' });
    await form.getByRole('textbox', { name: 'Title' }).fill('Not really in Spain');
    await form.getByRole('group', { name: 'Pin it on the map' }).getByRole('button', { name: 'Use where I am now' }).click();
    await form.getByRole('button', { name: 'Add moment' }).click();
    await expect(form.getByText("That spot isn't in the moment's country. Move the pin, or take it off.")).toBeVisible();
  });
});
