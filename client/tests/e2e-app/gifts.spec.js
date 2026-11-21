import { test, expect, goInApp, signOut } from './fixtures.js';

// Gifts (docs/API.md "Gifts"; 21 Nov 2026, the user's wish): a year of Business or First
// Class, bought once (mock mode's Checkout is paid at once), its code listed for the buyer,
// its page shown to anyone with the code, redeemed once. The test user pays for Business, so a
// First Class gift is theirs to redeem.

async function buyGift(page, { toName = 'Jo', message = 'Happy Christmas!' } = {}) {
  await page.goto('/gifts');
  await expect(page.getByRole('heading', { level: 1, name: 'Give a year of travel' })).toBeVisible();
  await page.getByRole('radio', { name: /A year of First Class/ }).check();
  await page.getByLabel('Who it’s for (optional)').fill(toName);
  await page.getByLabel('A few words on the gift (optional)').fill(message);
  await page.getByRole('button', { name: 'Pay £99 for the gift' }).click();
  await expect(page).toHaveURL(/\/gifts\?bought=1$/);
  await expect(page.getByRole('status').filter({ hasText: 'Thank you.' })).toBeVisible();
  const row = page.locator('[data-gift-code]').first();
  await expect(row).toContainText(`A year of First Class for ${toName}`);
  await expect(row).toContainText('Ready to give');
  return row.getAttribute('data-gift-code');
}

test('a gift is bought, listed with its code, opened and redeemed once', async ({ page }) => {
  const code = await buyGift(page);
  expect(code).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/);

  await page.locator(`[data-gift-code="${code}"]`).getByRole('link', { name: 'Open the gift' }).click();
  await expect(page).toHaveURL(new RegExp(`/gift/${code}$`));
  const ticket = page.locator('[data-gift-status]');
  await expect(page.getByRole('heading', { name: 'A year of First Class' })).toBeVisible();
  await expect(ticket).toContainText('Jo');
  await expect(ticket).toContainText('“Happy Christmas!”');
  await expect(ticket).toContainText(code);

  await page.getByRole('button', { name: 'Redeem the gift' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'It’s yours: First Class until' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open your map' })).toBeVisible();

  await page.reload();
  await expect(page.getByText('This gift has been redeemed.')).toBeVisible();
  await page.goto('/gifts');
  await expect(page.locator(`[data-gift-code="${code}"]`)).toContainText('Redeemed');
});

test('someone signed out is asked to sign in or up to redeem it', async ({ page }) => {
  const code = await buyGift(page, { toName: 'Sam' });
  await signOut(page);
  await goInApp(page, `/gift/${code}`);
  await expect(page.getByRole('heading', { name: 'A year of First Class' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Create an account' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Redeem the gift' })).toHaveCount(0);
});

test('the account page opens a gift code, and an unknown one says so', async ({ page }) => {
  await page.goto('/account');
  const gifts = page.getByRole('region', { name: 'Gifts', exact: true });
  await gifts.getByLabel('Have a gift code?').fill('zzzz zzzz zzzz');
  await gifts.getByRole('button', { name: 'Open it' }).click();
  await expect(page).toHaveURL(/\/gift\/ZZZZZZZZZZZZ$/);
  await expect(page.getByText('That gift code doesn’t exist. Check it and try again.')).toBeVisible();
});

test('the Pricing page offers a gift', async ({ page }) => {
  await page.goto('/pricing');
  const card = page.getByRole('region', { name: 'Give it as a gift' });
  await expect(card).toContainText('£49');
  await expect(card).toContainText('£99');
  await card.getByRole('link', { name: 'Give a year of travel' }).click();
  await expect(page).toHaveURL(/\/gifts$/);
});
