import { test, expect, MOCK_STORE_KEY, openMap, openTool, openTipsFromSettings } from './fixtures.js';

// The tips the map opens with (MapTipsDialog, 17 Nov 2026): once a visit while the viewer's
// `showTips` setting is on; the dialog's box turns it off, Settings back on. One tip at a
// time with Previous and Next, and Settings' "Show the tips" opens them any time (23 Nov 2026; a "Tips" stamp until 24 Nov). The
// other tests start as if the tips had shown (fixtures.js `mapTips`).
test.use({ mapTips: true });

const tipsDialog = (page) => page.getByRole('dialog', { name: 'Tips', exact: true });
const tipHeading = (tips) => tips.locator('[data-tip] h3');

test.describe('Map tips', () => {
  test('they open with the map once a visit, one at a time, and the box turns them off', { tag: '@phone' }, async ({ page }) => {
    await openMap(page);
    const tips = tipsDialog(page);
    await expect(tips).toBeVisible();

    // A phone hears first that the site installs as an app (here from the browser's menu: in
    // development the browser makes no offer of its own), then about full screen (the menu's
    // Full screen: Chromium has it); a wide screen hears neither, and starts with countries
    const phone = page.viewportSize().width < 768;
    const next = tips.getByRole('button', { name: 'Next tip', exact: true });
    const previous = tips.getByRole('button', { name: 'Previous tip', exact: true });
    await expect(previous).toBeDisabled();
    if (phone) {
      await expect(tipHeading(tips)).toHaveText('Install the app');
      await expect(tips).toContainText('works as an app on your phone, with no app store needed');
      await expect(tips).toContainText('choose Install app or Add to Home screen');
      await next.click();
      await expect(tipHeading(tips)).toHaveText('Full screen');
      await expect(tips).toContainText('Open the Menu and choose Full screen');
      await next.click();
      await expect(tips).toContainText('Tap a country to open its ticket');
    } else {
      await expect(tipHeading(tips)).toHaveText('Countries');
      await expect(tips).toContainText('Click a country to open its ticket');
      await expect(tips.getByRole('button', { name: /^Tip \d+: Install the app$/ })).toHaveCount(0);
      await expect(tips.getByRole('button', { name: /^Tip \d+: Full screen$/ })).toHaveCount(0);
    }
    await expect(tips).toContainText(/Tip \d of \d/);

    // Back again, then a stamp jumps to a tip; the owner's last tip is sharing, where Next
    // becomes "Got it"
    await next.click();
    await previous.click();
    const share = tips.getByRole('button', { name: /^Tip \d+: Share your map$/ });
    await share.click();
    await expect(share).toHaveAttribute('aria-current', 'step');
    await expect(tipHeading(tips)).toHaveText('Share your map');
    await expect(tips).toContainText('no app to install and no account needed');
    await expect(next).toHaveCount(0);

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
    await tips.getByRole('button', { name: /^Close/ }).first().click();

    await page.evaluate(() => sessionStorage.clear());
    await openMap(page);
    await expect(tipsDialog(page)).toHaveCount(0);

    // Settings still opens them, from the first ("Show the tips"; their own stamp until 24 Nov 2026)
    const again = await openTipsFromSettings(page);
    await expect(again).toContainText('Tip 1 of');
    await page.keyboard.press('ArrowRight');
    await expect(again).toContainText('Tip 2 of');
    await again.getByRole('button', { name: /^Close/ }).first().click();
    await expect(tipsDialog(page)).toHaveCount(0);

    // Settings turns them back on
    const settings = await openTool(page, 'Map settings', 'Settings');
    const tipsSwitch = settings.getByRole('switch', { name: 'Tips when the map opens' });
    await expect(tipsSwitch).not.toBeChecked();
    await settings.getByText('Tips when the map opens', { exact: true }).click();
    await expect(tipsSwitch).toBeChecked();
  });
});
