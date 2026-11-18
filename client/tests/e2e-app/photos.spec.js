import { test, expect, REGION_COUNT, expectStats, makeJpeg, openMap, openStats, openTool, openUploader } from './fixtures.js';

// The upload panel's file input (a hidden input behind the "Choose photos" drop zone)
const fileInput = (panel) => panel.getByLabel(/choose photos/i);
const countryChoice = (panel) => panel.getByRole('combobox', { name: 'Country for photos with no location' });

async function upload(page, file, { country } = {}) {
  const panel = await openUploader(page);
  if (country) await countryChoice(panel).selectOption({ label: country });
  await fileInput(panel).setInputFiles(file);
  const item = panel.getByRole('listitem').filter({ hasText: file.name });
  await expect(item).toContainText('Added');
  return { panel, item };
}

// The viewer's big picture really loaded (the display copy made in the browser)
const expectPictureLoaded = (viewer) =>
  expect.poll(() => viewer.locator('img').first().evaluate((img) => (img.complete ? img.naturalWidth : 0))).toBeGreaterThan(0);

test.describe('Photos', () => {
  test('a photo with no location goes in the chosen country, shows in its panel and opens', { tag: '@phone' }, async ({ page }) => {
    await openMap(page);
    const { panel, item } = await upload(page, await makeJpeg(page, { name: 'harbour.jpg' }), { country: 'Germany' });
    await expect(item).toContainText('No location in the file, so it went in Germany.');
    // A photo from a country you hadn't marked makes it visited
    await expectStats(page, '9 countries, 2 continents, 17 photos');
    await panel.getByRole('button', { name: 'Close Add photos' }).click();

    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('searchbox', { name: 'Search countries' }).fill('germany');
    await expect(list.getByRole('button', { name: 'Status for Germany: Visited' })).toBeVisible();
    await list.getByRole('button', { name: 'Germany', exact: true }).click();

    const germany = page.getByRole('dialog', { name: 'Germany' });
    const thumb = germany.getByRole('button', { name: 'Open Photo' });
    await expect(thumb).toBeVisible();
    await thumb.click();
    const viewer = page.getByRole('dialog', { name: 'Photo' });
    await expect(viewer.getByText('Germany', { exact: true })).toBeVisible();
    await expectPictureLoaded(viewer);
    await expect(viewer.getByRole('link', { name: 'Download original' })).toBeVisible();

    await viewer.getByRole('button', { name: 'Close' }).click();
    await expect(viewer).toBeHidden();
  });

  test('a photo’s GPS position places it and suggests the landmark there', async ({ page }) => {
    await openMap(page);
    // The Brandenburg Gate, with no country chosen
    const file = await makeJpeg(page, { name: 'gate.jpg', gps: { latitude: 52.51627, longitude: 13.37772 } });
    const { panel, item } = await upload(page, file);
    await expect(item).toContainText('Placed in Germany from its location.');
    await expectStats(page, '9 countries, 2 continents, 17 photos');
    await panel.getByRole('button', { name: 'Close Add photos' }).click();

    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('searchbox', { name: 'Search countries' }).fill('germany');
    await list.getByRole('button', { name: 'Germany', exact: true }).click();
    const germany = page.getByRole('dialog', { name: 'Germany' });
    const thumb = germany.getByRole('button', { name: 'Open Photo' });
    await thumb.focus();
    await page.keyboard.press('Enter');

    const viewer = page.getByRole('dialog', { name: 'Photo' });
    await expect(viewer.getByText(/^Brandenburg Gate — suggested \(\d+ m away\)$/)).toBeVisible();
    // Museum Island (1.3 km off, within its 3 km) is suggested too: each has its own yes
    await expect(viewer.getByText(/^Museum Island — suggested \(1\.3 km away\)$/)).toBeVisible();
    await viewer.getByRole('button', { name: 'That\'s right: Brandenburg Gate' }).click();
    await expect(viewer.getByText('Brandenburg Gate', { exact: true })).toBeVisible();
    // Escape closes the viewer only: the country's panel stays, with focus back on the photo
    await page.keyboard.press('Escape');
    await expect(viewer).toBeHidden();
    await expect(germany).toBeVisible();
    await expect(thumb).toBeFocused();

    // A confirmed landmark counts (the seeded map has 13 stamps)
    await openStats(page);
    await expect(page.getByRole('dialog', { name: 'Travel statistics' }).getByRole('definition')).toHaveText(['9', '2 of 7', '0 of 5', `0 of ${REGION_COUNT}`, '17', '14', '3']);
  });

  test('a photo with no country waits under Unplaced photos until it is given one', { tag: '@phone' }, async ({ page }) => {
    await openMap(page);
    const { panel, item } = await upload(page, await makeJpeg(page, { name: 'somewhere.jpg' }));
    await expect(item).toContainText('under Unplaced photos until you choose a country');
    await expectStats(page, '8 countries, 2 continents, 17 photos');
    await panel.getByRole('button', { name: 'Close Add photos' }).click();

    // From the country list (the stats panel has the same button, on wide screens)
    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('button', { name: 'Unplaced photos (1)' }).click();

    const unplaced = page.getByRole('dialog', { name: 'Unplaced photos' });
    await unplaced.getByRole('button', { name: 'Open Photo' }).click();
    const viewer = page.getByRole('dialog', { name: 'Photo' });
    await expectPictureLoaded(viewer);
    await viewer.getByRole('button', { name: 'Edit' }).click();
    await viewer.getByRole('combobox', { name: 'Country' }).selectOption({ label: 'Greece' });
    await viewer.getByRole('textbox', { name: 'Caption' }).fill('Somewhere sunny');
    await viewer.getByRole('button', { name: 'Save', exact: true }).click();

    // Now it has a country (and a caption, so a new title), and it leaves the list
    const saved = page.getByRole('dialog', { name: 'Somewhere sunny' });
    await expect(saved.getByText('Greece', { exact: true })).toBeVisible();
    await saved.getByRole('button', { name: 'Close' }).click();
    await expect(unplaced.getByText('Every photo has a country now.')).toBeVisible();
    await expectStats(page, '9 countries, 2 continents, 17 photos');
  });

  // 17 Nov 2026, the user's wishes: no wait for a photo already on screen, Previous and
  // Next under it, and a tap for full screen
  test('a gallery photo opens at once, steps with Previous and Next, and shows full screen', { tag: '@phone' }, async ({ page }) => {
    await openMap(page);
    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('searchbox', { name: 'Search countries' }).fill('france');
    await list.getByRole('button', { name: 'France', exact: true }).click();
    const gallery = page.getByRole('dialog', { name: 'France' }).getByRole('region', { name: 'Photos' });
    const thumbs = gallery.getByRole('button', { name: /^Open / });
    await expect(thumbs).toHaveCount(3);
    const names = await thumbs.evaluateAll((buttons) => buttons.map((b) => b.getAttribute('aria-label').replace(/^Open /, '')));

    // At once, from the gallery's own copy: no "Opening photo…" while its reply comes
    await thumbs.first().click();
    const first = page.getByRole('dialog', { name: names[0] });
    await expect(first.getByRole('button', { name: `Show ${names[0]} full screen` })).toBeVisible();
    await expect(first.getByText('Opening photo…')).toHaveCount(0);
    await expect(first.getByText('1 of 3')).toBeVisible();
    await expect(first.getByRole('button', { name: 'Previous photo' })).toBeDisabled();

    await first.getByRole('button', { name: 'Next photo' }).click();
    const second = page.getByRole('dialog', { name: names[1] });
    await expect(second.getByText('2 of 3')).toBeVisible();
    await expectPictureLoaded(second);

    // Full screen steps through the same list; closing it leaves the viewer on that photo
    await second.getByRole('button', { name: `Show ${names[1]} full screen` }).click();
    const full = page.getByRole('dialog').filter({ has: page.getByRole('button', { name: 'Close the photo' }) });
    await expect(full).toHaveAccessibleName(names[1]);
    await full.getByRole('button', { name: 'Next photo' }).click();
    await expect(full).toHaveAccessibleName(names[2]);
    await page.keyboard.press('Escape');
    await expect(full).toHaveCount(0);
    const third = page.getByRole('dialog', { name: names[2] });
    await expect(third.getByText('3 of 3')).toBeVisible();
    await expect(third.getByRole('button', { name: 'Next photo' })).toBeDisabled();
  });

  test('a photo is deleted from the viewer, after a second press', async ({ page }) => {
    await openMap(page);
    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('searchbox', { name: 'Search countries' }).fill('netherlands');
    await list.getByRole('button', { name: 'Netherlands', exact: true }).click();
    const panel = page.getByRole('dialog', { name: 'Netherlands' });
    await panel.getByRole('button', { name: 'Open Canals at dusk' }).click();

    const viewer = page.getByRole('dialog', { name: 'Canals at dusk' });
    await viewer.getByRole('button', { name: 'Delete', exact: true }).click();
    await viewer.getByRole('button', { name: 'Keep it' }).click();
    await viewer.getByRole('button', { name: 'Delete', exact: true }).click();
    await viewer.getByRole('button', { name: 'Yes, delete' }).click();
    await expect(viewer).toBeHidden();

    await expect(panel.getByText('No photos from Netherlands yet.')).toBeVisible();
    await expectStats(page, '8 countries, 2 continents, 15 photos');
  });

  test('the photo album shows every photo, newest first, each with its country, and adds more', async ({ page }) => {
    await openMap(page);
    const gallery = await openTool(page, 'Photo album', 'Photo album');
    await expect(gallery.getByRole('listitem')).toHaveCount(16);

    // Videos are First Class: the owner (on Business) is offered the upgrade
    await gallery.getByRole('button', { name: 'Add photos', exact: true }).click();
    const panel = page.getByRole('dialog', { name: 'Add photos', exact: true });
    await expect(panel.getByText('Videos are part of First Class.')).toBeVisible();
    await expect(panel.getByRole('link', { name: 'Upgrade to First Class' })).toHaveAttribute('href', '/account#account-plan-heading');

    // A new photo comes first in the gallery, with its country under it
    await countryChoice(panel).selectOption({ label: 'Germany' });
    await fileInput(panel).setInputFiles(await makeJpeg(page, { name: 'newest.jpg' }));
    await expect(panel.getByRole('listitem').filter({ hasText: 'newest.jpg' })).toContainText('Added');
    await panel.getByRole('button', { name: 'Close Add photos' }).click();

    const again = await openTool(page, 'Photo album', 'Photo album');
    await expect(again.getByRole('listitem')).toHaveCount(17);
    await expect(again.getByRole('listitem').first()).toHaveText('Germany');

    // A photo opens full screen: just the picture and its title (no caption here, so its
    // country), nothing to edit; it steps through the album and closes back to it
    await again.getByRole('listitem').first().getByRole('button', { name: 'Open Photo' }).click();
    const viewer = page.getByRole('dialog', { name: 'Germany' });
    await expect(viewer.getByRole('img', { name: 'Germany' })).toBeVisible();
    await expect(viewer.getByRole('button', { name: /^(Edit|Delete|Download)/ })).toHaveCount(0);
    await expect(viewer.getByRole('combobox')).toHaveCount(0);
    await expect(viewer.getByRole('button', { name: 'Previous photo' })).toBeDisabled();
    const where = page.getByRole('status').filter({ hasText: /^Photo \d+ of \d+/ });
    await expect(where).toHaveText('Photo 1 of 17: Germany');
    await viewer.getByRole('button', { name: 'Next photo' }).click();
    await expect(where).toHaveText(/^Photo 2 of 17: /);
    await page.keyboard.press('ArrowLeft');
    await expect(where).toHaveText('Photo 1 of 17: Germany');
    await page.keyboard.press('Escape');
    await expect(viewer).toBeHidden();
    await expect(again).toBeVisible();
  });
});
