import { test, expect } from './fixtures.js';

// Give a month, get a month (docs/API.md "Give a month, get a month"; 21 Nov 2026, the user's
// wish): the account page's invite link (the test user is Charlie Reid), and what a friend
// who opens it sees on the sign-up page.

test('the account page gives an invite link, which tells a friend who invited them', async ({ page }) => {
  await page.goto('/account');
  const card = page.getByRole('region', { name: 'Invite a friend' });
  await card.getByRole('button', { name: 'Get my invite link' }).click();
  const link = card.getByRole('textbox', { name: 'Your invite link' });
  await expect(link).toHaveValue(/\/sign-up\?code=CHARLIE[2-9A-Z]{4}$/);
  await expect(card.locator('[data-referral-counts]')).toHaveText(
    '0 friends joined, 0 went on to pay. You’ve earned 0 free months, with 12 more months to earn this year.',
  );
  // Kept: the same link next time
  const url = await link.inputValue();
  await page.reload();
  await expect(page.getByRole('region', { name: 'Invite a friend' }).getByRole('textbox', { name: 'Your invite link' })).toHaveValue(url);

  // The friend's sign-up page: the code filled in, and who it's from
  await page.goto(new URL(url).pathname + new URL(url).search);
  await expect(page.getByRole('textbox', { name: 'Promo code (optional)' })).toHaveValue(new URL(url).searchParams.get('code'));
  await expect(page.locator('#promoCode-status')).toHaveText(/^Charlie invited you: your first month of Business or First Class is free\./);

  // Never on the admins' list of codes
  await page.goto('/admin/promo-codes?mockRole=ADMIN');
  await expect(page.getByRole('heading', { level: 1, name: 'Promo Codes' })).toBeVisible();
  await expect(page.getByRole('article', { name: new URL(url).searchParams.get('code'), exact: true })).toHaveCount(0);
});
