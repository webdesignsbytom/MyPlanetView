import { test, expect, HOME_MAP, expectMapOpen, openMap, openSwitcher, openTool, openUploader, toolbar } from './fixtures.js';

// Map features no other test reaches: the keyboard hint (the map's focus indicator, shown only
// when Tab brings focus to it), the Black and white style, the country list's A–Z letters
// and its "Special places" stamp, choosing the main map, and the uploader's way to First Class.

const worldMap = (page) => page.getByRole('application', { name: /: world map$/ });
const viewBoxOf = (page) => worldMap(page).evaluate((svg) => svg.getAttribute('viewBox').split(/\s+/).map(Number));

/** Press Tab until the world map has the focus (as a keyboard user reaches it). */
async function tabToMap(page) {
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press('Tab');
    if (await worldMap(page).evaluate((svg) => document.activeElement === svg)) return;
  }
  throw new Error('Tab never reached the map');
}

/** A point on screen where the map shows only sea (no country under it). */
const seaPoint = (page) =>
  worldMap(page).evaluate((svg) => {
    const box = svg.getBoundingClientRect();
    for (let fy = 0.3; fy < 0.8; fy += 0.05) {
      for (let fx = 0.02; fx < 0.5; fx += 0.02) {
        const x = box.left + box.width * fx;
        const y = box.top + box.height * fy;
        const hit = document.elementFromPoint(x, y);
        if (hit && svg.contains(hit) && !hit.closest('[data-code], a, button')) return { x, y };
      }
    }
    return null;
  });

async function openThisMapSettings(page) {
  const settings = await openTool(page, 'Map settings', 'Settings');
  await settings.getByRole('tab', { name: 'This map' }).click();
  return settings.getByRole('tabpanel', { name: 'This map' });
}

test('reached by Tab, the map shows how to move it from the keyboard; a click hides that', async ({ page }) => {
  await openMap(page);
  const hint = page.locator(`#${await worldMap(page).getAttribute('aria-describedby')}`);
  await expect(hint).toContainText('use the arrow keys, to move the map. Plus and minus zoom');
  await expect(hint).toHaveCSS('opacity', '0');

  await tabToMap(page);
  await expect(hint).toHaveCSS('opacity', '1');
  // No ring round the map: the hint is its focus indicator
  await expect(worldMap(page)).toHaveCSS('outline-style', 'none');

  // The keys move and zoom it
  const start = await viewBoxOf(page);
  await page.keyboard.press('ArrowRight');
  await expect.poll(async () => (await viewBoxOf(page))[0]).not.toBe(start[0]);
  await page.keyboard.press('+');
  await expect.poll(async () => (await viewBoxOf(page))[2]).toBeLessThan(start[2]);
  await page.keyboard.press('0');
  await expect.poll(() => viewBoxOf(page)).toEqual(start);

  // A press on the map marks the focus as the pointer's: keys after it show no hint
  const sea = await seaPoint(page);
  expect(sea, 'a point of open sea').not.toBeNull();
  await page.mouse.click(sea.x, sea.y);
  await expect(worldMap(page)).toHaveAttribute('data-pointer-focus', '');
  await page.keyboard.press('ArrowLeft');
  await expect(hint).toHaveCSS('opacity', '0');
});

