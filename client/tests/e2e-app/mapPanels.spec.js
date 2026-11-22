import { test, expect, HOME_MAP, openMap, openTool, pressTool } from './fixtures.js';

// The map's panels (22 Nov 2026, the user's wishes): a tool from the toolbar closes whatever is
// open (the photo album stayed under "Play my world"), every panel opens over the dimmed map,
// a press on which closes it, and the panels are 10% wider than they were (26 and 34rem).

const scrim = (page) => page.locator('[data-map-scrim]');

test('a tool from the toolbar closes the open panel, the slideshow and sharing included', async ({ page }) => {
  await openMap(page);
  const album = await openTool(page, 'Photo album', 'Photo album');
  await pressTool(page, 'Play my world');
  const show = page.getByRole('dialog', { name: `Slideshow: ${HOME_MAP}` });
  await expect(show).toBeVisible();
  await expect(album).toBeHidden();
  await show.getByRole('button', { name: /^Close/ }).first().click();
  await expect(show).toBeHidden();
  await expect(album).toBeHidden();

  const settings = await openTool(page, 'Map settings', 'Settings');
  await pressTool(page, 'Share this map');
  await expect(page.getByRole('dialog', { name: `Share “${HOME_MAP}”` })).toBeVisible();
  await expect(settings).toBeHidden();
});

test('a panel opens over the dimmed map, which closes it when pressed', async ({ page }) => {
  await openMap(page);
  await expect(scrim(page)).toHaveCount(0);
  const settings = await openTool(page, 'Map settings', 'Settings');
  await expect(scrim(page)).toBeVisible();
  // 10% wider: Settings 37.5rem, the rest 28.5rem (16px each)
  expect(Math.round((await settings.boundingBox()).width)).toBe(600);

  // The toolbar stays above it, so another tool is one press away
  const switcher = await openTool(page, 'Your maps', 'Your maps');
  await expect(settings).toBeHidden();
  expect(Math.round((await switcher.boundingBox()).width)).toBe(456);

  // A press on the dimmed map, beside the panel, closes it
  const box = await switcher.boundingBox();
  await page.mouse.click(Math.max(10, box.x - 60), box.y + box.height / 2);
  await expect(switcher).toBeHidden();
  await expect(scrim(page)).toHaveCount(0);
});
