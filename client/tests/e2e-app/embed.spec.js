import { test, expect, HOME_MAP, SAM_MAP, SAM_SHARE_CODE, openMap, pressTool } from './fixtures.js';
import { COOKIE_POLICY_NAME } from '../../src/utils/constants/constants.js';

// A map on someone's own website (23 Nov 2026, the user's wish: every view advertises the site,
// with a link back): the share dialog gives the code once the map is shared by link, and
// /embed/:code is the map alone, with "Made with My Planet View" under it.

test('the share dialog gives the code for a website once the map is shared by link', async ({ page }) => {
  await openMap(page);
  await pressTool(page, 'Share this map');
  const dialog = page.getByRole('dialog', { name: `Share “${HOME_MAP}”` });
  const section = dialog.getByRole('region', { name: 'On your website' });
  await expect(section).toContainText('Choose “Anyone with the link” above');

  await dialog.getByRole('combobox', { name: 'General access' }).selectOption('Anyone with the link');
  const code = section.getByRole('textbox', { name: 'Code for your website' });
  await expect(code).toHaveValue(/<iframe src="http:\/\/[^"]+\/embed\/K7QX-M2PA-9RTW" title="Charlie &amp; Alex's travels: travel map"/);
  await expect(code).toHaveValue(/<a href="http:\/\/[^"]+\/\?utm_source=embed&amp;utm_medium=link&amp;utm_campaign=made-with">Made with My Planet View<\/a>/);
  await section.getByRole('button', { name: 'Copy the code' }).click();
  await expect(section.getByRole('button', { name: 'Copied' })).toBeVisible();
  // (Windows' clipboard writes its line break as CRLF)
  expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n')).toBe(await code.inputValue());
});

test('the framed map: the map alone, its counts, the links out and the link back, never a cookie pop-up', async ({ page }) => {
  // No choice on record, so any other page would show the cookie pop-up after 10 s
  await page.addInitScript((key) => localStorage.removeItem(key), COOKIE_POLICY_NAME);
  await page.clock.install();
  await page.goto(`/embed/${SAM_SHARE_CODE}`);
  // A page opened straight from its address loads the mock's whole demo first: a cold one is slow
  await expect(page.getByRole('application', { name: `${SAM_MAP}: world map` })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('heading', { level: 1, name: SAM_MAP })).toBeAttached();
  await expect(page.locator('[data-embed-stats]')).toContainText(/\d+ countries · \d+ continents?/);
  // No site navigation or footer: someone else's page is around it
  await expect(page.getByRole('navigation')).toHaveCount(0);

  const madeWith = page.getByRole('link', { name: 'Made with My Planet View' });
  await expect(madeWith).toHaveAttribute('href', '/?utm_source=embed&utm_medium=frame&utm_campaign=made-with');
  await expect(madeWith).toHaveAttribute('target', '_blank');
  await expect(page.getByRole('link', { name: 'Open the map' })).toHaveAttribute('href', `/shared/${SAM_SHARE_CODE}`);
  // Zoom stamps, as the wheel is left to the page it sits in
  await page.getByRole('button', { name: 'Zoom in' }).click();

  await page.clock.fastForward(12_000);
  await expect(page.getByRole('dialog', { name: 'Cookie choices' })).toHaveCount(0);
});

test('a link that no longer works says so, still with the link back', async ({ page }) => {
  // A reset link's old code
  await page.goto('/embed/ZZZZ-ZZZZ-ZZZZ');
  await expect(page.getByRole('alert').filter({ hasText: 'This map isn’t shared any more.' })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('link', { name: 'Made with My Planet View' })).toBeVisible();
});

test('it works inside another site’s page', async ({ page, baseURL }) => {
  await page.setContent(`<h1>My travel blog</h1><iframe title="Sam's map" src="${baseURL}/embed/${SAM_SHARE_CODE}" width="800" height="480"></iframe>`);
  const frame = page.frameLocator('iframe[title="Sam\'s map"]');
  await expect(frame.getByRole('application', { name: `${SAM_MAP}: world map` })).toBeVisible({ timeout: 30_000 });
  await expect(frame.getByRole('link', { name: 'Made with My Planet View' })).toBeVisible();
});
