import { test, expect, HOME_MAP, HOME_SHARE_CODE, goInApp, makeJpeg, openMap, openTool, pressTool } from './fixtures.js';

// A map's own design (docs/API.md "Map designs"; 21 Nov 2026, the user's wish): the owner
// colours countries, the names and the grid, and puts a picture of theirs on the sea, in
// Settings; the map wears it at once, keeps it, and shows it to everyone who opens the map.
// It's drawn on the map's own style, which the owner chooses for everyone too (docs/API.md
// "Map styles"; 22 Nov 2026, the user's wish).

const designed = (page) => page.locator('[data-map-design]');
const mapFrame = (page) => page.locator('[data-map-style]:has(#main-content)');
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
  // Under the map style, above the map type (23 Nov 2026, the user's wish)
  const top = async (locator) => (await locator.boundingBox()).y;
  const styleTop = await top(settings.getByRole('group', { name: 'Map style' }));
  const designTop = await top(editor);
  expect(designTop).toBeGreaterThan(styleTop);
  expect(await top(settings.getByRole('group', { name: 'Map type' }))).toBeGreaterThan(designTop);
  await editor.getByLabel('Country names', { exact: true }).fill('#ffffff');
  // The first change switches the design on, on the map's own style
  await expect(designed(page)).toHaveCount(1);
  await expect(mapFrame(page)).toHaveAttribute('data-map-style', 'animated');
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
  // A visitor can't change it, nor the map's style
  const shared = await openTool(page, 'Map settings', 'Settings');
  await expect(shared.locator('[data-map-design-editor]')).toHaveCount(0);
  await expect(shared.getByText('Everyone who opens this map sees it in this style')).toHaveCount(0);
  await closeSettings(shared);

  // Removed, the sea is the usual one again
  await goInApp(page, '/map');
  const back = await openDesign(page);
  await back.editor.getByRole('button', { name: 'Remove the picture' }).click();
  await expect(seaPicture(page)).toHaveCount(0);
  await expect(back.editor.getByText('The usual sea.')).toBeVisible();
});

test('the owner’s map style is everyone’s, and the design’s colours start from it', async ({ page }) => {
  await openMap(page);
  const { settings, editor } = await openDesign(page);
  await expect(settings.getByText('Everyone who opens this map sees it in this style')).toBeVisible();
  // The radios are hidden inside picture cards: press the card's name
  await settings.getByText('Starry night', { exact: true }).click();
  await expect(mapFrame(page)).toHaveAttribute('data-map-style', 'starry');

  // The pickers start from the starry night's own colours: every country its pale blue
  await editor.getByRole('button', { name: 'Choose colours' }).click();
  await editor.getByRole('searchbox', { name: 'Find a country' }).fill('fran');
  const france = editor.getByLabel('Colour of France', { exact: true });
  await expect(france).toHaveValue('#8ec3e6');
  await expect(editor.getByLabel('Country names', { exact: true })).toHaveValue('#0b2240');

  // Colouring a country keeps the map in its style
  await france.fill('#aa0000');
  await expect(designed(page)).toHaveCount(1);
  await expect(mapFrame(page)).toHaveAttribute('data-map-style', 'starry');
  await expect(editor.getByText('Saved.')).toBeVisible();
  await expect.poll(() => fillOf(page, 'FR')).toBe('rgb(170, 0, 0)');
  await closeSettings(settings);

  // Everyone who opens the map sees it so: here through its share link, where a visitor's own
  // style is for their own maps
  await pressTool(page, 'Share this map');
  const dialog = page.getByRole('dialog', { name: `Share “${HOME_MAP}”` });
  await dialog.getByRole('combobox', { name: 'General access' }).selectOption('Anyone with the link');
  await expect(dialog.getByRole('combobox', { name: 'General access' })).toHaveValue('ANYONE_WITH_LINK');
  await dialog.getByRole('button', { name: 'Done' }).click();
  await goInApp(page, `/shared/${HOME_SHARE_CODE}`);
  await expect(page).toHaveURL(new RegExp(`/shared/${HOME_SHARE_CODE}$`));
  await expect(mapFrame(page)).toHaveAttribute('data-map-style', 'starry');
  await expect.poll(() => fillOf(page, 'FR')).toBe('rgb(170, 0, 0)');
  const shared = await openTool(page, 'Map settings', 'Settings');
  await shared.getByText('Old map', { exact: true }).click();
  await expect(shared.getByRole('radio', { name: 'Old map' })).toBeChecked();
  await expect(shared.getByText('This map is shown in the style its owner chose')).toBeVisible();
  await expect(mapFrame(page)).toHaveAttribute('data-map-style', 'starry');
});