test('Black and white turns the page grey, stays after a reload, and the World map brings the colour back', async ({ page }) => {
  await openMap(page);
  const html = page.locator('html');
  await expect(html).not.toHaveAttribute('data-mono', /.*/);
  const settings = await openTool(page, 'Map settings', 'Settings');
  await settings.getByText('Black and white', { exact: true }).click();
  await expect(settings.getByRole('radio', { name: 'Black and white' })).toBeChecked();
  await expect(page.locator('[data-map-style]:has(#main-content)')).toHaveAttribute('data-map-style', 'mono');
  // Every colour token goes grey (index.css :root[data-mono]), and what's round the map is filtered
  await expect(html).toHaveAttribute('data-mono', '');
  const toolbarFilter = () =>
    toolbar(page).evaluate((el) => {
      let box = el;
      while (box.parentElement && !box.parentElement.hasAttribute('data-mono-map')) box = box.parentElement;
      return getComputedStyle(box).filter;
    });
  await expect.poll(toolbarFilter).toBe('grayscale(1)');
  // The panels are grey through the tokens, unfiltered, so the map style picker's pictures of
  // the other styles keep their colours (25 Nov 2026, the user's wish); Black and white's own is grey
  await expect(page.locator('[data-map-panels]')).toHaveCSS('filter', 'none');
  for (const style of ['animated', 'old-map', 'starry']) {
    await expect(settings.locator(`label[data-map-style="${style}"] img`)).toHaveCSS('filter', 'none');
  }
  await expect(settings.locator('label[data-map-style="mono"] img')).toHaveCSS('filter', 'grayscale(1)');

  await settings.getByRole('button', { name: /^Close/ }).first().click();
  // Any other picture in a panel is still grey: a country's poster on its ticket
  const list = await openTool(page, 'Country list', 'Countries');
  await list.getByRole('button', { name: 'France', exact: true }).click();
  const poster = page.getByRole('dialog', { name: 'France' }).locator('img').first();
  await expect(poster).toHaveCSS('filter', 'grayscale(1)');
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(worldMap(page)).toBeVisible();
  await expect(html).toHaveAttribute('data-mono', '');

  const again = await openTool(page, 'Map settings', 'Settings');
  await again.getByText('World map', { exact: true }).click();
  await expect(html).not.toHaveAttribute('data-mono', /.*/);
  await expect(page.locator('[data-map-style]:has(#main-content)')).toHaveAttribute('data-map-style', 'animated');
});

// 25 Nov 2026, the user's wish and artwork: a fifth style, the World map's countries on an
// engraving of swirling waves
test('the Engraved ocean draws the World map’s countries on its waves, and stays after a reload', async ({ page }) => {
  await openMap(page);
  const frame = page.locator('[data-map-style]:has(#main-content)');
  const settings = await openTool(page, 'Map settings', 'Settings');
  await expect(settings.locator('label[data-map-style]')).toHaveCount(5);
  await settings.getByText('Engraved ocean', { exact: true }).click();
  await expect(settings.getByRole('radio', { name: 'Engraved ocean' })).toBeChecked();
  await expect(frame).toHaveAttribute('data-map-style', 'engraved');
  await settings.getByRole('button', { name: /^Close/ }).first().click();

  const waves = frame.locator('picture img').first();
  await expect.poll(() => waves.evaluate((img) => img.complete && img.currentSrc)).toContain('engraved-ocean');
  // The countries keep the World map's colours; the paperwork keeps its own
  const tokens = () =>
    frame.evaluate((el) => ['--map-land', '--map-visit-1', '--map-visit-7', '--map-land-edge'].map((name) => getComputedStyle(el).getPropertyValue(name).trim()));
  expect(await tokens()).toEqual(['#f4f1e8', '#f0f038', '#da92be', '#b91c1c']);
  await expect(page.locator('html')).not.toHaveAttribute('data-mono', /.*/);

  await page.reload();
  await expect(worldMap(page)).toBeVisible();
  await expect(frame).toHaveAttribute('data-map-style', 'engraved');
});

// 25 Nov 2026, the user's wish: Settings turns the map key off. Phones show no key, so no switch
test('the map key can be switched off in the map settings; phones have neither', { tag: '@phone' }, async ({ page }) => {
  await openMap(page);
  const key = page.getByRole('list', { name: 'Map key' });
  const settings = await openTool(page, 'Map settings', 'Settings');
  const keySwitch = settings.getByRole('switch', { name: 'Map key' });
  if (page.viewportSize().width < 768) {
    await expect(key).toBeHidden();
    await expect(keySwitch).toBeHidden();
    return;
  }
  await expect(keySwitch).toBeChecked();
  // The switch is drawn over its input: press its name
  await settings.getByText('Map key', { exact: true }).click();
  await expect(keySwitch).not.toBeChecked();
  await settings.getByRole('button', { name: /^Close/ }).first().click();
  await expect(worldMap(page)).toBeVisible();
  await expect(key).toHaveCount(0);
  await page.reload();
  await expect(worldMap(page)).toBeVisible();
  await expect(key).toHaveCount(0);

  const again = await openTool(page, 'Map settings', 'Settings');
  await again.getByText('Map key', { exact: true }).click();
  await again.getByRole('button', { name: /^Close/ }).first().click();
  await expect(key).toBeVisible();
});

