import { test, expect, HOME_MAP, HOME_SHARE_CODE, MOCK_STORE_KEY, SAM_MAP, SAM_SHARE_CODE, goInApp, openMap, openStats, openTool, signOut } from './fixtures.js';
import { COUNTRIES } from '../../src/utils/map/countries.js';
import { LOCAL_NAMES } from '../../src/utils/map/countryLocalNames.js';

// The passport (docs/API.md "Passport"). The seeded stamps (src/dev/mock/seed.js), on the
// test user's map: the Eiffel Tower, Paris's banks of the Seine (two photos: the Eiffel
// Tower's and the Louvre's) and Mont-Saint-Michel; the Colosseum, Florence, Cinque Terre
// and Venice; Gaudí's works; Amsterdam's canals; the Tower of London and Edinburgh; the
// Cliffs of Moher; and Belém, on a hidden photo only. The Alhambra is still a suggestion.
// Pages, in the order visited (24 Nov 2026, the user's wish: each page dated by the earlier of
// its first visit and its first photo): 1 cover, 2 travellers, 3 United Kingdom (lived in since
// 1990), 4 Ireland, 5 United States, 6 Netherlands, 7 Spain, 8 France, 9 Portugal, 10 Italy,
// 11 totals.

const book = (page) => page.getByRole('region', { name: 'Passport book' });
const pageStatus = (page) => page.getByRole('status').filter({ hasText: /^Page \d+ of \d+/ });
const pageList = (page) => page.getByRole('combobox', { name: 'Go to a page' });
const stampButton = (page, name) => page.getByRole('button', { name: `Open the photo of ${name}`, exact: true });

async function openPassport(page, path = '/maps/map-home/passport') {
  await page.goto(path);
  await expect(pageStatus(page)).toHaveText(/^Page 1 of \d+: Cover$/);
}