// 22 Nov 2026 (the user's report): colours chosen on Black and white turned grey, so seemed to
// do nothing, and showed on the World map instead. Each style keeps its own design now, and
// Black and white shows the colours chosen for it.
test('each map style keeps its own design, and Black and white shows its colours', async ({ page }) => {
  await openMap(page);
  const { settings } = await openDesign(page);
  await settings.getByText('Black and white', { exact: true }).click();
  await expect(mapFrame(page)).toHaveAttribute('data-map-style', 'mono');
  // The section is Black and white's own (a new one for each style)
  const editor = settings.locator('[data-map-design-editor]');
  await expect(editor.getByText('for the Black and white style')).toBeVisible();

  await editor.getByLabel('Country names', { exact: true }).fill('#e92525');
  await editor.getByLabel('Grid lines', { exact: true }).fill('#2563eb');
  await expect(editor.getByText('Saved.')).toBeVisible();
  await expect.poll(() => tokenOnMap(page, '--map-names')).toBe('#e92525');
  // Shown in colour: the map's drawing takes no greyscale filter (only what's around it, and
  // the pictures in it)
  for (const box of [mapFrame(page), page.locator('[data-mono-map]'), page.locator('#main-content'), page.locator('#main-content svg').first()]) {
    await expect(box).toHaveCSS('filter', 'none');
  }
  // The toolbar, beside the map, is still greyed
  const toolbarFilter = () =>
    page.getByRole('navigation', { name: 'Map tools' }).evaluate((el) => {
      let box = el;
      while (box.parentElement && !box.parentElement.hasAttribute('data-mono-map')) box = box.parentElement;
      return getComputedStyle(box).filter;
    });
  await expect.poll(toolbarFilter).toBe('grayscale(1)');

  // The World map keeps its own (none here): the usual colours, on the map and in the pickers
  await settings.getByText('World map', { exact: true }).click();
  await expect(mapFrame(page)).toHaveAttribute('data-map-style', 'animated');
  await expect(designed(page)).toHaveCount(0);
  await expect(editor.getByText('for the World map style')).toBeVisible();
  await expect(editor.getByLabel('Country names', { exact: true })).toHaveValue('#000000');

  // Back on Black and white, its colours are there, and stay after a reload
  await settings.getByText('Black and white', { exact: true }).click();
  await expect.poll(() => tokenOnMap(page, '--map-names')).toBe('#e92525');
  await expect(editor.getByLabel('Grid lines', { exact: true })).toHaveValue('#2563eb');
  await closeSettings(settings);
  await page.reload();
  await expect(mapFrame(page)).toHaveAttribute('data-map-style', 'mono');
  await expect.poll(() => tokenOnMap(page, '--map-grid')).toBe('#2563eb');
});

// 23 Nov 2026 (the user's wish): the country under the pointer takes a colour of the design's own
test('the design sets the colour a country turns under the pointer', async ({ page }) => {
  await openMap(page);
  const { settings, editor } = await openDesign(page);
  const hover = editor.getByLabel('Country highlight when hovered', { exact: true });
  // It starts from the style's own highlight, the World map's bright green
  await expect(hover).toHaveValue('#66ff66');
  await hover.fill('#ff00aa');
  await expect(editor.getByText('Saved.')).toBeVisible();
  await expect.poll(() => tokenOnMap(page, '--map-hover')).toBe('#ff00aa');
  await closeSettings(settings);

  // Australia under the pointer wears it: the middle of its mainland, its largest shape (the
  // whole shape's middle is at sea, as it takes in far islands)
  const australia = page.locator('[data-map-design] svg g[data-code="AU"]').first();
  const shapes = australia.locator('path');
  const sizes = await shapes.evaluateAll((paths) => paths.map((path) => path.getBBox().width * path.getBBox().height));
  await shapes.nth(sizes.indexOf(Math.max(...sizes))).hover();
  await expect.poll(() => australia.evaluate((el) => getComputedStyle(el).fill)).toBe('rgb(255, 0, 170)');

  // Kept after a reload, and back to the usual green on request
  await page.reload();
  await expect.poll(() => tokenOnMap(page, '--map-hover')).toBe('#ff00aa');
  const again = await openDesign(page);
  await again.editor.getByRole('button', { name: 'Country highlight when hovered: back to the usual colour' }).click();
  await expect(again.editor.getByText('Saved.')).toBeVisible();
  await expect(again.editor.getByLabel('Country highlight when hovered', { exact: true })).toHaveValue('#66ff66');
});