test('the country list runs A to Z under index letters, and its stamp jumps to the special places', { tag: '@phone' }, async ({ page }) => {
  await openMap(page);
  const list = await openTool(page, 'Country list', 'Countries');
  const headings = await list.getByRole('heading', { level: 3 }).allTextContents();
  const letters = headings.filter((text) => /^[A-Z]$/.test(text));
  expect(letters[0]).toBe('A');
  expect(letters).toContain('Z');
  expect(letters).toEqual([...letters].sort());
  // The letters, then the special places and the regions
  expect(headings.slice(letters.length)).toEqual(['Special places', 'Regions']);
  await expect(list.getByRole('region', { name: 'A', exact: true })).toContainText('Afghanistan');
  // An index letter stays at the top while its countries scroll under it
  await expect(list.getByRole('heading', { level: 3, name: 'A', exact: true })).toHaveCSS('position', 'sticky');
  // Côte d'Ivoire is a C (accents folded)
  await expect(list.getByRole('region', { name: 'C', exact: true })).toContainText("Côte d'Ivoire");

  const special = list.getByRole('heading', { level: 3, name: 'Special places' });
  await expect(special).not.toBeInViewport();
  await list.getByRole('button', { name: 'Special places' }).click();
  await expect(special).toBeFocused();
  await expect(special).toBeInViewport();
  const places = list.getByRole('region', { name: 'Special places' });
  for (const name of ['Antarctica', 'North Pole', 'South Pole']) await expect(places).toContainText(name);

  // A search keeps only the letters with a match; with no special place shown, no stamp
  await list.getByRole('searchbox', { name: 'Search countries' }).fill('land');
  await expect(list.getByRole('region', { name: 'A', exact: true })).toHaveCount(0);
  await expect(list.getByRole('region', { name: 'F', exact: true })).toContainText('Finland');
  await expect(list.getByRole('button', { name: 'Special places' })).toHaveCount(0);
  await list.getByRole('searchbox', { name: 'Search countries' }).fill('');
  await list.getByRole('combobox', { name: 'Show' }).selectOption('Visited');
  await expect(list.getByRole('button', { name: 'Special places' })).toHaveCount(0);
});

test('another map is made the main map, and /map opens it', async ({ page }) => {
  await openMap(page);
  // The main map has no such choice
  const home = await openThisMapSettings(page);
  await expect(home.getByRole('button', { name: 'Make this my main map' })).toHaveCount(0);
  await page.keyboard.press('Escape');

  const switcher = await openSwitcher(page);
  await switcher.getByRole('button', { name: 'New map' }).click();
  await switcher.getByText('Just me', { exact: true }).click();
  await switcher.getByRole('textbox', { name: 'Map name' }).fill('Road trips');
  await switcher.getByRole('button', { name: 'Create map' }).click();
  await expectMapOpen(page, 'Road trips');

  const settings = await openThisMapSettings(page);
  const main = settings.getByRole('region', { name: 'Main map' });
  await expect(main).toContainText('Make “Road trips” your main map, and your current main map takes its place.');
  await main.getByRole('button', { name: 'Make this my main map' }).click();
  // Now the main map: no such choice, and it can't be deleted
  await expect(settings.getByRole('region', { name: 'Main map' })).toHaveCount(0);
  await expect(settings.getByRole('button', { name: 'Delete map' })).toHaveCount(0);

  await openMap(page, '/map');
  await expectMapOpen(page, 'Road trips');
  // The old main map can be made the main one again
  await openMap(page, '/maps/map-home');
  await expectMapOpen(page, HOME_MAP);
  const old = await openThisMapSettings(page);
  await expect(old.getByRole('button', { name: 'Make this my main map' })).toBeVisible();
});

test('the uploader’s “Upgrade to First Class” opens the plan on the account page', async ({ page }) => {
  await openMap(page);
  const panel = await openUploader(page);
  await panel.getByRole('link', { name: 'Upgrade to First Class' }).click();
  await expect(page).toHaveURL(/\/account#account-plan-heading$/);
  const heading = page.getByRole('heading', { name: 'Your plan', exact: true });
  await expect(heading).toBeInViewport();
  await expect(page.getByRole('region', { name: 'Your plan' }).getByRole('button', { name: 'Upgrade to First Class' })).toBeVisible();
});
