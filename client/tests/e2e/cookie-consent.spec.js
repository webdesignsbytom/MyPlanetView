import { test, expect } from '@playwright/test';
// Constants
import { COOKIE_CONSENT_STYLE, COOKIE_POLICY_NAME, COOKIE_TIMER } from '../../src/utils/constants/constants.js';

const savedChoice = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null'), COOKIE_POLICY_NAME);

// The pop-up must sit on its own colour, not show the page through it
const expectOpaque = async (locator) => {
  const colour = await locator.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(colour).not.toBe('rgba(0, 0, 0, 0)');
};

const openPage = async (page, path = '/faq') => {
  await page.clock.install();
  await page.goto(path);
  await page.locator('#main-content').waitFor({ state: 'attached' });
  await page.clock.fastForward(COOKIE_TIMER);
};

test.beforeEach(async ({ page }) => {
  // Never send a real analytics hit from a test
  await page.route(/googletagmanager\.com|google-analytics\.com/, (route) => route.abort());
});

test.describe(`Cookie pop-up (${COOKIE_CONSENT_STYLE})`, () => {
  test.skip(COOKIE_CONSENT_STYLE === 'modal', 'covered by the modal test below');

  test('appears after the timer, saves a refusal and stays away', async ({ page }) => {
    await openPage(page);
    const popup = page.getByRole('dialog', { name: 'Cookie choices' });
    await expect(popup).toBeVisible();
    await expectOpaque(popup);

    await popup.getByRole('button', { name: COOKIE_CONSENT_STYLE === 'notice' ? 'Got it' : 'No thanks' }).click();
    await expect(popup).toBeHidden();
    expect((await savedChoice(page)).analytics).toBe('denied');

    await page.reload();
    await page.clock.fastForward(COOKIE_TIMER);
    await expect(popup).toBeHidden();
  });

  test('accepting analytics is saved', async ({ page }) => {
    test.skip(COOKIE_CONSENT_STYLE === 'notice', 'the notice asks nothing');
    await openPage(page);
    const popup = page.getByRole('dialog', { name: 'Cookie choices' });
    await popup.getByRole('button', { name: 'Accept analytics' }).click();
    await expect(popup).toBeHidden();
    expect((await savedChoice(page)).analytics).toBe('granted');
  });
});

test.describe('Cookie modal', () => {
  test.skip(COOKIE_CONSENT_STYLE !== 'modal', 'COOKIE_CONSENT_STYLE is not modal');

  test('needs both boxes ticked before it lets them in', async ({ page }) => {
    await openPage(page);
    const modal = page.getByRole('dialog', { name: 'Cookie & Policy Consent' });
    await expect(modal).toBeVisible();
    await expectOpaque(modal.locator('> div'));

    const agree = modal.getByRole('button', { name: 'Agree to cookie usage', exact: true });
    await expect(agree).toBeDisabled();
    for (const box of await modal.getByRole('checkbox').all()) await box.check();
    await agree.click();

    await expect(modal).toBeHidden();
    expect(await savedChoice(page)).toMatchObject({ analytics: 'granted', agreed: true });
  });
});
