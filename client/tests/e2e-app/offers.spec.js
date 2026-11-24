import { test, expect, MOCK_STORE_KEY, openMap, openTool, mapReady, playMyWorld } from './fixtures.js';

// Travel offers (docs/API.md, "Travel offers"; docs/FEATURE-PLAN.md, "Ads by tier",
// "Travel Desk") against mock mode. The seeded test user pays for Business, so sees no
// cards; the tests that need them make the test user Economy (their own map is then an
// Economy map, a card every 12 photos). France has 3 photos in the seed, so they add more.
// The map's soonest planned trip is "Japan in spring" (Tokyo first, 1–14 April 2027), so
// its cards are Japan's, carrying Japan (never a stop's own place name) and those dates. Partner links go to
// www.example.com, answered here and never fetched.

const TRIP_DATES = 'from=2027-04-01&to=2027-04-14';

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

/** `count` more photos of France on the test user's map (copies of the Eiffel Tower's), and optionally Economy. */
async function morePhotosOfFrance(page, count, { economy = false } = {}) {
  await openMap(page);
  await editStore(
    page,
    (db, { count: n, economy: free }) => {
      if (free) db.subscriptions = db.subscriptions.filter((s) => s.userId !== 'mock-user');
      const eiffel = db.photos.find((p) => p.id === 'photo-eiffel');
      for (let i = 0; i < n; i++) {
        db.photos.push({ ...eiffel, id: `photo-france-${i}`, caption: `France ${i + 1}`, countryPosition: 1000 + i, createdAt: eiffel.createdAt });
      }
    },
    { count, economy },
  );
  await mapReady(page);
}

async function openCountry(page, name) {
  const list = await openTool(page, 'Country list', 'Countries');
  await list.getByRole('searchbox', { name: 'Search countries' }).fill(name.toLowerCase());
  await list.getByRole('button', { name, exact: true }).click();
  const panel = page.getByRole('dialog', { name, exact: true });
  await expect(panel).toBeVisible();
  return panel;
}

const photoGallery = (panel) => panel.getByRole('region', { name: 'Photos', exact: true }).getByRole('list').first();
const adLinks = (scope) => scope.getByRole('link', { name: /^Ad: / });

