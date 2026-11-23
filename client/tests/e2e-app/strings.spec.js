// Strings between places (docs/API.md "Strings"; 23 Nov 2026, the user's wish): red thread
// pin to pin, like a corkboard map. String mode ties one between two countries clicked on
// the map and takes one off with a click; the Strings panel adds them automatically, ties them
// from two lists and takes them off; the viewer can hide them; the map design sets their
// colour; a share link shows them.
import { test, expect, HOME_SHARE_CODE, openMap, openTool, pressCountry, pressTool, toolbar } from './fixtures.js';

const string = (page, pair) => page.locator(`[data-string="${pair}"]`);
const strings = (page) => page.locator('[data-string]');
const modeTag = (page) => page.locator('[data-string-mode]');
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

async function openStrings(page) {
  return openTool(page, 'Strings', 'Strings');
}

test.describe('Strings between countries', () => {
  test('string mode ties a string between two clicked countries, and a click takes it off', async ({ page }) => {
    await openMap(page);
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
    await panel.getByLabel('From').selectOption('DE');
    await panel.getByLabel('To').selectOption('IT');
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
    const panel = await openStrings(page);
    await panel.getByRole('button', { name: 'Add strings automatically' }).click();
    await expect(panel.getByText(/^Added \d+ strings/)).toBeVisible();
    const added = await strings(page).count();
    await panel.getByLabel('Show strings on the map').uncheck();
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

  test('their colour is the map design’s, in Settings', async ({ page }) => {
    await openMap(page);
    const panel = await openStrings(page);
    await panel.getByRole('button', { name: 'Add strings automatically' }).click();
    await expect(panel.getByText(/^Added \d+ strings/)).toBeVisible();
    await expect(panel.locator('[data-string-colour-note]')).toContainText('“String colour”');
    const settings = await openTool(page, 'Map settings', 'Settings');
    await settings.locator('[data-map-design-editor]').getByLabel('String colour', { exact: true }).fill('#1d4ed8');
    const thread = strings(page).first().locator('path').first();
    await expect.poll(() => thread.evaluate((el) => getComputedStyle(el).stroke)).toBe('rgb(29, 78, 216)');
  });

  test('a share link shows the strings, with no way to change them', async ({ page }) => {
    await openMap(page);
    const panel = await openStrings(page);
    await panel.getByLabel('From').selectOption('FR');
    await panel.getByLabel('To').selectOption('JP');
    await panel.getByRole('button', { name: 'Tie this string' }).click();
    await expect(string(page, 'FR-JP')).toBeAttached();
    await page.goto(`/shared/${HOME_SHARE_CODE}`);
    await expect(string(page, 'FR-JP')).toBeAttached();
    await expect(toolbar(page).getByRole('button', { name: 'Strings', exact: true })).toHaveCount(0);
  });

  test('on a phone, Strings is in the menu and string mode works by tapping', { tag: '@phone' }, async ({ page }) => {
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
});
