// Strings between places (docs/API.md "Strings"; 23 Nov 2026, the user's wish): red thread
// pin to pin, like a corkboard map. String mode ties one between two countries clicked on
// the map and takes one off with a click; the Strings panel adds them automatically, ties them
// from two lists and takes them off; the viewer can hide them; the map design sets their
// colour; a share link shows them.
import { test, expect, HOME_SHARE_CODE, MOCK_STORE_KEY, mapReady, openMap, openStringsPanel, openTool, pressCountry, pressTool, toolbar } from './fixtures.js';

// The visited strings (the red ones), and apart the planned ones (25 Nov 2026, the user's wish)
const string = (page, pair) => page.locator(`[data-string="${pair}"][data-string-kind="VISITED"]`);
const strings = (page) => page.locator('[data-string][data-string-kind="VISITED"]');
const plannedString = (page, pair) => page.locator(`[data-string="${pair}"][data-string-kind="PLANNED"]`);
const plannedStrings = (page) => page.locator('[data-string][data-string-kind="PLANNED"]');
const modeTag = (page) => page.locator('[data-string-mode]');
// The Strings panel's open tab (the closed one is hidden, so only the open one is a tabpanel)
const openTab = (panel) => panel.getByRole('tabpanel');
// What the mock's store keeps of the map's design (the panel says nothing once a colour is saved:
// 25 Nov 2026, the user's wish), for waiting on a save before a reload
const savedDesign = (page, field) =>
  page.evaluate(
    ([key, name]) => {
      const map = JSON.parse(localStorage.getItem(key)).maps.find((m) => m.id === 'map-home');
      return Object.values(map?.designs || {}).find((d) => d?.[name])?.[name] ?? null;
    },
    [MOCK_STORE_KEY, field],
  );
async function showPlanned(panel) {
  await panel.getByRole('tab', { name: 'Planned' }).click();
  return openTab(panel);
}
// Two presses less than 300 ms apart are a double-tap (a zoom), so a person's pace between them
const pause = (page) => page.waitForTimeout(450);

// A click on the middle of a string's line (a curve's box centre may be off the line)
async function pressString(page, pair) {
  const point = await string(page, pair)
    .locator('[data-string-press]')
    .evaluate((path) => {
      const at = path.getPointAtLength(path.getTotalLength() / 2);
      const matrix = path.getScreenCTM();
      return { x: at.x * matrix.a + at.y * matrix.c + matrix.e, y: at.x * matrix.b + at.y * matrix.d + matrix.f };
    });
  await page.mouse.click(point.x, point.y);
}

// From the country list (the toolbar's stamp until 24 Nov 2026, the user's wish)
const openStrings = openStringsPanel;

// The seed ties the demo couple's places in the order first visited (19 strings); the tests that
// build strings from nothing take those off first
async function withNoStrings(page) {
  await page.evaluate((key) => {
    const db = JSON.parse(localStorage.getItem(key));
    db.mapStrings = db.mapStrings.filter((string) => string.mapId !== 'map-home');
    localStorage.setItem(key, JSON.stringify(db));
  }, MOCK_STORE_KEY);
  await page.reload();
  await mapReady(page);
}

