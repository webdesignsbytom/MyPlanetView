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

// A country's ticket (23 Nov 2026, the user's wish: on a phone a long name ran under the map
// button and the close stamp): on phones and tablets they share the continent's row, above the
// name, which has the ticket's whole width and is a size smaller there; from 1024px wide they
// stand beside the name as before
test('a country ticket’s buttons share the continent’s row on a phone, and stand beside the name on a wide screen', { tag: '@phone' }, async ({ page }) => {
  await openMap(page);
  const list = await openTool(page, 'Country list', 'Countries');
  await list.getByRole('button', { name: 'Philippines', exact: true }).click();
  const ticket = page.getByRole('dialog', { name: 'Philippines' });
  const name = ticket.getByRole('heading', { name: 'Philippines' });
  const mapButton = ticket.getByRole('button', { name: 'Open Philippines on its own map' });
  const close = ticket.getByRole('button', { name: 'Close Philippines' });
  await expect(mapButton).toBeVisible();
  const [nameBox, continentBox, mapBox, closeBox] = await Promise.all(
    [name, ticket.getByText('Asia', { exact: true }), mapButton, close].map((item) => item.boundingBox()),
  );
  const middle = (box) => box.y + box.height / 2;
  if (page.viewportSize().width < 1024) {
    for (const box of [mapBox, closeBox]) {
      expect(Math.abs(middle(box) - middle(continentBox))).toBeLessThan(4);
      expect(middle(box)).toBeLessThan(nameBox.y);
    }
    expect(nameBox.x + nameBox.width).toBeGreaterThan(mapBox.x);
    await expect(name).toHaveCSS('font-size', '24px');
    // The close stamp at the row's size (28px, a little more for its tilt)
    expect(closeBox.height).toBeLessThan(36);
  } else {
    expect(mapBox.x).toBeGreaterThanOrEqual(nameBox.x + nameBox.width);
    expect(middle(mapBox)).toBeGreaterThan(nameBox.y);
    expect(middle(mapBox)).toBeLessThan(nameBox.y + nameBox.height);
    await expect(name).toHaveCSS('font-size', '36px');
  }
});

// A country's buttons (23 Nov 2026, the user's wish: five in one row barely fit): the slideshow,
// adding photos and planning a trip above its photos, side by side on a wide screen; "Print or
// download" and the Travel Desk under them
test('a country ticket’s slideshow, add photos and plan a trip sit above its photos', async ({ page }) => {
  await openMap(page);
  const list = await openTool(page, 'Country list', 'Countries');
  await list.getByRole('searchbox', { name: 'Search countries' }).fill('france');
  await list.getByRole('button', { name: 'France', exact: true }).click();
  const france = page.getByRole('dialog', { name: 'France' });
  const firstPhoto = france.getByRole('region', { name: 'Photos' }).locator('ul > li').first();
  await expect(firstPhoto).toBeVisible();
  const above = ['Play slideshow', 'Add photos', 'Plan a trip'].map((name) => france.getByRole('button', { name, exact: true }));
  const below = [france.getByRole('button', { name: 'Print or download' }), france.getByRole('button', { name: /Travel Desk/ })];
  const photoBox = await firstPhoto.boundingBox();
  const aboveBoxes = await Promise.all(above.map((button) => button.boundingBox()));
  const belowBoxes = await Promise.all(below.map((button) => button.boundingBox()));
  for (const box of aboveBoxes) expect(box.y + box.height).toBeLessThanOrEqual(photoBox.y);
  for (const box of belowBoxes) expect(box.y).toBeGreaterThanOrEqual(photoBox.y + photoBox.height);
  // One row of three, and one of two
  for (const box of aboveBoxes) expect(Math.abs(box.y - aboveBoxes[0].y)).toBeLessThan(2);
  expect(Math.abs(belowBoxes[1].y - belowBoxes[0].y)).toBeLessThan(2);
});
