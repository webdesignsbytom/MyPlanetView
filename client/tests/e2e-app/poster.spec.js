import fs from 'node:fs';
import { test, expect, openMap, openStats } from './fixtures.js';

// The map as a printed poster (22 Nov 2026, the user's wish): drawn in the browser at print
// size, a PNG that says its resolution (300 dpi), so a print shop prints it at the paper's size.

// A PNG's width, height and dpi (its pHYs chunk, pixels per metre)
function pngInfo(bytes) {
  const info = { signature: bytes.subarray(1, 4).toString('latin1'), width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), dpi: null };
  let at = 33;
  while (at + 8 <= bytes.length) {
    const length = bytes.readUInt32BE(at);
    const type = bytes.subarray(at + 4, at + 8).toString('latin1');
    if (type === 'pHYs') info.dpi = Math.round(bytes.readUInt32BE(at + 8) * 0.0254);
    if (type === 'IDAT') break;
    at += 12 + length;
  }
  return info;
}

test('the statistics make a poster of the map, at print size and 300 dpi', async ({ page }) => {
  await openMap(page);
  await openStats(page);
  await page.getByRole('dialog', { name: 'Travel statistics' }).getByRole('button', { name: 'A poster of my map' }).click();
  const dialog = page.getByRole('dialog', { name: 'A poster of your map' });
  await expect(dialog.locator('[data-poster-preview]')).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Title' })).toHaveValue("Charlie & Alex's travels");

  await dialog.getByLabel('Paper size').selectOption({ label: 'A4 (29.7 × 21 cm)' });
  await dialog.getByLabel('Look').selectOption({ label: 'Old paper' });
  const [download] = await Promise.all([page.waitForEvent('download'), dialog.getByRole('button', { name: 'Download the poster' }).click()]);
  expect(download.suggestedFilename()).toBe('charlie-alex-s-travels-poster-A4.png');
  const info = pngInfo(fs.readFileSync(await download.path()));
  expect(info).toEqual({ signature: 'PNG', width: 3508, height: 2480, dpi: 300 });
  await expect(dialog.locator('[data-poster-status]')).toHaveText('Saved: 3,508 × 2,480 pixels, A4 (29.7 × 21 cm) at 300 dpi.');
});
