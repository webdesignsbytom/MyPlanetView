import { test, expect, MOCK_STORE_KEY, openMap, openTool } from './fixtures.js';

// The tips the map opens with (MapTipsDialog, 17 Nov 2026): once a visit while the viewer's
// `showTips` setting is on; the dialog's box turns it off, Settings back on. The other
// tests start as if the tips had shown (fixtures.js `mapTips`).
test.use({ mapTips: true });

const tipsDialog = (page) => page.getByRole('dialog', { name: 'Tips', exact: true });

test.describe('Map tips', () => {
  test('they open with the map once a visit, and the box turns them off', { tag: '@phone' }, async ({ page }) => {
    await openMap(page);
    const tips = tipsDialog(page);
    await expect(tips).toBeVisible();

    // A phone hears first that the site installs as an app (here from the browser's menu: in
    // development the browser makes no offer of its own), then about full screen (the menu's
    // Full screen: Chromium has it); a wide screen hears neither
    const phone = page.viewportSize().width < 768;
    const install = tips.getByRole('heading', { name: 'Install the app', exact: true });
    const fullScreen = tips.getByRole('heading', { name: 'Full screen', exact: true });
    if (phone) {
      await expect(install).toBeVisible();
      await expect(tips).toContainText('works as an app on your phone, with no app store needed');
      await expect(tips).toContainText('choose Install app or Add to Home screen');
      await expect(fullScreen).toBeVisible();
      await expect(tips).toContainText('Open the Menu and choose Full screen');
      await expect(tips).toContainText('Tap a country to open its ticket');
    } else {
      await expect(install).toHaveCount(0);
      await expect(fullScreen).toHaveCount(0);
      await expect(tips).toContainText('Click a country to open its ticket');
    }

    // Closed, they don't come back in the same visit
    await tips.getByRole('button', { name: 'Got it', exact: true }).click();
    await expect(tips).toBeHidden();
    await openMap(page);
    // (A tool opens and shuts: the tips would be over the map by then, and in its way)
    const stats = await openTool(page, 'Travel statistics', 'Travel statistics');
    await stats.getByRole('button', { name: /^Close/ }).first().click();
    await expect(tipsDialog(page)).toHaveCount(0);

    // A new visit (a fresh tab's session) brings them back, until the box is ticked
    await page.evaluate(() => sessionStorage.clear());
    await openMap(page);
    await expect(tips).toBeVisible();
    await tips.getByRole('checkbox', { name: 'Don’t show these tips again' }).check();
    await expect
      .poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null')?.mapSettings?.showTips, MOCK_STORE_KEY))
      .toBe(false);
    await tips.getByRole('button', { name: 'Got it', exact: true }).click();

    await page.evaluate(() => sessionStorage.clear());
    await openMap(page);
    await expect(tipsDialog(page)).toHaveCount(0);

    // Settings turns them back on
    const settings = await openTool(page, 'Map settings', 'Settings');
    const tipsSwitch = settings.getByRole('switch', { name: 'Tips when the map opens' });
    await expect(tipsSwitch).not.toBeChecked();
    await settings.getByText('Tips when the map opens', { exact: true }).click();
    await expect(tipsSwitch).toBeChecked();
  });
});
