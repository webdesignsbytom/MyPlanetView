import { test, expect, HOME_MAP, HOME_SHARE_CODE, MOCK_STORE_KEY, SAM_MAP, SAM_SHARE_CODE, openMap, openTool, statsBadge } from './fixtures.js';
import { COUNTRIES } from '../../src/utils/map/countries.js';
import { LOCAL_NAMES } from '../../src/utils/map/countryLocalNames.js';

// The passport (docs/API.md "Passport"). The seeded stamps (src/dev/mock/seed.js), on the
// test user's map: the Eiffel Tower, Paris's banks of the Seine (two photos: the Eiffel
// Tower's and the Louvre's) and Mont-Saint-Michel; the Colosseum, Florence, Cinque Terre
// and Venice; Gaudí's works; Amsterdam's canals; the Tower of London and Edinburgh; the
// Cliffs of Moher; and Belém, on a hidden photo only. The Alhambra is still a suggestion.
// Pages, first visited first: 1 cover, 2 travellers, 3 Netherlands, 4 Spain, 5 United
// States, 6 France, 7 Ireland, 8 Portugal, 9 United Kingdom, 10 Italy, 11 totals.

const book = (page) => page.getByRole('region', { name: 'Passport book' });
const pageStatus = (page) => page.getByRole('status').filter({ hasText: /^Page \d+ of \d+/ });
const pageList = (page) => page.getByRole('combobox', { name: 'Go to a page' });
const stampButton = (page, name) => page.getByRole('button', { name: `Open the photo of ${name}`, exact: true });
const choosePhoto = (page, name) => page.getByRole('button', { name: `Choose the photo for ${name}`, exact: true });

async function openPassport(page, path = '/maps/map-home/passport') {
  await page.goto(path);
  await expect(pageStatus(page)).toHaveText(/^Page 1 of \d+: Cover$/);
}

