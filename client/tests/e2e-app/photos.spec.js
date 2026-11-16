import { test, expect, expectStats, makeJpeg, openMap, openTool, statsBadge } from './fixtures.js';

// The upload panel's file input (a hidden input behind the "Choose photos" drop zone)
const fileInput = (panel) => panel.getByLabel(/choose photos/i);
const countryChoice = (panel) => panel.getByRole('combobox', { name: 'Country for photos with no location' });

async function upload(page, file, { country } = {}) {
  const panel = await openTool(page, 'Add photos', 'Add photos');
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
    await viewer.getByRole('button', { name: 'That\'s right' }).click();
    await expect(viewer.getByText('Brandenburg Gate', { exact: true })).toBeVisible();
    // Escape closes the viewer only: the country's panel stays, with focus back on the photo
    await page.keyboard.press('Escape');
    await expect(viewer).toBeHidden();
    await expect(germany).toBeVisible();
    await expect(thumb).toBeFocused();

    // A confirmed landmark counts
    await statsBadge(page).click();
    await expect(page.getByRole('dialog', { name: 'Travel statistics' }).getByRole('definition')).toHaveText(['9', '2 of 7', '0 of 5', '17', '3', '3']);
  });

  test('a photo with no country waits under Unplaced photos until it is given one', { tag: '@phone' }, async ({ page }) => {
    await openMap(page);
    const { panel, item } = await upload(page, await makeJpeg(page, { name: 'somewhere.jpg' }));
    await expect(item).toContainText('under Unplaced photos until you choose a country');
    await expectStats(page, '8 countries, 2 continents, 17 photos');
    await panel.getByRole('button', { name: 'Close Add photos' }).click();

    await statsBadge(page).click();
    const stats = page.getByRole('dialog', { name: 'Travel statistics' });
    await stats.getByRole('button', { name: 'Unplaced photos (1)' }).click();

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
});
