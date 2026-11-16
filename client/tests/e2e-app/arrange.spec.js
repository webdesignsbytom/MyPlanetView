import { test, expect, makeJpeg, openMap, openTool, openUploader } from './fixtures.js';

// Rearranging a gallery: a country's on the map, and a trip's. Uploaded photos have no
// caption, so the tiles are told apart by their pictures (each upload is its own blob URL).

const fileInput = (panel) => panel.getByLabel(/choose photos/i);
const pictures = (gallery) => gallery.locator('ul img').evaluateAll((imgs) => imgs.map((img) => img.getAttribute('src')));
// A country panel's photo gallery (its landmark list has pictures too)
const photosOf = (panel) => panel.getByRole('region', { name: 'Photos' });

async function uploadTo(page, panel, names) {
  for (const name of names) {
    await fileInput(panel).setInputFiles(await makeJpeg(page, { name }));
    await expect(panel.getByRole('listitem').filter({ hasText: name })).toContainText('Added');
  }
}

/**
 * Wait until a keyboard pick-up is ready for the arrow keys. dnd-kit (6.3) measures the tiles
 * in effects after the pick-up renders, and starts listening for keys on a 0 ms timer; an
 * arrow key in that gap (the test presses it the moment "Picked up…" is said, ~20 ms) is
 * ignored, which made this test fail about one run in eight. A person never presses that
 * fast. Two frames and a task let both happen.
 */
const pickUpSettled = (page) =>
  page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve)))));

async function openCountry(page, name) {
  const list = await openTool(page, 'Country list', 'Countries');
  await list.getByRole('searchbox', { name: 'Search countries' }).fill(name.toLowerCase());
  await list.getByRole('button', { name, exact: true }).click();
  const panel = page.getByRole('dialog', { name, exact: true });
  await expect(panel).toBeVisible();
  return panel;
}

// A mouse drag in small steps, as a person drags (dnd-kit starts after 4 px). The
// gallery may be below the fold of its panel (a country's moments come first): both
// tiles are scrolled into view first, as a person would.
async function drag(page, from, to) {
  await to.scrollIntoViewIfNeeded();
  await from.scrollIntoViewIfNeeded();
  const a = await from.boundingBox();
  const b = await to.boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 10, a.y + a.height / 2, { steps: 4 });
  await page.mouse.move(b.x + b.width * 0.75, b.y + b.height / 2, { steps: 12 });
  await page.mouse.up();
}

test.describe('Rearranging photos', () => {
  test('an editor drags a country’s photos into a new order, and it is saved', async ({ page }) => {
    await openMap(page);
    const upload = await openUploader(page);
    await upload.getByRole('combobox', { name: 'Country for photos with no location' }).selectOption({ label: 'Germany' });
    await uploadTo(page, upload, ['first.jpg', 'second.jpg', 'third.jpg']);
    await upload.getByRole('button', { name: 'Close Add photos' }).click();

    let germany = await openCountry(page, 'Germany');
    await expect(photosOf(germany).locator('ul img')).toHaveCount(3);
    // Newest first
    const [third, second, first] = await pictures(photosOf(germany));

    await germany.getByRole('button', { name: 'Rearrange photos' }).click();
    const tiles = germany.getByRole('button', { name: 'Photo', exact: true });
    await expect(tiles).toHaveCount(3);
    // The tiles are movable now, not links to the viewer
    await expect(tiles.first()).toHaveAttribute('aria-roledescription', 'movable photo');
    await drag(page, tiles.nth(0), tiles.nth(2));
    await expect.poll(() => pictures(photosOf(germany))).toEqual([second, first, third]);

    await germany.getByRole('button', { name: 'Done rearranging' }).click();
    await expect(germany.getByRole('button', { name: 'Open Photo' })).toHaveCount(3);

    // Closed and opened again, the panel asks for the list again: the order was saved
    await germany.getByRole('button', { name: 'Close Germany' }).click();
    germany = await openCountry(page, 'Germany');
    await expect.poll(() => pictures(photosOf(germany))).toEqual([second, first, third]);
  });

  test('a photo moves with the keyboard too', async ({ page }) => {
    await openMap(page);
    const upload = await openUploader(page);
    await upload.getByRole('combobox', { name: 'Country for photos with no location' }).selectOption({ label: 'Austria' });
    await uploadTo(page, upload, ['one.jpg', 'two.jpg']);
    await upload.getByRole('button', { name: 'Close Add photos' }).click();

    const austria = await openCountry(page, 'Austria');
    await expect(photosOf(austria).locator('ul img')).toHaveCount(2);
    const [two, one] = await pictures(photosOf(austria));
    await austria.getByRole('button', { name: 'Rearrange photos' }).click();
    const tiles = austria.getByRole('button', { name: 'Photo', exact: true });
    await expect(tiles).toHaveCount(2);

    // Each step is said aloud (dnd-kit's live region), as a screen reader user hears it
    const said = (text) => expect(page.getByRole('status').filter({ hasText: text })).toHaveCount(1);
    await tiles.first().focus();
    await page.keyboard.press('Space');
    await said('Picked up Photo, at place 1 of 2.');
    await pickUpSettled(page);
    await page.keyboard.press('ArrowRight');
    await said('Photo moved to place 2 of 2.');
    await page.keyboard.press('Space');
    await said('Dropped Photo at place 2 of 2.');
    await expect.poll(() => pictures(photosOf(austria))).toEqual([one, two]);
  });

  test('a trip’s photos have their own order', async ({ page }) => {
    await openMap(page);
    const trips = await openTool(page, 'Trips', 'Trips');
    await trips.getByRole('link', { name: /Italian summer/ }).click();
    await expect(page.getByRole('heading', { name: 'Italian summer', level: 1 })).toBeVisible();

    const photos = page.getByRole('region', { name: 'Photos' });
    await photos.getByRole('button', { name: 'Add photos' }).click();
    const upload = page.getByRole('dialog', { name: 'Add photos to Italian summer' });
    await uploadTo(page, upload, ['gelato.jpg']);
    await upload.getByRole('button', { name: /^Close/ }).click();

    // The new photo first, then the trip's three demo photos
    await expect(photos.locator('ul img')).toHaveCount(4);
    const [added, ...demo] = await pictures(photos);
    await photos.getByRole('button', { name: 'Rearrange photos' }).click();
    // The rearranging tiles are named by caption ("Photo" for the upload, which has none)
    const tiles = photos.locator('[aria-roledescription="movable photo"]');
    await expect(tiles).toHaveCount(4);
    await drag(page, tiles.nth(0), tiles.nth(1));
    await expect.poll(() => pictures(photos)).toEqual([demo[0], added, ...demo.slice(1)]);
  });
});