test.describe('The passport', () => {
  test('opens from the stats, and its pages turn with the buttons, the arrow keys and the page list', async ({ page }) => {
    await openMap(page);
    await statsBadge(page).click();
    await page.getByRole('dialog', { name: 'Travel statistics' }).getByRole('link', { name: 'Passport: landmark stamps' }).click();
    await expect(page).toHaveURL(/\/maps\/map-home\/passport$/);
    await expect(page.getByRole('heading', { level: 1, name: HOME_MAP })).toBeVisible();
    await expect(pageStatus(page)).toHaveText('Page 1 of 11: Cover');
    await expect(book(page).getByRole('heading', { level: 2, name: 'Passport' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Previous page' })).toBeDisabled();

    // The photo page: each traveller with where they were born and their favourite country
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(book(page).getByRole('heading', { level: 2, name: 'Travellers' })).toBeVisible();
    await expect(book(page).getByRole('listitem')).toHaveText([/Test.*United Kingdom.*Japan/, /Alex.*Ireland.*Italy/]);

    // The arrow keys: the first visa page (the Netherlands, first photographed in 2016) and back
    await page.keyboard.press('ArrowRight');
    await expect(pageStatus(page)).toHaveText('Page 3 of 11: Netherlands');
    await expect(book(page).getByRole('heading', { level: 2, name: 'Netherlands' })).toBeVisible();
    await expect(book(page).getByText('Visited, first on 12 Mar 2016')).toBeVisible();
    await expect(stampButton(page, 'Amsterdam Canal Ring')).toHaveAccessibleDescription(
      'Amsterdam Canal Ring, stamped 12 Mar 2016, UNESCO World Heritage Site, 1 photo.',
    );
    await page.keyboard.press('ArrowLeft');
    await expect(pageStatus(page)).toHaveText('Page 2 of 11: Travellers');

    // Italy, from the page list: four stamps in the order they were stamped, and the rest to collect
    await pageList(page).selectOption({ label: '10. Italy' });
    await expect(book(page).getByRole('heading', { level: 2, name: 'Italy' })).toBeVisible();
    const stamps = book(page).getByRole('region', { name: 'Landmark stamps (4)' });
    const opens = stamps.getByRole('button', { name: /^Open the photo of / });
    await expect(opens).toHaveCount(4);
    const order = ['Venice and its Lagoon', 'Colosseum', 'Historic Centre of Florence', 'Portovenere and Cinque Terre'];
    for (const [i, name] of order.entries()) await expect(opens.nth(i)).toHaveAccessibleName(`Open the photo of ${name}`);
    await expect(stampButton(page, 'Colosseum')).toHaveAccessibleDescription('Colosseum, stamped 3 Jul 2025, 1 photo.');
    const toStamp = book(page).getByRole('region', { name: 'Still to stamp (54)' });
    await expect(toStamp.getByRole('listitem')).toHaveCount(12);
    await toStamp.getByRole('button', { name: 'Show all 54' }).click();
    await expect(toStamp.getByRole('listitem')).toHaveCount(54);
    await expect(toStamp.getByRole('listitem').filter({ hasText: 'Pompeii and Herculaneum' })).toHaveText(
      'Pompeii and Herculaneum (UNESCO World Heritage Site)',
    );

    // A stamp opens its photo; the arrow keys leave the page alone while the photo is open
    await stampButton(page, 'Colosseum').click();
    const viewer = page.getByRole('dialog', { name: 'First morning in Rome' });
    await expect(viewer).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Escape');
    await expect(viewer).toBeHidden();
    await expect(pageStatus(page)).toHaveText('Page 10 of 11: Italy');

    // The back page: the totals (the owner counts the stamp on the hidden photo)
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(book(page).getByRole('heading', { level: 2, name: 'Totals' })).toBeVisible();
    await expect(book(page).getByRole('definition')).toHaveText(['8', '2 of 7', '0 of 5', '13', '10']);
    await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  test('an editor picks the photo a stamp shows, and goes back to the first', async ({ page }) => {
    await openPassport(page);
    await pageList(page).selectOption({ label: '6. France' });
    await expect(book(page).getByRole('heading', { level: 2, name: 'France' })).toBeVisible();
    const seine = stampButton(page, 'Paris, Banks of the Seine');
    await expect(seine.locator('image')).toHaveAttribute('href', /\/eiffel-tower\//);
    // A stamp with one photo has nothing to choose
    await expect(stampButton(page, 'Eiffel Tower')).toBeVisible();
    await expect(choosePhoto(page, 'Eiffel Tower')).toHaveCount(0);

    await choosePhoto(page, 'Paris, Banks of the Seine').click();
    const picker = page.getByRole('dialog', { name: 'Photo for Paris, Banks of the Seine' });
    await expect(picker.getByRole('button', { name: 'Evening by the Seine (on the stamp now)' })).toHaveAttribute('aria-pressed', 'true');
    await picker.getByRole('button', { name: /Richelieu wing/ }).click();
    await expect(picker).toBeHidden();
    await expect(seine.locator('image')).toHaveAttribute('href', /\/louvre\//);
    await expect(seine).toHaveAccessibleDescription(/2 photos, its photo chosen\.$/);

    // Kept: the choice is the map's
    await page.reload();
    await pageList(page).selectOption({ label: '6. France' });
    await expect(stampButton(page, 'Paris, Banks of the Seine').locator('image')).toHaveAttribute('href', /\/louvre\//);

    // Back to the earliest
    await choosePhoto(page, 'Paris, Banks of the Seine').click();
    await expect(picker.getByRole('button', { name: /Richelieu wing \(on the stamp now\)/ })).toHaveAttribute('aria-pressed', 'true');
    await picker.getByRole('button', { name: 'Use the first photo' }).click();
    await expect(picker).toBeHidden();
    await expect(stampButton(page, 'Paris, Banks of the Seine').locator('image')).toHaveAttribute('href', /\/eiffel-tower\//);
    await expect(stampButton(page, 'Paris, Banks of the Seine')).toHaveAccessibleDescription(/2 photos\.$/);
  });

  test('the picker offers a landmark’s photos placed in another country', async ({ page }) => {
    // Amsterdam's canal photo, placed in the Netherlands, matched by hand to the Eiffel Tower
    // (a photo taken across a border would be the same)
    await openPassport(page);
    await page.evaluate((key) => {
      const db = JSON.parse(localStorage.getItem(key));
      const now = new Date().toISOString();
      db.photoLandmarks.push({ photoId: 'photo-dam', mapId: 'map-home', landmarkId: 'lm-eiffel-tower', source: 'MANUAL', distanceM: null, confirmed: true, confirmedAt: now });
      localStorage.setItem(key, JSON.stringify(db));
    }, MOCK_STORE_KEY);
    await page.reload();
    await pageList(page).selectOption({ label: '6. France' });
    await choosePhoto(page, 'Eiffel Tower').click();
    const picker = page.getByRole('dialog', { name: 'Photo for Eiffel Tower' });
    // Oldest first: the Dutch one (2016) is the stamp's now
    await expect(picker.getByRole('button', { name: 'Canals at dusk (on the stamp now)' })).toHaveAttribute('aria-pressed', 'true');
    await expect(picker.getByRole('button', { name: 'Evening by the Seine' })).toBeVisible();
  });

  test('the map marks the stamped landmarks’ pins in gold, and its key says so', async ({ page }) => {
    await openMap(page);
    const key = page.getByRole('list', { name: 'Map key' });
    await expect(key.getByText('Stamped landmark')).toBeVisible();
    // Opening France zooms the map in on it, far enough for the pins
    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('searchbox', { name: 'Search countries' }).fill('france');
    await list.getByRole('button', { name: 'France', exact: true }).click();
    const pins = page.locator('[data-landmark-pins]');
    // Every stamp on the map (the owner sees Belém's hidden one too), whatever the zoom
    await expect(pins).toHaveAttribute('data-stamped-pins', '13');
    await expect(pins.locator('[data-stamped] title').filter({ hasText: 'Eiffel Tower, stamped in the passport' })).toHaveCount(1);
    // The Alhambra is only a suggestion: a plain pin, when it shows
    await expect(pins.locator('[data-stamped] title').filter({ hasText: 'Alhambra' })).toHaveCount(0);
  });

  test('a viewer sees no hidden photo’s stamp and no picker', async ({ page }) => {
    // Make the test user a viewer of the map (Alex owns it here)
    await openPassport(page);
    await page.evaluate((key) => {
      const db = JSON.parse(localStorage.getItem(key));
      db.maps.find((m) => m.id === 'map-home').ownerId = 'mock-alex';
      db.mapMembers = db.mapMembers.filter((m) => !(m.mapId === 'map-home' && m.userId === 'mock-alex'));
      db.mapMembers.push({ mapId: 'map-home', userId: 'mock-user', role: 'VIEWER', createdAt: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(db));
    }, MOCK_STORE_KEY);
    await page.reload();
    await expect(pageStatus(page)).toHaveText('Page 1 of 11: Cover');

    await pageList(page).selectOption({ label: '6. France' });
    await expect(stampButton(page, 'Paris, Banks of the Seine')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Choose the photo for / })).toHaveCount(0);

    // Belém's only photo is hidden: no stamp for a viewer, and it's still to collect
    await pageList(page).selectOption({ label: '8. Portugal' });
    await expect(book(page).getByText('No landmark stamped in Portugal yet.', { exact: false })).toBeVisible();
    const toStamp = book(page).getByRole('region', { name: 'Still to stamp (17)' });
    await toStamp.getByRole('button', { name: 'Show all 17' }).click();
    await expect(toStamp.getByRole('listitem').filter({ hasText: 'Tower of Belém' })).toBeVisible();

    await pageList(page).selectOption({ label: '11. Totals' });
    await expect(book(page).getByRole('definition')).toHaveText(['8', '2 of 7', '0 of 5', '12', '9']);
  });

  test('a share link opens the passport read only; a trip’s link has none', async ({ page }) => {
    // The owner, through their own map's link: still no picker (that's on the map's own address)
    await openPassport(page, `/shared/${HOME_SHARE_CODE}/passport`);
    await expect(page.getByRole('heading', { level: 1, name: HOME_MAP })).toBeVisible();
    await pageList(page).selectOption({ label: '6. France' });
    await expect(stampButton(page, 'Paris, Banks of the Seine')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Choose the photo for / })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Back to the map' })).toHaveAttribute('href', `/shared/${HOME_SHARE_CODE}`);

    // Sam's map, shared with anyone who has the link: its stamp opens through the link
    await openPassport(page, `/shared/${SAM_SHARE_CODE}/passport`);
    await expect(page.getByRole('heading', { level: 1, name: SAM_MAP })).toBeVisible();
    // Australia (lived in since 2001) comes first, then Thailand
    await pageList(page).selectOption({ label: '4. Thailand' });
    await stampButton(page, 'Historic City of Ayutthaya').click();
    await expect(page.getByRole('dialog', { name: 'Temple roofs' })).toBeVisible();
    await page.keyboard.press('Escape');

    // A trip's link
    await page.goto('/shared/TRPT-AK7S-MR42/passport');
    await expect(page.getByRole('alert')).toHaveText(/This link doesn’t work/);
    await expect(page.getByRole('heading', { level: 1, name: 'Passport' })).toBeVisible();
  });

  test('on a phone the pages swipe', { tag: '@phone' }, async ({ page }) => {
    await openPassport(page);
    const swipe = async (dx) => {
      const leaf = book(page).getByRole('region').first();
      const box = await leaf.boundingBox();
      const y = box.y + Math.min(box.height / 2, 200);
      const x = box.x + box.width / 2;
      await leaf.dispatchEvent('pointerdown', { pointerType: 'touch', pointerId: 7, isPrimary: true, clientX: x, clientY: y, bubbles: true });
      await leaf.dispatchEvent('pointerup', { pointerType: 'touch', pointerId: 7, isPrimary: true, clientX: x + dx, clientY: y + 6, bubbles: true });
    };
    await swipe(-160);
    await expect(pageStatus(page)).toHaveText('Page 2 of 11: Travellers');
    await swipe(-160);
    await expect(pageStatus(page)).toHaveText('Page 3 of 11: Netherlands');
    await swipe(160);
    await expect(pageStatus(page)).toHaveText('Page 2 of 11: Travellers');
    // A short or mostly vertical drag is a scroll, not a turn
    await swipe(-30);
    await expect(pageStatus(page)).toHaveText('Page 2 of 11: Travellers');
  });

  test('the cover follows the map owner’s plan: Economy, Business or First Class', async ({ page }) => {
    // The test user's map is on Business; Sam's on Economy; Fran's on First Class
    for (const [path, cover, label] of [
      ['/maps/map-home/passport', 'REGULAR', 'Business Class'],
      ['/maps/map-sam/passport', 'FREE', 'Economy'],
      ['/maps/map-fran/passport', 'PREMIUM', 'First Class'],
    ]) {
      await openPassport(page, path);
      const front = book(page).locator('[data-cover]');
      await expect(front, path).toHaveAttribute('data-cover', cover);
      await expect(front.getByText(label, { exact: true })).toBeVisible();
    }
  });

  test('a visa page gives the country’s own name beside the English one, where it differs', async ({ page }) => {
    await openPassport(page);
    await pageList(page).selectOption({ label: '3. Netherlands' });
    await expect(book(page).getByRole('heading', { level: 2, name: 'Netherlands' })).toBeVisible();
    const own = book(page).locator('bdi[lang="nl"]');
    await expect(own).toHaveText('Nederland');
    // Portugal calls itself Portugal: nothing beside it
    await pageList(page).selectOption({ label: '8. Portugal' });
    await expect(book(page).getByRole('heading', { level: 2, name: 'Portugal' })).toBeVisible();
    await expect(book(page).locator('bdi[lang]')).toHaveCount(0);
  });

  test('every country has its own name, each in a valid language', () => {
    for (const country of COUNTRIES.filter((c) => c.kind !== 'SPECIAL')) {
      const names = LOCAL_NAMES[country.code];
      expect(names?.length, country.code).toBeGreaterThan(0);
      for (const [lang, name] of names) {
        expect(Intl.getCanonicalLocales(lang), `${country.code} ${lang}`).toEqual([lang]);
        expect(name.trim(), `${country.code} ${lang}`).not.toBe('');
      }
    }
    for (const place of COUNTRIES.filter((c) => c.kind === 'SPECIAL')) expect(LOCAL_NAMES[place.code], place.code).toBeUndefined();
  });

  test('a double-click opens the cover and turns the pages, and the book’s words can’t be selected', async ({ page }) => {
    await openPassport(page);
    const front = book(page).locator('[data-cover]');
    await front.dblclick();
    await expect(pageStatus(page)).toHaveText('Page 2 of 11: Travellers');
    // The double-click highlighted nothing
    expect(await page.evaluate(() => window.getSelection().toString())).toBe('');

    // The open book is a spread on this screen: a double-click on the right-hand page turns
    // on, one on the left-hand page turns back (both away from the pages' controls)
    const doubleClickAt = async (share) => {
      const box = await book(page).getByRole('region').first().boundingBox();
      await page.mouse.dblclick(box.x + box.width * share, box.y + box.height * 0.8);
    };
    await doubleClickAt(0.75);
    await expect(pageStatus(page)).toHaveText('Page 3 of 11: Netherlands');
    await doubleClickAt(0.25);
    await expect(pageStatus(page)).toHaveText('Page 2 of 11: Travellers');
    expect(await page.evaluate(() => window.getSelection().toString())).toBe('');
  });

  test('a stamp’s landmark shows the moments that happened there, and so does its card on the map', async ({ page }) => {
    await openPassport(page);
    await pageList(page).selectOption({ label: '6. France' });
    await expect(book(page).getByRole('heading', { level: 2, name: 'France' })).toBeVisible();
    await expect(book(page).getByText('Moments here')).toBeVisible();
    await expect(book(page).getByRole('listitem').filter({ hasText: 'Got engaged at the Eiffel Tower' })).toHaveText(
      'Eiffel Tower: Got engaged at the Eiffel Tower, 12 Apr 2019',
    );

    // The country ticket's landmarks put the Eiffel Tower first, with its moment
    await openMap(page);
    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('searchbox', { name: 'Search countries' }).fill('france');
    await list.getByRole('button', { name: 'France', exact: true }).click();
    const france = page.getByRole('dialog', { name: 'France' });
    const moments = france.getByRole('list', { name: 'Moments at Eiffel Tower' });
    await expect(moments).toContainText('Got engaged at the Eiffel Tower, 12 Apr 2019');
  });
});