test.describe('Strings between countries', () => {
  // 24 Nov 2026, the user's wish: the seed's places strung in the order first visited
  test('the seed ties each place to the one first visited before it', async ({ page }) => {
    await openMap(page);
    await expect(strings(page)).toHaveCount(19);
    for (const pair of ['GB-IE', 'IE-US', 'JO-MA', 'CU-MX', 'CU-IT', 'AT-IT']) await expect(string(page, pair)).toBeAttached();
  });

  test('string mode ties a string between two clicked countries, and a click takes it off', async ({ page }) => {
    await openMap(page);
    await withNoStrings(page);
    await expect(strings(page)).toHaveCount(0);
    const panel = await openStrings(page);
    await panel.getByRole('button', { name: 'Tie strings on the map' }).click();
    await expect(modeTag(page)).toBeVisible();
    await expect(modeTag(page).getByRole('status')).toHaveText('Click a country to start a string. Click a string to take it off.');

    await pressCountry(page, 'FR');
    await expect(page.locator('[data-string-start="FR"]')).toBeAttached();
    await expect(modeTag(page).getByRole('status')).toHaveText('From France: click the country to tie it to.');
    // String mode picks ends: no country's ticket opens
    await expect(page.getByRole('dialog', { name: 'France' })).toHaveCount(0);
    await pause(page);
    await pressCountry(page, 'JP');
    await expect(string(page, 'FR-JP')).toBeAttached();
    await expect(modeTag(page).getByRole('status')).toHaveText('Tied France to Japan.');
    await pause(page);
    await pressCountry(page, 'BR');
    await pause(page);
    await pressCountry(page, 'AU');
    await expect(string(page, 'AU-BR')).toBeAttached();

    // A click on a string takes it off
    await pause(page);
    await pressString(page, 'FR-JP');
    await expect(string(page, 'FR-JP')).toHaveCount(0);
    await expect(modeTag(page).getByRole('status')).toHaveText('String taken off.');

    // Done leaves string mode: a country opens its ticket again, and the strings stay
    await modeTag(page).getByRole('button', { name: 'Done' }).click();
    await expect(modeTag(page)).toHaveCount(0);
    await expect(string(page, 'AU-BR')).toBeAttached();
    await page.reload();
    await expect(string(page, 'AU-BR')).toBeAttached();
  });

  test('Escape leaves string mode, and so does another tool', async ({ page }) => {
    await openMap(page);
    const panel = await openStrings(page);
    await panel.getByRole('button', { name: 'Tie strings on the map' }).click();
    await expect(modeTag(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modeTag(page)).toHaveCount(0);
    await (await openStrings(page)).getByRole('button', { name: 'Tie strings on the map' }).click();
    await expect(modeTag(page)).toBeVisible();
    await pressTool(page, 'Country list');
    await expect(modeTag(page)).toHaveCount(0);
  });

  test('the panel adds them automatically, ties one from the lists, and takes them all off', async ({ page }) => {
    await openMap(page);
    await withNoStrings(page);
    const panel = await openStrings(page);
    await expect(panel.getByRole('heading', { name: 'No strings yet' })).toBeVisible();
    await panel.getByRole('button', { name: 'Add strings automatically' }).click();
    await expect(panel.getByText(/^Added \d+ strings from your trips and first visits\.$/)).toBeVisible();
    const added = await panel.locator('[data-string-item]').count();
    expect(added).toBeGreaterThan(1);
    await expect(strings(page)).toHaveCount(added);
    // Again adds nothing
    await panel.getByRole('button', { name: 'Add strings automatically' }).click();
    await expect(panel.getByText('Nothing new to add: your trips and first visits are already strung.')).toBeVisible();

    // From the keyboard's lists
    await openTab(panel).getByLabel('From', { exact: true }).selectOption('DE');
    await openTab(panel).getByLabel('To', { exact: true }).selectOption('IT');
    await panel.getByRole('button', { name: 'Tie this string' }).click();
    await expect(panel.getByText('Tied: Germany to Italy.')).toBeVisible();
    await expect(string(page, 'DE-IT')).toBeAttached();

    // One off from the list, then all of them, after asking
    await panel.getByRole('button', { name: 'Take off the string from Germany to Italy' }).click();
    await expect(string(page, 'DE-IT')).toHaveCount(0);
    await panel.getByRole('button', { name: 'Take every string off' }).click();
    await page.getByRole('dialog', { name: 'Take every string off?' }).getByRole('button', { name: 'Confirm' }).click();
    await expect(panel.getByRole('heading', { name: 'No strings yet' })).toBeVisible();
    await expect(strings(page)).toHaveCount(0);
  });

  test('the viewer can hide them, and string mode shows them anyway', async ({ page }) => {
    await openMap(page);
    await withNoStrings(page);
    const panel = await openStrings(page);
    await panel.getByRole('button', { name: 'Add strings automatically' }).click();
    await expect(panel.getByText(/^Added \d+ strings/)).toBeVisible();
    const added = await strings(page).count();
    await openTab(panel).getByLabel('Show visited strings on the map').uncheck();
    await expect(strings(page)).toHaveCount(0);
    await panel.getByRole('button', { name: 'Tie strings on the map' }).click();
    await expect(strings(page)).toHaveCount(added);
    await modeTag(page).getByRole('button', { name: 'Done' }).click();
    await expect(strings(page)).toHaveCount(0);
    // Kept as the viewer's setting
    await page.reload();
    await expect(page.locator('main svg[role="application"]')).toBeVisible();
    await expect(strings(page)).toHaveCount(0);
  });

  // Their colours are in the panel, each kind's in its tab (25 Nov 2026, the user's wish: "all in
  // one place"); Settings says so
  test('their colour is the map design’s, in the Strings panel', async ({ page }) => {
    await openMap(page);
    await withNoStrings(page);
    const panel = await openStrings(page);
    await panel.getByRole('button', { name: 'Add strings automatically' }).click();
    await expect(panel.getByText(/^Added \d+ strings/)).toBeVisible();
    await openTab(panel).getByLabel('String colour', { exact: true }).fill('#1d4ed8');
    const thread = strings(page).first().locator('path').first();
    await expect.poll(() => thread.evaluate((el) => getComputedStyle(el).stroke)).toBe('rgb(29, 78, 216)');
    await expect.poll(() => savedDesign(page, 'string')).toBe('#1d4ed8');
    const settings = await openTool(page, 'Map settings', 'Settings');
    await expect(settings.locator('[data-string-colours-moved]')).toHaveText('The strings’ colours are in the Strings panel, opened from the country list.');
    await expect(settings.getByLabel('String colour', { exact: true })).toHaveCount(0);
  });

  // See-through strings (25 Nov 2026, the user's wish): an opacity slider under the colour
  test('their colour can be see-through, and stays so', async ({ page }) => {
    await openMap(page);
    await withNoStrings(page);
    let panel = await openStrings(page);
    await panel.getByRole('button', { name: 'Add strings automatically' }).click();
    await expect(panel.getByText(/^Added \d+ strings/)).toBeVisible();
    let editor = openTab(panel);
    const opacity = editor.getByRole('slider', { name: 'String colour opacity' });
    await expect(opacity).toHaveValue('100');
    await expect(editor.locator('[data-colour-opacity] output')).toHaveText('100%');
    await editor.getByLabel('String colour', { exact: true }).fill('#1d4ed8');
    await opacity.fill('40');
    await expect(editor.locator('[data-colour-opacity] output')).toHaveText('40%');
    const thread = strings(page).first().locator('path').first();
    await expect.poll(() => thread.evaluate((el) => getComputedStyle(el).stroke)).toBe('rgba(29, 78, 216, 0.4)');
    await expect.poll(() => savedDesign(page, 'string')).toBe('#1d4ed866');

    // Saved with the map's design: the same after a reload
    await page.reload();
    await mapReady(page);
    await expect.poll(() => strings(page).first().locator('path').first().evaluate((el) => getComputedStyle(el).stroke)).toBe('rgba(29, 78, 216, 0.4)');
    panel = await openStrings(page);
    editor = openTab(panel);
    await expect(editor.getByRole('slider', { name: 'String colour opacity' })).toHaveValue('40');
    await expect(editor.getByLabel('String colour', { exact: true })).toHaveValue('#1d4ed8');
  });

  // Two colours twisted together, as baker's twine (25 Nov 2026, the user's wish)
  test('they can be two colours twisted together, each chosen, and one colour again', async ({ page }) => {
    await openMap(page);
    await withNoStrings(page);
    let panel = await openStrings(page);
    await panel.getByRole('button', { name: 'Add strings automatically' }).click();
    await expect(panel.getByText(/^Added \d+ strings/)).toBeVisible();
    let editor = openTab(panel);
    const string = strings(page).first();
    const strand = string.locator('[data-string-strand]').first();
    const thread = string.locator('path').first();
    // One colour to start with: the strands are there, hidden
    await expect(strand).toBeHidden();
    await expect(editor.getByLabel('Second string colour', { exact: true })).toHaveCount(0);

    // The box is drawn over its input: press its name
    await editor.getByText('Two tone string', { exact: true }).click();
    await expect(editor.getByRole('checkbox', { name: 'Two tone string' })).toBeChecked();
    await expect(strand).toBeVisible();
    await expect.poll(() => thread.evaluate((el) => getComputedStyle(el).strokeWidth)).toBe('3.6px');
    // Both colours from a picker
    await editor.getByLabel('String colour', { exact: true }).fill('#1d4ed8');
    await editor.getByLabel('Second string colour', { exact: true }).fill('#ffcc00');
    await expect.poll(() => strand.evaluate((el) => getComputedStyle(el).stroke)).toBe('rgb(255, 204, 0)');
    await expect.poll(() => thread.evaluate((el) => getComputedStyle(el).stroke)).toBe('rgb(29, 78, 216)');
    await expect.poll(() => savedDesign(page, 'stringTwist')).toBe('#ffcc00');
    // The opacity moved to the bottom, under the second colour (25 Nov 2026, the user's wish)
    const sliderBox = await editor.getByRole('slider', { name: 'String colour opacity' }).boundingBox();
    const secondBox = await editor.getByLabel('Second string colour', { exact: true }).boundingBox();
    expect(sliderBox.y).toBeGreaterThan(secondBox.y);

    // Saved with the map's design: the same after a reload
    await page.reload();
    await mapReady(page);
    await expect(strings(page).first().locator('[data-string-strand]').first()).toBeVisible();
    await expect.poll(() => strings(page).first().locator('[data-string-strand]').first().evaluate((el) => getComputedStyle(el).stroke)).toBe('rgb(255, 204, 0)');

    // Unticked, the strings are one colour again
    panel = await openStrings(page);
    editor = openTab(panel);
    await expect(editor.getByLabel('Second string colour', { exact: true })).toHaveValue('#ffcc00');
    await editor.getByText('Two tone string', { exact: true }).click();
    await expect(editor.getByLabel('Second string colour', { exact: true })).toHaveCount(0);
    await expect(strings(page).first().locator('[data-string-strand]').first()).toBeHidden();
    await expect.poll(() => strings(page).first().locator('path').first().evaluate((el) => getComputedStyle(el).strokeWidth)).toBe('1.8px');
  });

  test('a share link shows the strings, with no way to change them', async ({ page }) => {
    await openMap(page);
    const panel = await openStrings(page);
    await openTab(panel).getByLabel('From', { exact: true }).selectOption('FR');
    await openTab(panel).getByLabel('To', { exact: true }).selectOption('JP');
    await panel.getByRole('button', { name: 'Tie this string' }).click();
    await expect(string(page, 'FR-JP')).toBeAttached();
    // A planned one too, which a share link shows as well
    const planned = await showPlanned(panel);
    await planned.getByLabel('From', { exact: true }).selectOption('IS');
    await planned.getByLabel('To', { exact: true }).selectOption('JP');
    await planned.getByRole('button', { name: 'Tie this string' }).click();
    await expect(plannedString(page, 'IS-JP')).toBeAttached();
    await page.goto(`/shared/${HOME_SHARE_CODE}`);
    await expect(plannedString(page, 'IS-JP')).toBeAttached();
    await expect(string(page, 'FR-JP')).toBeAttached();
    await expect(toolbar(page).getByRole('button', { name: 'Strings', exact: true })).toHaveCount(0);
    const list = await openTool(page, 'Country list', 'Countries');
    await expect(list.getByRole('button', { name: 'Strings', exact: true })).toHaveCount(0);
  });

  test('the toolbar has no Strings stamp: the country list opens the panel', async ({ page }) => {
    await openMap(page);
    await expect(toolbar(page).getByRole('button', { name: 'Strings', exact: true })).toHaveCount(0);
    const panel = await openStrings(page);
    // The country list gave way to it
    await expect(page.getByRole('dialog', { name: 'Countries', exact: true })).toHaveCount(0);
    await expect(panel.getByRole('button', { name: 'Tie strings on the map' })).toBeVisible();
  });

  test('on a phone, Strings is in the country list and string mode works by tapping', { tag: '@phone' }, async ({ page }) => {
    test.skip(page.viewportSize().width >= 768, 'phone only');
    await openMap(page);
    const panel = await openStrings(page);
    await panel.getByRole('button', { name: 'Tie strings on the map' }).click();
    await expect(modeTag(page)).toBeVisible();
    await pressCountry(page, 'DZ', { touch: true });
    await expect(page.locator('[data-string-start="DZ"]')).toBeAttached();
    await pause(page);
    await pressCountry(page, 'CD', { touch: true });
    await expect(string(page, 'CD-DZ')).toBeAttached();
  });

  // 24 Nov 2026, the user's wish: a newly visited country is tied to the one visited before it
  test('a country marked visited is tied to the one visited before it, while the strings show', { tag: '@phone' }, async ({ page }) => {
    await openMap(page);
    await expect(strings(page)).toHaveCount(19);

    // From the country list: Germany, after Austria (the last visited, in March 2026)
    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('button', { name: 'Status for Germany: Not yet' }).click();
    const germany = list.getByRole('combobox', { name: 'Status for Germany' });
    await expect.poll(() => germany.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await germany.selectOption('Visited');
    await expect(string(page, 'AT-DE')).toBeAttached();

    // From its ticket: Egypt, after Germany
    await list.getByRole('heading', { name: 'Countries' }).click();
    await list.getByRole('button', { name: 'Egypt', exact: true }).click();
    const egypt = page.getByRole('dialog', { name: 'Egypt' });
    await egypt.getByRole('combobox', { name: 'Been there?' }).selectOption('Visited');
    await expect(string(page, 'DE-EG')).toBeAttached();
    await expect(strings(page)).toHaveCount(21);
    await egypt.getByRole('button', { name: /^Close/ }).first().click();

    // With the strings switched off, none is tied
    const settings = await openTool(page, 'Map settings', 'Settings');
    await settings.getByText('Strings between places visited', { exact: true }).click();
    await expect(settings.getByRole('switch', { name: 'Strings between places visited' })).not.toBeChecked();
    await settings.getByRole('button', { name: 'Close Settings' }).click();
    const again = await openTool(page, 'Country list', 'Countries');
    await again.getByRole('button', { name: 'Status for Kenya: Not yet' }).click();
    const kenya = again.getByRole('combobox', { name: 'Status for Kenya' });
    await expect.poll(() => kenya.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await kenya.selectOption('Visited');
    await again.getByRole('heading', { name: 'Countries' }).click();
    await expect(again.getByRole('button', { name: 'Status for Kenya: Visited' })).toBeVisible();
    await again.getByRole('button', { name: /^Close/ }).first().click();
    const back = await openTool(page, 'Map settings', 'Settings');
    await back.getByText('Strings between places visited', { exact: true }).click();
    await back.getByRole('button', { name: 'Close Settings' }).click();
    await expect(strings(page)).toHaveCount(21);
    await expect(string(page, 'EG-KE')).toHaveCount(0);
  });
});

// Planned strings (25 Nov 2026, the user's wish): the places planned strung in a colour of their
// own (blue to start with), in the Strings panel's "Planned" tab
test.describe('Planned strings', () => {
  test('the Planned tab adds them from the plans, ties one from the lists, and takes them off, the visited ones staying', async ({ page }) => {
    await openMap(page);
    await expect(strings(page)).toHaveCount(19);
    await expect(plannedStrings(page)).toHaveCount(0);
    const panel = await openStrings(page);
    const planned = await showPlanned(panel);
    await expect(planned.getByRole('heading', { name: 'No planned strings yet' })).toBeVisible();
    // The demo couple's planned trips and the places they want to go
    await planned.getByRole('button', { name: 'Add strings automatically' }).click();
    await expect(planned.getByText(/^Added \d+ strings? from your planned trips and the places you want to go\.$/)).toBeVisible();
    const added = await plannedStrings(page).count();
    expect(added).toBeGreaterThan(0);
    // Blue, the visited ones still red
    await expect.poll(() => plannedStrings(page).first().locator('path').first().evaluate((el) => getComputedStyle(el).stroke)).toBe('rgb(29, 78, 216)');
    await expect.poll(() => strings(page).first().locator('path').first().evaluate((el) => getComputedStyle(el).stroke)).toBe('rgb(200, 16, 46)');

    await planned.getByLabel('From', { exact: true }).selectOption('DE');
    await planned.getByLabel('To', { exact: true }).selectOption('IT');
    await planned.getByRole('button', { name: 'Tie this string' }).click();
    await expect(plannedString(page, 'DE-IT')).toBeAttached();
    await expect(string(page, 'DE-IT')).toHaveCount(0);

    await planned.getByRole('button', { name: 'Take every planned string off' }).click();
    await page.getByRole('dialog', { name: 'Take every planned string off?' }).getByRole('button', { name: 'Confirm' }).click();
    await expect(planned.getByRole('heading', { name: 'No planned strings yet' })).toBeVisible();
    await expect(plannedStrings(page)).toHaveCount(0);
    await expect(strings(page)).toHaveCount(19);
  });

  test('string mode ties planned strings between clicked countries, and takes only those off', async ({ page }) => {
    await openMap(page);
    const panel = await openStrings(page);
    await (await showPlanned(panel)).getByRole('button', { name: 'Tie strings on the map' }).click();
    await expect(modeTag(page)).toHaveAttribute('data-string-mode', 'PLANNED');
    await expect(modeTag(page)).toContainText('String mode: planned strings');
    await pressCountry(page, 'BR');
    await expect(page.locator('[data-string-start="BR"]')).toBeAttached();
    await pause(page);
    await pressCountry(page, 'AU');
    await expect(plannedString(page, 'AU-BR')).toBeAttached();
    // Only the planned strings can be taken off here
    await expect(page.locator('[data-string-kind="VISITED"] [data-string-press]')).toHaveCount(0);
    await pause(page);
    const point = await plannedString(page, 'AU-BR')
      .locator('[data-string-press]')
      .evaluate((path) => {
        const at = path.getPointAtLength(path.getTotalLength() / 2);
        const m = path.getScreenCTM();
        return { x: at.x * m.a + at.y * m.c + m.e, y: at.x * m.b + at.y * m.d + m.f };
      });
    await page.mouse.click(point.x, point.y);
    await expect(plannedString(page, 'AU-BR')).toHaveCount(0);
    await expect(strings(page)).toHaveCount(19);
  });

  test('a country marked “Want to go” is tied to the place wanted before it', { tag: '@phone' }, async ({ page }) => {
    await openMap(page);
    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('button', { name: 'Status for Canada: Not yet' }).click();
    const canada = list.getByRole('combobox', { name: 'Status for Canada' });
    await expect.poll(() => canada.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await canada.selectOption('Want to go');
    // One planned string, from one of the places wanted before it (Japan, Peru or Iceland)
    await expect(page.locator('[data-string-kind="PLANNED"][data-string*="CA"]')).toHaveCount(1);
    await expect(plannedStrings(page)).toHaveCount(1);
    // Then Chile, tied to Canada, the one wanted just before it
    await list.getByRole('searchbox', { name: 'Search countries' }).fill('chile');
    await list.getByRole('button', { name: 'Status for Chile: Not yet' }).click();
    const chile = list.getByRole('combobox', { name: 'Status for Chile' });
    await expect.poll(() => chile.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await chile.selectOption('Want to go');
    await expect(plannedString(page, 'CA-CL')).toBeAttached();
    // No visited string for a wish
    await expect(strings(page)).toHaveCount(19);
  });

  test('their own colours, in the Planned tab, and their own switch in Settings', async ({ page }) => {
    await openMap(page);
    const panel = await openStrings(page);
    const planned = await showPlanned(panel);
    await planned.getByRole('button', { name: 'Add strings automatically' }).click();
    await expect(planned.getByText(/^Added \d+ strings?/)).toBeVisible();
    await planned.getByLabel('String colour', { exact: true }).fill('#00aa00');
    await expect.poll(() => plannedStrings(page).first().locator('path').first().evaluate((el) => getComputedStyle(el).stroke)).toBe('rgb(0, 170, 0)');
    await expect.poll(() => strings(page).first().locator('path').first().evaluate((el) => getComputedStyle(el).stroke)).toBe('rgb(200, 16, 46)');
    await expect.poll(() => savedDesign(page, 'plannedString')).toBe('#00aa00');
    await panel.getByRole('button', { name: /^Close/ }).first().click();

    // Hidden with their own switch, the visited ones showing
    const settings = await openTool(page, 'Map settings', 'Settings');
    await settings.getByText('Strings between places planned', { exact: true }).click();
    await expect(settings.getByRole('switch', { name: 'Strings between places planned' })).not.toBeChecked();
    await expect(plannedStrings(page)).toHaveCount(0);
    await expect(strings(page)).toHaveCount(19);
  });
});