test.describe('Travel offers', () => {
  test.beforeEach(async ({ context }) => {
    await context.route('https://www.example.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Partner</title><p>A partner’s page</p>' }),
    );
  });

  test('an Economy map’s country gallery shows a card after every 12 photos, labelled Ad, but not while rearranging', async ({ page }) => {
    await morePhotosOfFrance(page, 13, { economy: true });
    const panel = await openCountry(page, 'France');
    const gallery = photoGallery(panel);

    // A page of 12 photos, then the card: the 13th tile, a link named "Ad: …" first
    const tiles = gallery.getByRole('listitem');
    await expect(tiles).toHaveCount(13);
    const card = adLinks(gallery);
    await expect(card).toHaveCount(1);
    await expect(tiles.nth(12).getByRole('link')).toHaveAccessibleName(/^Ad: .+\. Visit .+ \(opens in a new tab\)$/);
    await expect(tiles.nth(11).getByRole('button', { name: /^Open / })).toBeVisible();
    await expect(tiles.nth(12).getByText('Ad', { exact: true })).toBeVisible();
    // A plain sponsored link through /go/, for the gallery, chosen for the planned trip to Japan
    await expect(card).toHaveAttribute('rel', 'sponsored noopener');
    await expect(card).toHaveAttribute('target', '_blank');
    await expect(card).toHaveAttribute('href', new RegExp(`/go/[0-9a-f-]+\\?p=GALLERY&dest=Japan&country=JP&${TRIP_DATES}$`));

    // The next page brings 4 more photos after it; the card keeps its place
    await panel.getByRole('button', { name: 'Show more photos' }).click();
    await expect(tiles).toHaveCount(17);
    await expect(tiles.nth(12).getByRole('link', { name: /^Ad: / })).toBeVisible();

    // Rearranging shows the photos alone
    await panel.getByRole('button', { name: 'Rearrange photos' }).click();
    await expect(panel.getByRole('button', { name: 'Done rearranging' })).toBeVisible();
    await expect(adLinks(panel)).toHaveCount(0);
    await panel.getByRole('button', { name: 'Done rearranging' }).click();
    await expect(adLinks(gallery)).toHaveCount(1);
  });

  test('a paying viewer sees no cards, and still has the Travel Desk', async ({ page }) => {
    await morePhotosOfFrance(page, 13);
    const panel = await openCountry(page, 'France');
    const gallery = photoGallery(panel);
    await expect(gallery.getByRole('listitem')).toHaveCount(12);
    await expect(adLinks(panel)).toHaveCount(0);
    await expect(panel.getByRole('button', { name: 'Travel Desk' })).toBeVisible();
  });

  test('clicking a card counts it for the day and opens the partner’s link', async ({ page, context }) => {
    await morePhotosOfFrance(page, 13, { economy: true });
    const panel = await openCountry(page, 'France');
    const card = adLinks(photoGallery(panel));
    const offerId = (await card.getAttribute('href')).match(/\/go\/([^?]+)/)[1];

    const [partner] = await Promise.all([context.waitForEvent('page'), card.click()]);
    // The partner's own link, its placeholders filled from the card's place and dates
    await expect.poll(() => partner.url()).toMatch(/^https:\/\/www\.example\.com\/.*Japan.*ref=myplanetview-example/);
    expect(partner.url()).toContain('2027-04-01');

    // One more in today's (UTC) tally for that offer in a gallery, and nothing else kept
    const today = new Date().toISOString().slice(0, 10);
    const row = await page.evaluate(
      ({ key, id, day }) => JSON.parse(localStorage.getItem(key)).offerClicks.find((r) => r.offerId === id && r.day === day && r.placement === 'GALLERY'),
      { key: MOCK_STORE_KEY, id: offerId, day: today },
    );
    expect(row).toEqual({ offerId, day: today, placement: 'GALLERY', count: 1 });
  });

  test('the Travel Desk opens from a planned trip, and its links carry the place and dates', async ({ page }) => {
    await page.goto('/trips/trip-japan');
    await expect(page.getByRole('heading', { level: 1, name: 'Japan in spring' })).toBeVisible();
    // A paying viewer: the desk is on every plan
    const button = page.getByRole('button', { name: 'Travel Desk' });
    await button.click();
    const desk = page.getByRole('dialog', { name: 'Travel Desk' });
    await expect(desk).toBeVisible();
    await expect(desk.getByText('Partner offers. We may earn a commission if you book, at no cost to you.')).toBeVisible();
    await expect(desk.getByText(/For Japan · 1 Apr 2027 – 14 Apr 2027/i)).toBeVisible();

    // A shelf per kind: Japan's own offers, then the general ones
    await expect(desk.getByRole('heading', { level: 3, name: 'Places to stay' })).toBeVisible();
    await expect(desk.getByRole('heading', { level: 3, name: 'Travel insurance' })).toBeVisible();
    const links = adLinks(desk);
    await expect(links.first()).toBeVisible();
    for (const href of await links.evaluateAll((all) => all.map((a) => a.getAttribute('href')))) {
      expect(href).toMatch(new RegExp(`\\?p=TRAVEL_DESK&dest=Japan&country=JP&${TRIP_DATES}$`));
    }
    await expect(desk.getByRole('link', { name: /^Ad: Hotels in Japan\. / })).toBeVisible();

    // Escape closes it, and focus goes back to the button
    await page.keyboard.press('Escape');
    await expect(desk).toHaveCount(0);
    await expect(button).toBeFocused();
  });

  test('a slideshow ends with one card where the galleries show them, never mid-show', async ({ page }) => {
    await morePhotosOfFrance(page, 0, { economy: true });
    const show = await playMyWorld(page);
    const stage = show.locator('[data-slide-id]');
    await expect(stage).not.toHaveAttribute('data-slide-id', '');
    // Step through to the end: no card on the way
    for (let step = 0; step < 40 && (await stage.getAttribute('data-slide-kind')) !== 'end'; step++) {
      await expect(adLinks(show)).toHaveCount(0);
      const id = await stage.getAttribute('data-slide-id');
      await page.keyboard.press('ArrowRight');
      await expect(stage).not.toHaveAttribute('data-slide-id', id);
    }
    await expect(stage).toHaveAttribute('data-slide-kind', 'end');
    const card = adLinks(show);
    await expect(card).toHaveCount(1);
    await expect(card).toHaveAttribute('href', new RegExp(`\\?p=SLIDESHOW&dest=Japan&country=JP&${TRIP_DATES}$`));
  });
});
