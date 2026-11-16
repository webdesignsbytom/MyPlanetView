import { test, expect } from './fixtures.js';

// Influencer codes (docs/API.md, "Promo codes") against mock mode. The seed has SAMTRAVELS
// (up to 500 sign-ups) and TRAVELTALK (a podcast's; Jo and Tom used it). Every code gives
// the same: the follower's first month free on a paid plan, as a trial on their first paid
// Checkout. Signing up in mock mode makes you the test user, renamed, with an address still
// to verify (and the test user's Business subscription, which the badge can take away).

const OFFER = (code) =>
  `${code}: your first month of Business or First Class is free. Choose one on your account page once your email is verified. Stripe asks for a card, and nothing is charged for 30 days.`;

const PASSWORD = 'Passport#2027';
const INVALID = "That code isn't valid. Check it, or sign up without one.";

const promoField = (page) => page.getByRole('textbox', { name: 'Promo code (optional)' });
const promoStatus = (page) => page.locator('#promoCode-status');

/** Everything on the sign-up form but the promo code. */
async function fillSignUp(page) {
  await page.getByRole('textbox', { name: 'Username' }).fill('New Traveller');
  await page.getByRole('textbox', { name: 'Email' }).fill('new.traveller@example.test');
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByLabel('Confirm Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('checkbox', { name: /13 or over/ }).check();
}

/** The admin page, signed in as an admin (mock mode's ?mockRole). */
async function openAdmin(page) {
  await page.goto('/admin/promo-codes?mockRole=ADMIN');
  await expect(page.getByRole('heading', { level: 1, name: 'Promo Codes' })).toBeVisible();
}

const codeRow = (page, code) => page.getByRole('article', { name: code, exact: true });

test.describe('Promo codes', () => {
  test('a creator’s link fills the code and says what it gives; the first upgrade is a free month', { tag: '@phone' }, async ({ page }) => {
    await page.goto('/sign-up?code=SAMTRAVELS');
    await expect(promoField(page)).toHaveValue('SAMTRAVELS');
    await expect(promoStatus(page)).toHaveText(OFFER('SAMTRAVELS'));

    await fillSignUp(page);
    await page.getByRole('button', { name: 'Register your account' }).click();
    await expect(page).toHaveURL(/\/welcome$/);

    // Verifying gives nothing by itself: no membership
    await page.goto('/verify-email-address/mock-user/mock-token');
    await expect(page.getByText('Your email has been verified successfully.')).toBeVisible();

    // With no subscription (the badge takes the test user's away: no extra maps, then
    // Economy; each reloads), the plans offer the free month
    await page.goto('/account');
    await page.getByRole('button', { name: 'Mock mode' }).click();
    await page.getByRole('combobox', { name: 'Extra maps paid' }).selectOption('0');
    await page.getByRole('button', { name: 'Mock mode' }).click();
    await page.getByRole('combobox', { name: 'Plan' }).selectOption({ label: 'Economy' });
    const plan = page.getByRole('region', { name: 'Your plan' });
    await expect(plan.getByTestId('promo-trial')).toHaveText(
      'Your code SAMTRAVELS makes your first month free on Business or First Class. Checkout asks for a card; nothing is charged for 30 days, and if you cancel before then you pay nothing.',
    );
    await expect(plan).not.toContainText('complimentary');
    await plan.getByRole('button', { name: 'Start a free month of Business' }).click();

    // Back from Checkout: Business in its free month, and the offer is used
    await expect(page).toHaveURL(/\/account\?billing=success$/);
    await expect(plan).toContainText(/Free until \d{1,2} \w{3} \d{4}\. Your first payment is then, unless you cancel before\./);
    await expect(plan.getByTestId('promo-trial')).toHaveCount(0);

    // The creator's count: one sign-up, verified, in a free month (which counts as paying)
    await openAdmin(page);
    await expect(codeRow(page, 'SAMTRAVELS').locator('dl').last()).toHaveText(
      /Sign-ups\s*1\s*Verified\s*1\s*Free months\s*1\s*Paying\s*1/,
    );
  });

  test('a code that can’t be used says so, and the sign-up works without it', async ({ page }) => {
    await page.goto('/sign-up');
    await fillSignUp(page);

    // Sent before it was checked: the sign-up is refused with the server's message
    await promoField(page).fill('no-such-code');
    await promoField(page).press('Enter');
    await expect(page.getByRole('alert')).toHaveText(INVALID);
    await expect(promoField(page)).toBeFocused();
    await expect(page).toHaveURL(/\/sign-up$/);
    // The check says so under the field too
    await expect(promoStatus(page)).toHaveText(INVALID);

    // Leaving the field checks a code at once; clearing it signs up without one
    await promoField(page).fill('ab');
    await promoField(page).blur();
    await expect(promoStatus(page)).toHaveText(INVALID);
    await promoField(page).fill('');
    await expect(promoStatus(page)).toHaveText('');
    await page.getByRole('button', { name: 'Register your account' }).click();
    await expect(page).toHaveURL(/\/welcome$/);
  });

  test('a code from a link on another page is kept for the sign-up form', async ({ page }) => {
    await page.goto('/pricing?code=traveltalk');
    await expect(page.getByRole('heading', { level: 1, name: 'Pricing' })).toBeVisible();
    await page.goto('/sign-up');
    await expect(promoField(page)).toHaveValue('traveltalk');
    await expect(promoStatus(page)).toHaveText(OFFER('TRAVELTALK'));
  });

  test('an admin makes a code, sees it listed, changes it and turns it off', async ({ page }) => {
    await openAdmin(page);
    await expect(codeRow(page, 'SAMTRAVELS')).toContainText('First month free on Business or First Class (30 days, with a card)');
    await expect(codeRow(page, 'SAMTRAVELS')).toContainText('Up to 500 sign-ups');
    await expect(codeRow(page, 'TRAVELTALK').locator('dl').last()).toHaveText(
      /Sign-ups\s*2\s*Verified\s*2\s*Free months\s*0\s*Paying\s*0/,
    );

    // A new code: typed loosely, stored upper case
    const card = page.getByRole('region', { name: 'New code' });
    await card.getByRole('textbox', { name: 'Code', exact: true }).fill('ada-adventures');
    await card.getByRole('textbox', { name: 'Label (only admins see it)' }).fill('Ada’s Adventures, summer 2027');
    // There's no offer to set: it's the same for every code
    await expect(card.getByRole('combobox')).toHaveCount(0);
    await card.getByRole('button', { name: 'Make code' }).click();
    await expect(card.getByRole('status')).toHaveText('ADAADVENTURES is ready: their followers get their first month free.');
    const row = codeRow(page, 'ADAADVENTURES');
    await expect(row).toContainText('First month free on Business or First Class');
    await expect(row).toContainText('No limit');
    await expect(row).toContainText('myplanetview.com/sign-up?code=ADAADVENTURES');
    await expect(row.getByText('On', { exact: true })).toBeVisible();

    // A code that's taken is refused
    await card.getByRole('textbox', { name: 'Code', exact: true }).fill('samtravels');
    await card.getByRole('textbox', { name: 'Label (only admins see it)' }).fill('Again');
    await card.getByRole('button', { name: 'Make code' }).click();
    await expect(card.getByRole('alert')).toHaveText('That code is already in use.');

    // Its limits change; the code itself can't
    await row.getByRole('button', { name: 'Change ADAADVENTURES' }).click();
    const dialog = page.getByRole('dialog', { name: 'Change ADAADVENTURES' });
    await expect(dialog.getByRole('textbox', { name: 'Code', exact: true })).toHaveCount(0);
    await dialog.getByRole('spinbutton', { name: 'Most sign-ups (optional)' }).fill('100');
    await dialog.getByRole('button', { name: 'Save changes' }).click();
    await expect(dialog).toBeHidden();
    await expect(row).toContainText('Up to 100 sign-ups');

    // Off: nobody new can sign up with it
    await row.getByRole('button', { name: 'Turn off ADAADVENTURES' }).click();
    await expect(page.getByText('ADAADVENTURES is off: nobody new can use it.')).toBeVisible();
    await expect(row.getByText('Off', { exact: true })).toBeVisible();
    await expect(row.getByRole('button', { name: 'Turn on ADAADVENTURES' })).toBeVisible();

    await page.goto('/sign-up?code=ADAADVENTURES');
    await expect(promoStatus(page)).toHaveText(INVALID);
  });
});
