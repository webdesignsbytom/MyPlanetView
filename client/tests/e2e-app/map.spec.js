import { test, expect, HOME_MAP, MOCK_STORE_KEY, REGION_COUNT, expectStats, openMap, openStats, openTool, pressCountry, showsBanner, showTools, toolbar } from './fixtures.js';

test.describe('The map page', () => {
  test('opens the default map with its stats', { tag: '@phone' }, async ({ page }) => {
    await openMap(page);
    await expect(page).toHaveTitle(new RegExp(HOME_MAP.replace(/[&']/g, '.')));
    await expect(page.getByRole('heading', { level: 1, name: HOME_MAP })).toBeAttached();
    // Wide screens show the map's name on the banner, top centre; there's no title tag on any
    // screen ("Your maps" opens from the toolbar)
    if (showsBanner(page)) await expect(page.getByRole('region', { name: 'Map banner' })).toContainText(HOME_MAP);
    else await expect(page.getByRole('region', { name: 'Map banner' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /\. Switch map$/ })).toHaveCount(0);
    await expectStats(page, '8 countries, 2 continents, 16 photos');

    // The owner's tools, every one on every screen: a column of stamps on wide screens; on a
    // phone a "Menu" button at the top right that drops them all, with their names
    // (MapToolbar, 16 Nov 2026: the bottom row went, and with it the three it had no room for)
    const wide = page.viewportSize().width >= 768;
    const tools = [
      'Home page',
      'Your maps',
      'Travel statistics',
      'Country list',
      'Trips',
      'Timeline',
      'Badges and goals',
      'Photo album',
      'Share this map',
      'Map settings',
    ];
    const menu = toolbar(page).getByRole('button', { name: 'Menu', exact: true });
    if (!wide) {
      await expect(menu).toHaveAttribute('aria-expanded', 'false');
      // Top right, and nothing along the bottom
      const box = await menu.boundingBox();
      expect(box.x + box.width).toBeGreaterThan(page.viewportSize().width - 40);
      expect(box.y).toBeLessThan(40);
      await expect(toolbar(page).getByRole('button', { name: 'Country list', exact: true })).toBeHidden();
    } else await expect(menu).toBeHidden();
    await showTools(page);
    for (const label of tools) await expect(toolbar(page).getByRole('button', { name: label, exact: true })).toBeVisible();
    // The phone's menu writes the counts under the statistics, and shuts with Escape, focus
    // back on its button
    if (!wide) {
      await expect(toolbar(page).getByRole('button', { name: /^Travel statistics/ })).toContainText('8 countries, 2 continents, 16 photos');
      await page.keyboard.press('Escape');
      await expect(menu).toHaveAttribute('aria-expanded', 'false');
      await expect(menu).toBeFocused();
    }

    // The stats panel opens from its stamp, or the menu
    await openStats(page);
    const stats = page.getByRole('dialog', { name: 'Travel statistics' });
    await expect(stats).toBeVisible();
    // Countries, continents (of 7), special places (of 5), regions (of every region), photos, landmarks (stamped: confirmed
    // matches, the owner counting the one on a hidden photo too), trips
    // Then how far (docs/API.md "Stats"): the share of the world, the days away on "Italian summer"
    // (2 to 16 July 2025), the longest trip (23 Nov 2026), the distance home and back, the
    // furthest place from the UK
    await expect(stats.getByRole('definition')).toHaveText([
      '8',
      '3.5%',
      '8 of 226 countries',
      '2 of 7',
      '0 of 5',
      `0 of ${REGION_COUNT}`,
      '16',
      '13 of 1,366',
      '10 of 1,273',
      '3',
      '15', 'On completed trips', '15 days', 'Italian summer', '27,300 km', 'About 17,000 miles', 'United States', 'About 7,000 km from the United Kingdom',
    ]);
    await expect(stats.getByRole('region', { name: 'Each traveller, from completed trips' }).getByRole('listitem')).toHaveText([
      /Charlie\s*1 country · 15 days/,
      /Alex\s*1 country · 15 days/,
    ]);
  });

  test('a country pressed on the map is marked visited, then wanted, then cleared', { tag: '@phone' }, async ({ page, hasTouch }) => {
    await openMap(page);
    const germany = page.locator('[data-code="DE"]');
    await expect(germany).toHaveAttribute('data-been', 'false');
    // The goal tag comes with the badges, under the title (on a phone, folded behind its flag,
    // still over the map): press once it's there, or the press can land on it
    const wide = page.viewportSize().width >= 768;
    await expect(page.getByRole('button', wide ? { name: /^Next goal:/ } : { name: 'Next goal', exact: true })).toBeVisible();

    await pressCountry(page, 'DE', { touch: hasTouch });
    const panel = page.getByRole('dialog', { name: 'Germany' });
    await expect(panel).toBeVisible();
    await expect(panel.getByText('Europe', { exact: true })).toBeVisible();
    await expect(panel.getByText('No photos from Germany yet.')).toBeVisible();
    const status = panel.getByRole('combobox', { name: 'Been there?' });
    await expect(status).toHaveValue('');

    await status.selectOption('Visited');
    await expectStats(page, '9 countries, 2 continents, 16 photos');
    await expect(germany).toHaveAttribute('data-been', 'true');
    await expect(panel.getByLabel('First went')).toBeVisible();

    // The country list agrees
    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('searchbox', { name: 'Search countries' }).fill('germ');
    await expect(list.getByRole('button', { name: 'Status for Germany: Visited' })).toBeVisible();

    // Its name in the list opens it again: want to go
    await list.getByRole('button', { name: 'Germany', exact: true }).click();
    const again = page.getByRole('dialog', { name: 'Germany' });
    await again.getByRole('combobox', { name: 'Been there?' }).selectOption('Want to go');
    await expectStats(page, '8 countries, 2 continents, 16 photos');
    await expect(germany).toHaveAttribute('data-been', 'false');
    await expect(again.getByLabel('First went')).toHaveCount(0);

    // Cleared
    await again.getByRole('combobox', { name: 'Been there?' }).selectOption('Not yet');
    await expect(again.getByRole('combobox', { name: 'Been there?' })).toHaveValue('');
    const listAgain = await openTool(page, 'Country list', 'Countries');
    await listAgain.getByRole('searchbox', { name: 'Search countries' }).fill('germ');
    await expect(listAgain.getByRole('button', { name: 'Status for Germany: Not yet' })).toBeVisible();
    await expectStats(page, '8 countries, 2 continents, 16 photos');

    // Kept: a reload shows the same
    await page.reload();
    await expectStats(page, '8 countries, 2 continents, 16 photos');
  });

  test('the stub’s dropdown and date are a step slimmer than the same fields elsewhere', { tag: '@phone' }, async ({ page }) => {
    await openMap(page);
    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('searchbox', { name: 'Search countries' }).fill('spain');
    await list.getByRole('button', { name: 'Spain', exact: true }).click();
    const panel = page.getByRole('dialog', { name: 'Spain' });
    const status = panel.getByRole('combobox', { name: 'Been there?' });
    const date = panel.getByLabel('First went');
    await expect(date).toBeVisible();
    const padding = (field) => field.evaluate((el) => [getComputedStyle(el).paddingTop, getComputedStyle(el).paddingBottom]);
    // In the stub from md up (py-1); at the head of the content on a phone, as everywhere else (py-2)
    const inStub = (await panel.locator('aside [data-status-controls]').count()) > 0;
    const expected = inStub ? ['4px', '4px'] : ['8px', '8px'];
    expect(await padding(status)).toEqual(expected);
    expect(await padding(date)).toEqual(expected);
    expect(inStub).toBe(page.viewportSize().width >= 768);
  });

  test('the country list filters, searches and sets statuses', { tag: '@phone' }, async ({ page }) => {
    await openMap(page);
    const list = await openTool(page, 'Country list', 'Countries');
    // Every country, special place and region showing
    await expect(list.getByText(/^(\d+) of \1 countries, (\d+) of \2 special places, (\d+) of \3 regions$/)).toBeVisible();

    const show = list.getByRole('combobox', { name: 'Show' });
    await show.selectOption('Visited');
    await expect(list.getByText(/^6 of \d+ countries, 0 of \d+ special places, 0 of \d+ regions$/)).toBeVisible();
    for (const name of ['France', 'Spain', 'Italy', 'Portugal', 'Netherlands']) {
      await expect(list.getByRole('button', { name: `Status for ${name}: Visited` })).toBeVisible();
    }
    await show.selectOption('Want to go');
    await expect(list.getByText(/^3 of \d+ countries, 0 of \d+ special places, 0 of \d+ regions$/)).toBeVisible();
    await expect(list.getByRole('button', { name: 'Status for Japan: Want to go' })).toBeVisible();

    await show.selectOption('All places');
    await list.getByRole('searchbox', { name: 'Search countries' }).fill('braz');
    await expect(list.getByText(/^1 of \d+ countries, 0 of \d+ special places, 0 of \d+ regions$/)).toBeVisible();

    // The row's button turns into the real dropdown, focused and opened (a customizable
    // select: focus is then on its chosen option, inside it)
    await list.getByRole('button', { name: 'Status for Brazil: Not yet' }).click();
    const select = list.getByRole('combobox', { name: 'Status for Brazil' });
    await expect.poll(() => select.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await select.selectOption('Lived there');
    await expectStats(page, '9 countries, 3 continents, 16 photos');
    // Leaving it turns it back into a button showing the new status
    await list.getByRole('heading', { name: 'Countries' }).click();
    await expect(list.getByRole('button', { name: 'Status for Brazil: Lived there' })).toBeVisible();

    await list.getByRole('searchbox', { name: 'Search countries' }).fill('');
    await show.selectOption('Lived there');
    await expect(list.getByText(/^3 of \d+ countries, 0 of \d+ special places, 0 of \d+ regions$/)).toBeVisible();
    await expect(list.getByRole('button', { name: /^Status for (United Kingdom|Ireland|Brazil): Lived there$/ })).toHaveCount(3);
  });
});

test.describe('Map settings', () => {
  test('the style and a switch are saved to the profile and kept after a reload', async ({ page }) => {
    await openMap(page);
    const mapFrame = page.locator('[data-map-style]:has(#main-content)');
    await expect(mapFrame).toHaveAttribute('data-map-style', 'animated');

    const settings = await openTool(page, 'Map settings', 'Settings');
    await expect(settings.getByRole('tab', { name: 'How it looks' })).toHaveAttribute('aria-selected', 'true');
    // The radios are hidden inside picture cards: press the card's name
    await settings.getByText('Old map', { exact: true }).click();
    await expect(settings.getByRole('radio', { name: 'Old map' })).toBeChecked();
    await expect(mapFrame).toHaveAttribute('data-map-style', 'old-map');

    const grid = settings.getByRole('switch', { name: 'Latitude and longitude lines' });
    await expect(grid).toBeChecked();
    await settings.getByText('Latitude and longitude lines', { exact: true }).click();
    await expect(grid).not.toBeChecked();
    // Its labels need the lines
    await expect(settings.getByRole('switch', { name: 'Label the lines' })).toBeDisabled();

    // Saved to the profile a moment later (the mock's store), then this browser's own copy
    // is dropped, so the reload can only get them from the profile
    await expect
      .poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null')?.mapSettings, MOCK_STORE_KEY))
      .toMatchObject({ style: 'old-map', showGrid: false });
    await page.evaluate(() => localStorage.removeItem('myPlanetViewMapSettings'));
    await page.reload();

    await expect(mapFrame).toHaveAttribute('data-map-style', 'old-map');
    const reopened = await openTool(page, 'Map settings', 'Settings');
    await expect(reopened.getByRole('radio', { name: 'Old map' })).toBeChecked();
    await expect(reopened.getByRole('switch', { name: 'Latitude and longitude lines' })).not.toBeChecked();
  });
});

test.describe('Keyboard', () => {
  test('a panel opens from its stamp, closes with Escape and gives focus back', async ({ page }) => {
    await openMap(page);
    const stamp = toolbar(page).getByRole('button', { name: 'Travel statistics', exact: true });
    await stamp.focus();
    await page.keyboard.press('Enter');

    const panel = page.getByRole('dialog', { name: 'Travel statistics' });
    await expect(panel.getByRole('heading', { name: 'Travel statistics' })).toBeFocused();
    await expect(stamp).toHaveAttribute('aria-pressed', 'true');

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(stamp).toBeFocused();
    await expect(stamp).toHaveAttribute('aria-pressed', 'false');
  });

  test('a country opened from the list hands focus back to the list’s stamp', async ({ page }) => {
    await openMap(page);
    const stamp = toolbar(page).getByRole('button', { name: 'Country list', exact: true });
    await stamp.focus();
    await page.keyboard.press('Enter');
    const list = page.getByRole('dialog', { name: 'Countries' });
    await expect(list.getByRole('heading', { name: 'Countries' })).toBeFocused();

    await list.getByRole('searchbox', { name: 'Search countries' }).fill('iceland');
    await list.getByRole('button', { name: 'Iceland', exact: true }).focus();
    await page.keyboard.press('Enter');
    const country = page.getByRole('dialog', { name: 'Iceland' });
    await expect(country.getByRole('heading', { name: 'Iceland' })).toBeFocused();
    await expect(country.getByRole('combobox', { name: 'Been there?' })).toHaveValue('WANT_TO_GO');

    await page.keyboard.press('Escape');
    await expect(country).toBeHidden();
    await expect(stamp).toBeFocused();
  });

  test('Escape in an open status dropdown closes only the dropdown', async ({ page }) => {
    await openMap(page);
    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('searchbox', { name: 'Search countries' }).fill('chile');
    await list.getByRole('button', { name: 'Status for Chile: Not yet' }).focus();
    await page.keyboard.press('Enter');
    const select = list.getByRole('combobox', { name: 'Status for Chile' });
    await expect.poll(() => select.evaluate((el) => el.matches(':open'))).toBe(true);

    await page.keyboard.press('Escape');
    await expect.poll(() => select.evaluate((el) => el.matches(':open'))).toBe(false);
    await expect(list).toBeVisible();

    // Leaving the dropdown, a second Escape closes the panel
    await list.getByRole('heading', { name: 'Countries' }).focus();
    await page.keyboard.press('Escape');
    await expect(list).toBeHidden();
  });

  test('the settings tabs follow the arrow keys', async ({ page }) => {
    await openMap(page);
    const settings = await openTool(page, 'Map settings', 'Settings');
    const looks = settings.getByRole('tab', { name: 'How it looks' });
    const thisMap = settings.getByRole('tab', { name: 'This map' });
    await looks.focus();
    await page.keyboard.press('ArrowRight');
    await expect(thisMap).toBeFocused();
    await expect(thisMap).toHaveAttribute('aria-selected', 'true');
    await expect(settings.getByRole('tabpanel', { name: 'This map' }).getByRole('textbox', { name: 'Map name' })).toHaveValue(HOME_MAP);
    await page.keyboard.press('Home');
    await expect(looks).toBeFocused();
    await expect(settings.getByRole('tabpanel', { name: 'How it looks' })).toBeVisible();
  });
});