// 25 Nov 2026 (the user's wish: "all the countries I have visited or lived in turn the colour I
// selected"): the places been to filled with one colour, over a colour of their own; the badges,
// the hover colour and the outlines as they were
test('the owner shows the places been to in one colour, over their own, everyone seeing it', async ({ page }) => {
  await openMap(page);
  const { settings, editor } = await openDesign(page);
  // Portugal (been to) and Germany (not yet) red by hand
  await editor.getByRole('button', { name: 'Choose colours' }).click();
  const find = editor.getByRole('searchbox', { name: 'Find a country' });
  await find.fill('portugal');
  await editor.getByLabel('Colour of Portugal', { exact: true }).fill('#ff0000');
  await find.fill('germany');
  await editor.getByLabel('Colour of Germany', { exact: true }).fill('#ff0000');
  await expect.poll(() => fillOf(page, 'PT')).toBe('rgb(255, 0, 0)');

  // Badges to start with; then a colour, the map style's own purple until one is chosen
  const looks = editor.getByRole('group', { name: 'Places you’ve been show as' });
  await expect(looks.getByLabel('A badge', { exact: true })).toBeChecked();
  await expect(editor.getByLabel('Visited country colour', { exact: true })).toHaveCount(0);
  await looks.getByLabel('A colour', { exact: true }).check();
  await expect.poll(() => fillOf(page, 'PT')).toBe('rgb(124, 58, 237)');
  await expect.poll(() => fillOf(page, 'DE')).toBe('rgb(255, 0, 0)');
  // The badges of the places it fills go
  await expect(page.locator('[data-visit-badge="fill"]').first()).toBeHidden();
  await editor.getByLabel('Visited country colour', { exact: true }).fill('#aa00aa');
  await expect.poll(() => fillOf(page, 'PT')).toBe('rgb(170, 0, 170)');
  await expect.poll(() => fillOf(page, 'NZ')).toBe('rgb(170, 0, 170)');
  await expect(editor.getByText('Saved.')).toBeVisible();
  await closeSettings(settings);
  // The map key says so
  await expect(page.getByRole('list', { name: 'Map key' }).getByText('Visited or lived there')).toBeVisible();

  // The hover colour as it was, on a place been to too: the middle of India's mainland (clear of
  // the tags at the top left)
  const india = page.locator('[data-map-design] svg g[data-code="IN"]').first();
  const shapes = india.locator('path');
  const sizes = await shapes.evaluateAll((paths) => paths.map((path) => path.getBBox().width * path.getBBox().height));
  await shapes.nth(sizes.indexOf(Math.max(...sizes))).hover();
  await expect.poll(() => india.evaluate((el) => getComputedStyle(el).fill)).toBe('rgb(102, 255, 102)');
  await page.mouse.move(5, 5);
  await expect.poll(() => india.evaluate((el) => getComputedStyle(el).fill)).toBe('rgb(170, 0, 170)');

  // A colour and a badge: the badges back, the colour kept
  const again = await openDesign(page);
  await again.editor.getByRole('group', { name: 'Places you’ve been show as' }).getByLabel('A colour and a badge', { exact: true }).check();
  await expect(page.locator('[data-visit-badge="fill"]').first()).toBeVisible();
  await expect.poll(() => fillOf(page, 'PT')).toBe('rgb(170, 0, 170)');
  await expect(again.editor.getByText('Saved.')).toBeVisible();
  await closeSettings(again.settings);

  // Kept, and the same through a share link
  await page.reload();
  await expect.poll(() => fillOf(page, 'PT')).toBe('rgb(170, 0, 170)');
  await goInApp(page, `/shared/${HOME_SHARE_CODE}`);
  await expect.poll(() => fillOf(page, 'PT')).toBe('rgb(170, 0, 170)');
  await expect.poll(() => fillOf(page, 'DE')).toBe('rgb(255, 0, 0)');
});

