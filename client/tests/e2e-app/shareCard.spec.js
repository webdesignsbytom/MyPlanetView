import { test, expect, openMap, openTool } from './fixtures.js';

// The share card (21 Nov 2026, the user's wish): a picture of the map, made in the browser,
// for Instagram and WhatsApp.

test('the statistics make a picture of the map, which saves as a file', async ({ page }) => {
  await openMap(page);
  const stats = await openTool(page, 'Travel statistics', 'Travel statistics');
  await stats.getByRole('button', { name: 'Share a picture of my map' }).click();
  const dialog = page.getByRole('dialog', { name: 'Share a picture of your map' });
  const card = dialog.locator('img[data-share-card]');
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute('alt', /\d+ countries, \d+ continents, \d+ landmarks$/);
  // The real picture: 1080 × 1350
  await expect.poll(() => card.evaluate((img) => [img.naturalWidth, img.naturalHeight].join('×'))).toBe('1080×1350');

  const download = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Save the picture' }).click();
  expect((await download).suggestedFilename()).toBe('my-planet-view-map.png');
  await expect(dialog.getByText('Saved to your downloads.')).toBeVisible();
});