test.describe('The passport', () => {
  test('opens from the stats, and its pages turn with the buttons, the arrow keys and the page list', async ({ page }) => {
    await openMap(page);
    await openStats(page);
    await page.getByRole('dialog', { name: 'Travel statistics' }).getByRole('link', { name: 'Passport: landmark stamps' }).click();
    await expect(page).toHaveURL(/\/maps\/map-home\/passport$/);
    await expect(page.getByRole('heading', { level: 1, name: HOME_MAP })).toBeVisible();
    await expect(pageStatus(page)).toHaveText('Page 1 of 23: Cover');
    await expect(book(page).getByRole('heading', { level: 2, name: 'Passport' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Previous page' })).toBeDisabled();

    // The photo page: each traveller with where they were born and their favourite country
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(book(page).getByRole('heading', { level: 2, name: 'Travellers' })).toBeVisible();
    await expect(book(page).getByRole('listitem')).toHaveText([/Charlie.*United Kingdom.*Japan/, /Alex.*Ireland.*Italy/]);
    // Each photo box as tall as the details beside it, down to their last line (24 Nov 2026)
    for (const card of await book(page).getByRole('listitem').all()) {
      const [photo, details] = [await card.locator('[data-passport-photo]').boundingBox(), await card.locator('[data-beside-photo]').boundingBox()];
      expect(Math.abs(photo.y - details.y)).toBeLessThan(1);
      expect(Math.abs(photo.y + photo.height - (details.y + details.height))).toBeLessThan(1);
    }

    // The arrow keys: the first visa page (the United Kingdom, lived in since 1990) and back
    await page.keyboard.press('ArrowRight');
    await expect(pageStatus(page)).toHaveText('Page 3 of 23: United Kingdom');
    await expect(book(page).getByRole('heading', { level: 2, name: 'United Kingdom' })).toBeVisible();
    await expect(book(page).getByText('Lived there, from 14 Jan 1990')).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(pageStatus(page)).toHaveText('Page 2 of 23: Travellers');

    // The Netherlands: first visited the day before its first photo, which dates its stamp
    await pageList(page).selectOption({ label: '6. Netherlands' });
    await expect(book(page).getByText('Visited, first on 11 Mar 2016')).toBeVisible();
    await expect(stampButton(page, 'Amsterdam Canal Ring')).toHaveAccessibleDescription(
      'Amsterdam Canal Ring, stamped 12 Mar 2016, UNESCO World Heritage Site, 1 photo.',
    );

    // Italy, from the page list: four stamps in the order they were stamped (Venice on the
    // Carnival trip, 2026), and the rest to collect
    await pageList(page).selectOption({ label: '21. Italy' });
    await expect(book(page).getByRole('heading', { level: 2, name: 'Italy' })).toBeVisible();
    const stamps = book(page).getByRole('region', { name: 'Landmark stamps (4)' });
    const opens = stamps.getByRole('button', { name: /^Open the photo of / });
    await expect(opens).toHaveCount(4);
    const order = ['Colosseum', 'Historic Centre of Florence', 'Portovenere and Cinque Terre', 'Venice and its Lagoon'];
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
    await expect(pageStatus(page)).toHaveText('Page 21 of 23: Italy');

    // Austria (Alex's conference, March 2026), then the back page: the totals (the owner counts
    // the stamp on the hidden photo)
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(book(page).getByRole('heading', { level: 2, name: 'Austria' })).toBeVisible();
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(book(page).getByRole('heading', { level: 2, name: 'Totals' })).toBeVisible();
    // 20 places, 25 stamps (13 from photos, 12 heritage sites ticked), 22 of them World Heritage Sites
    await expect(book(page).getByRole('definition')).toHaveText(['20', '5 of 7', '0 of 5', '25', '22']);
    await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  // 24 Nov 2026, the user's wish: nobody picks a stamp's photo in the passport
  test('a stamp shows its earliest photo, with nothing to choose', async ({ page }) => {
    await openPassport(page);
    await pageList(page).selectOption({ label: '8. France' });
    await expect(book(page).getByRole('heading', { level: 2, name: 'France' })).toBeVisible();
    const seine = stampButton(page, 'Paris, Banks of the Seine');
    await expect(seine.locator('image')).toHaveAttribute('href', /\/eiffel-tower\//);
    await expect(seine).toHaveAccessibleDescription(/2 photos\.$/);
    await expect(page.getByRole('button', { name: /^Choose the photo for / })).toHaveCount(0);
    await expect(page.getByText('Choose photo', { exact: true })).toHaveCount(0);
  });

  test('the map marks the stamped landmarks’ pins in gold, and its key says so', async ({ page }) => {
    await openMap(page);
    const key = page.getByRole('list', { name: 'Map key' });
    await expect(key.getByText('Stamped landmark')).toBeVisible();
    // Opening France zooms the map in on it; once more brings the pins (the zoom is a screen
    // scale: the test's 1280-pixel screen shows France smaller than a 1920 one does)
    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('searchbox', { name: 'Search countries' }).fill('france');
    await list.getByRole('button', { name: 'France', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'France' })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('group', { name: 'Zoom' }).getByRole('button', { name: 'Zoom in' }).click();
    const pins = page.locator('[data-landmark-pins]');
    // Every stamp on the map (the owner sees Belém's hidden one too), whatever the zoom
    await expect(pins).toHaveAttribute('data-stamped-pins', '25');
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
    await expect(pageStatus(page)).toHaveText('Page 1 of 23: Cover');

    await pageList(page).selectOption({ label: '8. France' });
    await expect(stampButton(page, 'Paris, Banks of the Seine')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Choose the photo for / })).toHaveCount(0);

    // Belém's only photo is hidden: no stamp for a viewer, and it's still to collect
    await pageList(page).selectOption({ label: '9. Portugal' });
    await expect(book(page).getByText('No landmark stamped in Portugal yet.', { exact: false })).toBeVisible();
    const toStamp = book(page).getByRole('region', { name: 'Still to stamp (17)' });
    await toStamp.getByRole('button', { name: 'Show all 17' }).click();
    await expect(toStamp.getByRole('listitem').filter({ hasText: 'Tower of Belém' })).toBeVisible();

    await pageList(page).selectOption({ label: '23. Totals' });
    await expect(book(page).getByRole('definition')).toHaveText(['20', '5 of 7', '0 of 5', '24', '21']);
  });

  // 25 Nov 2026, the user's wish: "improve passport page for user avatars and info"
  test('an editor gives a traveller a passport photo and a signature, which the share link shows', { tag: '@phone' }, async ({ page }) => {
    await openPassport(page);
    // The map's link open to anyone, for the end (the seed's is for the people on it)
    await page.evaluate((key) => {
      const db = JSON.parse(localStorage.getItem(key));
      db.maps.find((m) => m.id === 'map-home').linkAccess = 'ANYONE_WITH_LINK';
      localStorage.setItem(key, JSON.stringify(db));
    }, MOCK_STORE_KEY);
    await page.reload();
    await expect(pageStatus(page)).toHaveText(/^Page 1 of \d+: Cover$/);
    await page.getByRole('button', { name: 'Next page' }).click();
    const charlie = book(page).locator('[data-passport-traveller="trav-test"]');
    // The details: home, when they started travelling, the day of issue, a passport number
    await expect(charlie).toContainText('Date of birth14 Jan 1990');
    await expect(charlie).toContainText('HomeUnited Kingdom');
    await expect(charlie).toContainText(/Travelling since\d{4}/);
    await expect(charlie).toContainText(/Passport no\.MP\d{7}/);
    // No signature drawn yet: the name in handwriting
    await expect(charlie.locator('[data-signature="name"]')).toHaveText('Charlie');

    // A photo from the map's own, placed in the box
    await charlie.getByRole('button', { name: 'Choose a photo of Charlie' }).click();
    const dialog = page.getByRole('dialog', { name: 'Charlie’s passport photo' });
    await dialog.getByRole('button', { name: 'First morning in Rome' }).click();
    await dialog.getByLabel('Zoom').fill('2');
    await dialog.getByRole('group', { name: /passport photo: drag it/ }).press('ArrowLeft');
    await dialog.getByRole('button', { name: 'Save the photo' }).click();
    await expect(dialog).toBeHidden();
    const photo = charlie.locator('[data-passport-photo="MAP"] img');
    await expect(photo).toBeVisible();
    await expect(photo).toHaveAttribute('style', /scale\(2\)/);
    await expect(charlie.getByRole('button', { name: 'Change the photo of Charlie' })).toBeVisible();

    // A signature drawn with the mouse (or a finger)
    await charlie.getByRole('button', { name: 'Sign as Charlie' }).click();
    const sign = page.getByRole('dialog', { name: 'Charlie’s signature' });
    const pad = await sign.locator('[data-signature-pad]').boundingBox();
    await page.mouse.move(pad.x + pad.width * 0.1, pad.y + pad.height * 0.7);
    await page.mouse.down();
    for (const [x, y] of [[0.2, 0.3], [0.3, 0.7], [0.45, 0.35], [0.6, 0.6], [0.85, 0.4]]) {
      await page.mouse.move(pad.x + pad.width * x, pad.y + pad.height * y, { steps: 4 });
    }
    await page.mouse.up();
    await sign.getByRole('button', { name: 'Save the signature' }).click();
    await expect(sign).toBeHidden();
    await expect(charlie.getByRole('img', { name: 'Charlie’s signature' })).toBeVisible();
    await expect(charlie.getByRole('button', { name: 'Sign again as Charlie' })).toBeVisible();

    // Through the map's share link: the photo and the signature, nothing to change (the owner
    // keeps their role there, so still sees the date of birth)
    const sharedTraveller = async (inApp = false) => {
      if (inApp) {
        await goInApp(page, `/shared/${HOME_SHARE_CODE}/passport`);
        await expect(pageStatus(page)).toHaveText(/^Page 1 of \d+: Cover$/);
      } else await openPassport(page, `/shared/${HOME_SHARE_CODE}/passport`);
      await page.getByRole('button', { name: 'Next page' }).click();
      return book(page).locator('[data-passport-traveller="trav-test"]');
    };
    let shared = await sharedTraveller();
    await expect(shared.locator('[data-passport-photo="MAP"] img')).toBeVisible();
    await expect(shared.getByRole('img', { name: 'Charlie’s signature' })).toBeVisible();
    await expect(shared.getByRole('button')).toHaveCount(0);
    // Anyone else with the link: the same, never the date of birth (a page load would sign the
    // mock in again: move within the app)
    await signOut(page);
    shared = await sharedTraveller(true);
    await expect(shared.locator('[data-passport-photo="MAP"] img')).toBeVisible();
    await expect(shared.getByRole('img', { name: 'Charlie’s signature' })).toBeVisible();
    await expect(shared).not.toContainText('Date of birth');
    await expect(shared.getByRole('button')).toHaveCount(0);
  });

  // 26 Nov 2026, the user's wish: "add choosing passport colour, just the cover colour, and
  // gold or silver lettering stays tied to the plan"
  test('the owner chooses the cover’s colour, kept for the map and shown through its link', { tag: '@phone' }, async ({ page }) => {
    await openPassport(page);
    const picker = page.getByRole('group', { name: 'Cover colour' });
    // The test user's plan is Business: navy, with silver lettering
    await expect(picker.getByRole('radio', { name: /Navy/ })).toBeChecked();
    await expect(picker).toContainText('The lettering stays your plan’s, silver');
    const board = () => book(page).evaluate((el) => el.style.getPropertyValue('--board'));
    expect(await board()).toBe('');
    await picker.getByText('Green', { exact: true }).click();
    await expect(picker.getByRole('radio', { name: /Green/ })).toBeChecked();
    await expect.poll(board).toBe('var(--cover-green)');

    // Kept: after a reload, and through the map's link (which offers no choice)
    await page.reload();
    await expect(page.getByRole('group', { name: 'Cover colour' }).getByRole('radio', { name: /Green/ })).toBeChecked();
    await expect.poll(board).toBe('var(--cover-green)');
    await openPassport(page, `/shared/${HOME_SHARE_CODE}/passport`);
    await expect.poll(board).toBe('var(--cover-green)');
    await expect(page.getByRole('group', { name: 'Cover colour' })).toHaveCount(0);
  });

  test('a share link opens the passport read only; a trip’s link has none', async ({ page }) => {
    // The owner, through their own map's link: still no picker (that's on the map's own address)
    await openPassport(page, `/shared/${HOME_SHARE_CODE}/passport`);
    await expect(page.getByRole('heading', { level: 1, name: HOME_MAP })).toBeVisible();
    await pageList(page).selectOption({ label: '8. France' });
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

  // 26 Nov 2026, the audit: under the page's title, the page bar covered the closed cover's
  // foot on a 1440×900 screen, and on a 720-pixel one the book and bar never both fitted
  test('the book fits above its page bar: the whole cover on a 1440×900 screen, and book and bar together once scrolled to on a smaller one', async ({ page }) => {
    const bar = page.getByRole('navigation', { name: 'Passport pages' });
    const leaves = page.locator('[data-book-height]');
    await page.setViewportSize({ width: 1440, height: 900 });
    await openPassport(page);
    await expect(book(page).locator('[data-cover]')).toBeVisible();
    let bookBox = await leaves.boundingBox();
    let barBox = await bar.boundingBox();
    expect(bookBox.y + bookBox.height).toBeLessThanOrEqual(barBox.y);
    expect(barBox.y + barBox.height).toBeLessThanOrEqual(900);

    await page.setViewportSize({ width: 1280, height: 720 });
    await expect.poll(async () => Number(await leaves.getAttribute('data-book-height'))).toBe(448);
    await leaves.evaluate((el) => el.scrollIntoView({ block: 'start' }));
    bookBox = await leaves.boundingBox();
    barBox = await bar.boundingBox();
    expect(bookBox.y).toBeGreaterThanOrEqual(0);
    expect(bookBox.y + bookBox.height).toBeLessThanOrEqual(barBox.y);
    expect(barBox.y + barBox.height).toBeLessThanOrEqual(720);
  });

  test('on a phone the page bar sits under the book, never over its foot', { tag: '@phone' }, async ({ page }) => {
    await openPassport(page);
    const bar = page.getByRole('navigation', { name: 'Passport pages' });
    if (page.viewportSize().width >= 768) {
      await expect(bar).toHaveCSS('position', 'sticky');
      return;
    }
    await expect(bar).toHaveCSS('position', 'static');
    const bookBox = await page.locator('[data-book-height]').boundingBox();
    const barBox = await bar.boundingBox();
    expect(bookBox.y + bookBox.height).toBeLessThanOrEqual(barBox.y);
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
    await expect(pageStatus(page)).toHaveText('Page 2 of 23: Travellers');
    await swipe(-160);
    await expect(pageStatus(page)).toHaveText('Page 3 of 23: United Kingdom');
    await swipe(160);
    await expect(pageStatus(page)).toHaveText('Page 2 of 23: Travellers');
    // A short or mostly vertical drag is a scroll, not a turn
    await swipe(-30);
    await expect(pageStatus(page)).toHaveText('Page 2 of 23: Travellers');
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
    await pageList(page).selectOption({ label: '6. Netherlands' });
    await expect(book(page).getByRole('heading', { level: 2, name: 'Netherlands' })).toBeVisible();
    const own = book(page).locator('bdi[lang="nl"]');
    await expect(own).toHaveText('Nederland');
    // Portugal calls itself Portugal: nothing beside it
    await pageList(page).selectOption({ label: '9. Portugal' });
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
    await expect(pageStatus(page)).toHaveText('Page 2 of 23: Travellers');
    // The double-click highlighted nothing
    expect(await page.evaluate(() => window.getSelection().toString())).toBe('');

    // The open book is a spread on this screen: a double-click on the right-hand page turns
    // on, one on the left-hand page turns back (both away from the pages' controls)
    const doubleClickAt = async (share) => {
      const box = await book(page).getByRole('region').first().boundingBox();
      await page.mouse.dblclick(box.x + box.width * share, box.y + box.height * 0.8);
    };
    await doubleClickAt(0.75);
    await expect(pageStatus(page)).toHaveText('Page 3 of 23: United Kingdom');
    await doubleClickAt(0.25);
    await expect(pageStatus(page)).toHaveText('Page 2 of 23: Travellers');
    expect(await page.evaluate(() => window.getSelection().toString())).toBe('');
  });

  test('a stamp’s landmark shows the moments that happened there, and so does its card on the map', async ({ page }) => {
    await openPassport(page);
    await pageList(page).selectOption({ label: '8. France' });
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