// A metallic finish (25 Nov 2026, the user's wish: "shiny colours like gold and silver", "a few
// options next to the colour selector for visited country, like gold silver bronze")
test('the places been to can wear gold, silver or bronze foil, kept, and a colour again', async ({ page }) => {
  await openMap(page);
  const { settings, editor } = await openDesign(page);
  await editor.getByRole('group', { name: 'Places you’ve been show as' }).getByLabel('A colour', { exact: true }).check();
  const finishes = editor.getByRole('group', { name: 'Or a metallic finish' });
  await expect(finishes.getByRole('button')).toHaveText(['Gold', 'Silver', 'Bronze']);

  // Gold: a sheet of polished gold under the map, showing through the places been to (their own
  // fill see-through), its edges lit while the map is still
  const foil = page.locator('[data-map-design] svg [data-visited-foil]');
  await finishes.getByRole('button', { name: 'Gold' }).click();
  await expect(finishes.getByRole('button', { name: 'Gold' })).toHaveAttribute('aria-pressed', 'true');
  await expect(foil).toHaveAttribute('data-visited-foil', 'GOLD');
  await expect(foil.locator('image')).toHaveAttribute('href', /foil-gold/);
  await expect.poll(() => fillOf(page, 'PT')).toBe('rgba(0, 0, 0, 0)');
  await expect.poll(() => foil.evaluate((el) => getComputedStyle(el).filter)).toContain('mpv-foil-edge');
  // Silver in its place
  await finishes.getByRole('button', { name: 'Silver' }).click();
  await expect(foil).toHaveAttribute('data-visited-foil', 'SILVER');
  await expect(foil.locator('image')).toHaveAttribute('href', /foil-silver/);
  await expect(finishes.getByRole('button', { name: 'Gold' })).toHaveAttribute('aria-pressed', 'false');
  await expect(editor.getByText('Saved.')).toBeVisible();
  await closeSettings(settings);
  // The map key's swatch is the metal too
  await expect
    .poll(() => page.locator('[data-key-visited-colour] [aria-hidden]').evaluate((el) => getComputedStyle(el).backgroundImage))
    .toContain('foil-silver');

  // While the map is dragged, the lit edge waits for it to be still (it doubled each frame's cost)
  const map = page.getByRole('application', { name: /: world map$/ });
  const box = await map.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 60, box.y + box.height / 2, { steps: 4 });
  await expect(map).toHaveAttribute('data-moving', '');
  await expect.poll(() => foil.evaluate((el) => getComputedStyle(el).filter)).toBe('none');
  await page.mouse.up();
  await expect(map).not.toHaveAttribute('data-moving');
  await expect.poll(() => foil.evaluate((el) => getComputedStyle(el).filter)).toContain('mpv-foil-edge');

  // Kept after a reload, and for anyone with the link
  await page.reload();
  await expect(foil).toHaveAttribute('data-visited-foil', 'SILVER');
  await expect.poll(() => fillOf(page, 'PT')).toBe('rgba(0, 0, 0, 0)');
  await goInApp(page, `/shared/${HOME_SHARE_CODE}`);
  await expect(foil).toHaveAttribute('data-visited-foil', 'SILVER');

  // Back on the map, a colour chosen leaves the metal
  await openMap(page);
  const again = await openDesign(page);
  await again.editor.getByLabel('Visited country colour', { exact: true }).fill('#aa00aa');
  await expect.poll(() => fillOf(page, 'PT')).toBe('rgb(170, 0, 170)');
  await expect(again.editor.getByRole('group', { name: 'Or a metallic finish' }).getByRole('button', { name: 'Silver' })).toHaveAttribute('aria-pressed', 'false');
  await expect(foil).toHaveCount(0);
});
