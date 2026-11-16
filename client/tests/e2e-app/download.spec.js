import { readFile } from 'node:fs/promises';
import { test, expect, HOME_MAP, openMap, openTool } from './fixtures.js';

// "Print or download" (docs/API.md, "Downloads"): an editor gets a country's, a trip's or
// the whole map's best copies as a zip made in the browser, then the print partners. The
// test user owns "Charlie & Alex's travels" (Business, so originals): France has 3 photos,
// the Italian summer trip 3, the map 16 (one hidden, which its editors still get).

// The browser without a save dialog that writes to disk: the zip is held in memory, then
// handed to the downloads (Firefox, Safari, phones)
const withoutSavePicker = (page) =>
  page.addInitScript(() => {
    delete window.showSaveFilePicker;
  });

// A browser with one (Chrome and Edge on a computer): the zip streams into the "file"
// chosen, here an in-page stand-in that keeps the bytes and the name it was offered
const withSavePicker = (page) =>
  page.addInitScript(() => {
    window.__savedZip = { name: null, bytes: 0, chunks: [], closed: false };
    window.showSaveFilePicker = async ({ suggestedName }) => {
      window.__savedZip.name = suggestedName;
      return {
        createWritable: async () =>
          new WritableStream({
            write(chunk) {
              window.__savedZip.chunks.push(chunk);
              window.__savedZip.bytes += chunk.byteLength;
            },
            close() {
              window.__savedZip.closed = true;
            },
          }),
      };
    };
  });

// Does the saved zip hold these entry names? (stored zips keep each name as plain UTF-8)
const zipHolds = (bytes, names) => names.map((name) => bytes.includes(Buffer.from(name, 'utf8')));

async function openFrance(page) {
  await openMap(page);
  const list = await openTool(page, 'Country list', 'Countries');
  await list.getByRole('searchbox', { name: 'Search countries' }).fill('france');
  await list.getByRole('button', { name: 'France', exact: true }).click();
  return page.getByRole('dialog', { name: 'France' });
}

test.describe('Print or download', () => {
  test('a country’s photos download as one zip, then the print partners', async ({ page }) => {
    await withoutSavePicker(page);
    const france = await openFrance(page);
    await france.getByRole('button', { name: 'Print or download' }).click();
    const dialog = page.getByRole('dialog', { name: 'Print or download: France' });

    // What's coming: three originals (a Business map), which still hold their location
    await expect(dialog.getByText('3 photos', { exact: true })).toBeVisible();
    await expect(dialog.getByText(/They’re the originals, as uploaded\./)).toBeVisible();
    // The print partners: the example printer, labelled as a partner offer, counted as PRINT
    const printer = dialog.getByRole('link', { name: /^Ad: Photo prints and photobooks\. Visit Example Prints/ });
    await expect(printer).toHaveAttribute('href', /\/go\/[^?]+\?p=PRINT$/);
    await expect(dialog.getByText('Partner offers. We may earn a commission if you order, at no cost to you.')).toBeVisible();

    const [download] = await Promise.all([page.waitForEvent('download'), dialog.getByRole('button', { name: 'Download the zip' }).click()]);
    expect(download.suggestedFilename()).toBe('France.zip');
    await expect(dialog.getByRole('status').filter({ hasText: 'Saved France.zip.' })).toBeVisible();
    const zip = await readFile(await download.path());
    expect(zip.subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
    // Named by the day taken and the caption, in no folder
    expect(
      zipHolds(zip, [
        '2019-04-12 Evening by the Seine.jpg',
        '2023-07-18 Mont Saint-Michel at low tide.jpg',
        '2025-05-05 The Louvre’s Richelieu wing.jpg',
      ])
    ).toEqual([true, true, true]);

    // Escape closes the download dialog first, then the country
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(france).toBeVisible();
  });

  test('a trip’s photos stream into the file chosen, where the browser can', async ({ page }) => {
    await withSavePicker(page);
    await page.goto('/trips/trip-italy');
    await expect(page.getByRole('heading', { level: 1, name: 'Italian summer' })).toBeVisible();
    await page.getByRole('region', { name: 'Photos' }).getByRole('button', { name: 'Print or download' }).click();
    const dialog = page.getByRole('dialog', { name: 'Print or download: Italian summer' });
    await expect(dialog.getByText('3 photos', { exact: true })).toBeVisible();
    await expect(dialog.getByText(/You choose where to save it\./)).toBeVisible();

    await dialog.getByRole('button', { name: 'Download the zip' }).click();
    await expect(dialog.getByRole('status').filter({ hasText: 'Saved Italian summer.zip.' })).toBeVisible();
    const saved = await page.evaluate(() => {
      const { name, bytes, chunks, closed } = window.__savedZip;
      const all = new Uint8Array(bytes);
      let at = 0;
      for (const chunk of chunks) {
        all.set(chunk, at);
        at += chunk.byteLength;
      }
      return { name, closed, bytes: Array.from(all) };
    });
    expect(saved).toMatchObject({ name: 'Italian summer.zip', closed: true });
    const zip = Buffer.from(saved.bytes);
    expect(
      zipHolds(zip, ['2025-07-03 First morning in Rome.jpg', '2025-07-08 Florence by night.jpg', '2025-07-13 Manarola and the coast.jpg'])
    ).toEqual([true, true, true]);
  });

  test('the whole map comes in a folder per country, hidden photos too', async ({ page }) => {
    await withoutSavePicker(page);
    await openMap(page);
    const settings = await openTool(page, 'Map settings', 'Settings');
    await settings.getByRole('tab', { name: 'This map' }).click();
    await settings.getByRole('button', { name: 'Download or print photos' }).click();
    const dialog = page.getByRole('dialog', { name: `Print or download: ${HOME_MAP}` });
    await expect(dialog.getByText('16 photos', { exact: true })).toBeVisible();

    const [download] = await Promise.all([page.waitForEvent('download'), dialog.getByRole('button', { name: 'Download the zip' }).click()]);
    expect(download.suggestedFilename()).toBe(`${HOME_MAP}.zip`);
    const zip = await readFile(await download.path());
    expect(
      zipHolds(zip, [
        'France/2019-04-12 Evening by the Seine.jpg',
        'Italy/2025-07-03 First morning in Rome.jpg',
        'Portugal/2021-10-21 Hidden from viewers (editors only).jpg',
        'United States/2018-10-21 Lower Manhattan from Jersey City.jpg',
      ])
    ).toEqual([true, true, true, true]);
  });

  test('viewers and share links have nothing to download', async ({ page }) => {
    // The test user is a viewer on Sam's map
    await openMap(page, '/maps/map-sam');
    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('searchbox', { name: 'Search countries' }).fill('thailand');
    await list.getByRole('button', { name: 'Thailand', exact: true }).click();
    const thailand = page.getByRole('dialog', { name: 'Thailand' });
    await expect(thailand.getByRole('button', { name: 'Slideshow of Thailand' })).toBeVisible();
    await expect(thailand.getByRole('button', { name: 'Print or download' })).toHaveCount(0);
  });
});
