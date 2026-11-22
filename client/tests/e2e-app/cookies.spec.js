import { test, expect } from './fixtures.js';
// Constants
import { COOKIE_POLICY_NAME, COOKIE_TIMER } from '../../src/utils/constants/constants.js';

// The cookie choice (components/modals/CookieConsentBanner.jsx, the 'banner' style): asked
// once, COOKIE_TIMER after the first page, and shown again from the footer's "Cookie
// settings", where a yes can be withdrawn (its _ga cookies deleted: utils/analytics/initGA.js
// stopGA). The other tests start with a refusal on record (fixtures.js).

const savedChoice = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null')?.analytics ?? null, COOKIE_POLICY_NAME);
const banner = (page) => page.getByRole('dialog', { name: 'Cookie choices' });
const gaCookies = async (page) => (await page.context().cookies()).filter((c) => /^_ga/.test(c.name)).map((c) => c.name);

test.beforeEach(async ({ page }) => {
  // Never a real analytics request from a test
  await page.route(/googletagmanager\.com|google-analytics\.com/, (route) => route.abort());
});

test('a first visit is asked after a moment; a refusal is kept and not asked again', async ({ page }) => {
  // No choice on record for this visit's first page (the fixture's refusal taken back once)
  await page.addInitScript((key) => {
    if (!sessionStorage.getItem('e2e-cookies-cleared')) {
      sessionStorage.setItem('e2e-cookies-cleared', '1');
      localStorage.removeItem(key);
    }
  }, COOKIE_POLICY_NAME);
  await page.clock.install();
  await page.goto('/faq');
  await page.locator('#main-content').waitFor({ state: 'attached' });
  await expect(banner(page)).toHaveCount(0);
  await page.clock.fastForward(COOKIE_TIMER);

  await expect(banner(page)).toBeVisible();
  await expect(banner(page)).toContainText('the site works either way');
  await expect(banner(page).getByRole('link', { name: 'Go to Privacy Policy page' })).toHaveAttribute('href', '/user-agreements#privacy-policy');
  // Refusing is as easy as agreeing: two buttons side by side, no close stamp on a first ask
  await expect(banner(page).getByRole('button', { name: /^Close/ })).toHaveCount(0);
  await banner(page).getByRole('button', { name: 'No thanks' }).click();
  await expect(banner(page)).toBeHidden();
  expect(await savedChoice(page)).toBe('denied');

  await page.reload();
  await page.locator('#main-content').waitFor({ state: 'attached' });
  await page.clock.fastForward(COOKIE_TIMER);
  await expect(banner(page)).toHaveCount(0);
});

test('accepting is kept; Cookie settings shows it again, and a no withdraws it and deletes GA’s cookies', async ({ page }) => {
  await page.goto('/faq');
  await page.evaluate((key) => {
    localStorage.setItem(key, JSON.stringify({ analytics: 'granted', version: '1.1.0', timestamp: new Date().toISOString() }));
  }, COOKIE_POLICY_NAME);
  await page.context().addCookies([
    { name: '_ga', value: 'GA1.1.123.456', domain: 'localhost', path: '/' },
    { name: '_ga_TEST', value: 'GS1.1.789', domain: 'localhost', path: '/' },
  ]);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const settings = page.getByRole('contentinfo').getByRole('button', { name: 'Cookie settings' });
  await settings.click();
  await expect(banner(page)).toContainText("You've allowed Google Analytics. Choose “No thanks” to withdraw that");
  await expect(banner(page).getByRole('button', { name: 'No thanks' })).toBeFocused();

  // Escape shuts it unchanged, and focus goes back to the footer's button
  await page.keyboard.press('Escape');
  await expect(banner(page)).toBeHidden();
  await expect(settings).toBeFocused();
  expect(await savedChoice(page)).toBe('granted');
  expect(await gaCookies(page)).toEqual(expect.arrayContaining(['_ga', '_ga_TEST']));

  await settings.click();
  await banner(page).getByRole('button', { name: 'No thanks' }).click();
  await expect(banner(page)).toBeHidden();
  expect(await savedChoice(page)).toBe('denied');
  await expect.poll(() => gaCookies(page)).toEqual([]);

  // Asked again, it says what was chosen, and its stamp closes it keeping that
  await settings.click();
  await expect(banner(page)).toContainText("You've said no to Google Analytics, so it isn't used.");
  await banner(page).getByRole('button', { name: 'Close, keeping your choice' }).click();
  await expect(banner(page)).toBeHidden();
  expect(await savedChoice(page)).toBe('denied');

  // And a yes again
  await settings.click();
  await banner(page).getByRole('button', { name: 'Accept analytics' }).click();
  expect(await savedChoice(page)).toBe('granted');
});
