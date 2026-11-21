import { test, expect, HOME_MAP, HOME_SHARE_CODE, goInApp, makeJpeg, openMap, openTool, pressTool } from './fixtures.js';

// A map's own design (docs/API.md "Map designs"; 21 Nov 2026, the user's wish): the owner
// colours countries, the names and the grid, and puts a picture of theirs on the sea, in
// Settings; the map wears it at once, keeps it, and shows it to everyone who opens the map.

const designed = (page) => page.locator('[data-map-design]');
const seaPicture = (page) => page.locator('[data-design-picture] img');
const fillOf = (page, code) =>
  page.locator(`[data-map-design] svg g[data-code="${code}"]`).first().evaluate((el) => getComputedStyle(el).fill);
const tokenOnMap = (page, name) => designed(page).evaluate((el, token) => getComputedStyle(el).getPropertyValue(token).trim(), name);

async function openDesign(page) {
  const settings = await openTool(page, 'Map settings', 'Settings');
  const editor = settings.locator('[data-map-design-editor]');
  await expect(editor.getByRole('heading', { name: 'This map’s design' })).toBeVisible();
  return { settings, editor };
}

async function closeSettings(settings) {
  await settings.getByRole('button', { name: 'Close Settings' }).click();
  await expect(settings).toBeHidden();
}

test('the owner colours a country, the names and the grid; the map keeps them', async ({ page }) => {
  await openMap(page);
  await expect(designed(page)).toHaveCount(0);

  const { settings, editor } = await openDesign(page);
  await editor.getByLabel('Country names', { exact: true }).fill('#ffffff');
  // The first change switches the design on, on the World map's look
  await expect(designed(page)).toHaveCount(1);
  await expect(page.locator('[data-map-style]').first()).toHaveAttribute('data-map-style', 'animated');
  await editor.getByLabel('Grid lines', { exact: true }).fill('#ffcc00');

  await editor.getByRole('button', { name: 'Choose colours' }).click();
  await editor.getByRole('searchbox', { name: 'Find a country' }).fill('fran');
  await editor.getByLabel('Colour of France', { exact: true }).fill('#aa0000');
  await expect(editor.getByText('1 of')).toBeVisible();
  await expect(editor.getByText('Saved.')).toBeVisible();
  await closeSettings(settings);

  await expect.poll(() => fillOf(page, 'FR')).toBe('rgb(170, 0, 0)');
  await expect.poll(() => tokenOnMap(page, '--map-names')).toBe('#ffffff');
  await expect.poll(() => tokenOnMap(page, '--map-grid')).toBe('#ffcc00');
  // A coloured grid is drawn stronger
  await expect(page.locator('g.stroke-map-grid')).toHaveCSS('opacity', '0.7');
  // A region wears its country's colour (New Caledonia is France's)
  await expect.poll(() => fillOf(page, 'NC')).toBe('rgb(170, 0, 0)');

  // Kept, and back to the usual colour on request
  await page.reload();
  await expect.poll(() => fillOf(page, 'FR')).toBe('rgb(170, 0, 0)');
  const again = await openDesign(page);
  await again.editor.getByRole('button', { name: 'Choose colours' }).click();
  await again.editor.getByRole('button', { name: 'France: back to the usual colour' }).click();
  await expect(again.editor.getByText('Every country in its usual colour')).toBeVisible();

  // Switched off, the map is in the viewer's own style again, the design kept
  await again.editor.getByRole('checkbox', { name: 'Show this map in its own design' }).uncheck();
  await expect(designed(page)).toHaveCount(0);
  await expect(again.editor.getByText('Saved.')).toBeVisible();
  await again.editor.getByRole('checkbox', { name: 'Show this map in its own design' }).check();
  await expect(designed(page)).toHaveCount(1);
  await expect.poll(() => tokenOnMap(page, '--map-names')).toBe('#ffffff');
});

test('a picture of the owner’s fills the sea, replaced or removed; a share link shows the design', async ({ page }) => {
  await openMap(page);
  const { settings, editor } = await openDesign(page);
  const input = editor.locator('[data-design-picture-input]');

  await input.setInputFiles(await makeJpeg(page, { name: 'beach.jpg' }));
  await expect(seaPicture(page)).toBeVisible();
  await expect(editor.getByRole('img', { name: 'The picture on this map’s sea' })).toBeVisible();
  const first = await seaPicture(page).getAttribute('src');

  // A new one replaces it
  await input.setInputFiles(await makeJpeg(page, { name: 'mountains.jpg' }));
  await expect.poll(() => seaPicture(page).getAttribute('src')).not.toBe(first);
  await editor.getByLabel('Country names', { exact: true }).fill('#ffffff');
  await expect(editor.getByText('Saved.')).toBeVisible();
  await closeSettings(settings);

  // Everyone who opens the map sees it: here, through its share link
  await pressTool(page, 'Share this map');
  const dialog = page.getByRole('dialog', { name: `Share “${HOME_MAP}”` });
  await dialog.getByRole('combobox', { name: 'General access' }).selectOption('Anyone with the link');
  await expect(dialog.getByRole('combobox', { name: 'General access' })).toHaveValue('ANYONE_WITH_LINK');
  await dialog.getByRole('button', { name: 'Done' }).click();
  await goInApp(page, `/shared/${HOME_SHARE_CODE}`);
  await expect(page).toHaveURL(new RegExp(`/shared/${HOME_SHARE_CODE}$`));
  await expect(seaPicture(page)).toBeVisible();
  await expect.poll(() => tokenOnMap(page, '--map-names')).toBe('#ffffff');
  // A visitor can't change it, and is told why their style doesn't apply
  const shared = await openTool(page, 'Map settings', 'Settings');
  await expect(shared.locator('[data-map-design-editor]')).toHaveCount(0);
  await expect(shared.getByText('This map has its own design')).toBeVisible();
  await closeSettings(shared);

  // Removed, the sea is the usual one again
  await goInApp(page, '/map');
  const back = await openDesign(page);
  await back.editor.getByRole('button', { name: 'Remove the picture' }).click();
  await expect(seaPicture(page)).toHaveCount(0);
  await expect(back.editor.getByText('The usual sea.')).toBeVisible();
});
