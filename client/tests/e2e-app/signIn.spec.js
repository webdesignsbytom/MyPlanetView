import { test, expect, HOME_MAP, expectMapOpen, goInApp, signOut } from './fixtures.js';

// Signing in, the forgotten and reset password pages, and the guards that send a visitor to
// sign in and back again (utils/user/AuthenticateUser.jsx: `state.from`, the whole address).
// Mock mode signs the test user in on every page load, so each test signs out first and then
// moves within the app (fixtures.js goInApp). Only the test user signs in (seed.js), with
// 12345678 until a reset changes it.

const EMAIL = 'test@myplanetview.local';
const PASSWORD = '12345678';

/** Fill the sign-in form and send it. */
async function fillSignIn(page, email, password) {
  const form = page.getByRole('region', { name: 'Login form' });
  await form.getByLabel('Email', { exact: true }).fill(email);
  await form.getByLabel('Password', { exact: true }).fill(password);
  await form.getByRole('button', { name: 'Sign in', exact: true }).click();
}

/** Sign out, then open a page within the app (signed out, a guarded one sends you to sign in). */
async function signedOutAt(page, path) {
  await signOut(page);
  await goInApp(page, path);
}

/** A gift bought on /gifts (mock mode's Checkout is paid at once); its code. */
async function buyGift(page) {
  await page.goto('/gifts');
  await page.getByRole('radio', { name: /A year of First Class/ }).check();
  await page.getByRole('button', { name: 'Pay £99 for the gift' }).click();
  await expect(page).toHaveURL(/\/gifts\?bought=1$/);
  return page.locator('[data-gift-code]').first().getAttribute('data-gift-code');
}

test.describe('Signing in', () => {
  test('the test user signs in and lands on their map', { tag: '@phone' }, async ({ page }) => {
    await signedOutAt(page, '/login');
    await expect(page.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Go to password reset page' })).toHaveAttribute('href', '/forgot-password');
    await expect(page.getByRole('link', { name: 'Go to account registration page' })).toHaveAttribute('href', '/sign-up');

    await fillSignIn(page, EMAIL, PASSWORD);
    await expect(page).toHaveURL(/\/map$/);
    await expectMapOpen(page, HOME_MAP);
  });

  test('each empty field says what it needs, and a wrong password gets the server’s answer', async ({ page }) => {
    await signedOutAt(page, '/login');
    const form = page.getByRole('region', { name: 'Login form' });
    await form.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(form.getByText('Enter the email address you signed up with.')).toBeVisible();
    await expect(form.getByText('Enter your password.')).toBeVisible();
    await expect(form.getByLabel('Email', { exact: true })).toBeFocused();

    await fillSignIn(page, EMAIL, 'not-my-password');
    await expect(form.getByRole('alert').filter({ hasText: 'Invalid email or password' })).toBeVisible();
    // Still signed out, on the same page; the email field takes focus to try again
    await expect(page).toHaveURL(/\/login$/);
    await expect(form.getByLabel('Email', { exact: true })).toBeFocused();
    await expect(form.getByLabel('Email', { exact: true })).toHaveAttribute('aria-invalid', 'true');

    // Typing again clears it
    await form.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await expect(form.getByRole('alert').filter({ hasText: 'Invalid email or password' })).toHaveCount(0);
  });

  test('a forgotten password asks for a full address, then says a link is on its way', async ({ page }) => {
    await page.goto('/login');
    await signedOutAt(page, '/forgot-password');
    await expect(page.getByRole('heading', { level: 1, name: 'Forgotten your password?' })).toBeVisible();
    const form = page.getByRole('region', { name: 'Forgotten password form' });
    const submit = form.getByRole('button', { name: 'Request a password reset link' });

    await submit.click();
    await expect(form.getByText('Please enter your email address')).toBeVisible();
    await form.getByLabel('Email').fill('test@myplanet');
    await submit.click();
    await expect(form.getByText('Please enter a full email address, like name@example.com')).toBeVisible();

    await form.getByLabel('Email').fill(EMAIL);
    await submit.click();
    // The same answer whether or not the address has an account
    await expect(form.getByRole('alert')).toHaveText('If an account exists for that email, a reset link has been sent.');
    await form.getByRole('link', { name: 'Go to login page' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('a reset link sets a new password, which then signs in instead of the old one', async ({ page }) => {
    await signedOutAt(page, '/reset-password/mock-user/mock-token');
    await expect(page.getByRole('heading', { level: 1, name: 'Choose a new password' })).toBeVisible();
    const form = page.getByRole('region', { name: 'Reset password form' });
    const newPassword = form.getByLabel('New password', { exact: true });
    const confirm = form.getByLabel('Confirm new password', { exact: true });
    const submit = form.getByRole('button', { name: 'Set new password' });

    // The client's rules first, then the two must match
    await newPassword.fill('short');
    await confirm.fill('short');
    await submit.click();
    await expect(form.locator('#password-error')).toContainText('Use 8 to 128 characters');
    await newPassword.fill('Travel2027!');
    await confirm.fill('Travel2027?');
    await submit.click();
    await expect(form.locator('#confirmPassword-error')).toHaveText('Passwords do not match. Please re-enter them.');
    await expect(confirm).toBeFocused();

    await confirm.fill('Travel2027!');
    await submit.click();
    await expect(form.getByRole('alert')).toContainText('Your password has been updated. Redirecting to login…');
    // Five seconds later, the sign-in page
    await expect(page).toHaveURL(/\/login$/, { timeout: 15_000 });

    await fillSignIn(page, EMAIL, PASSWORD);
    await expect(page.getByRole('region', { name: 'Login form' }).getByRole('alert')).toHaveText('Invalid email or password');
    await fillSignIn(page, EMAIL, 'Travel2027!');
    await expect(page).toHaveURL(/\/map$/);
  });
});

test.describe('The guards', () => {
  test('a signed-out visitor is sent to sign in, then back to the whole address they asked for', async ({ page }) => {
    await signedOutAt(page, '/compare?a=map-home#results');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeVisible();
    await fillSignIn(page, EMAIL, PASSWORD);
    await expect(page).toHaveURL(/\/compare\?a=map-home#results$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('the sign-up link on the sign-in page keeps where they were going', async ({ page }) => {
    await signedOutAt(page, '/challenges');
    await expect(page).toHaveURL(/\/login$/);
    await page.getByRole('link', { name: 'Go to account registration page' }).click();
    await expect(page).toHaveURL(/\/sign-up$/);
    expect(await page.evaluate(() => window.history.state?.usr?.from)).toBe('/challenges');
  });

  test('someone who isn’t an admin is sent home from the admin pages', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/:\d+\/$/);
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toHaveCount(0);
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/:\d+\/$/);
  });

  test('the audit log is for developers only: an admin is sent home', async ({ page }) => {
    await page.goto('/admin/events?mockRole=ADMIN');
    await expect(page).toHaveURL(/:\d+\/$/);
    await expect(page.getByRole('heading', { name: 'Audit Log' })).toHaveCount(0);
    // The same admin opens the other admin pages
    await page.goto('/admin');
    await expect(page.getByRole('heading', { level: 1, name: 'Admin Dashboard' })).toBeVisible();
  });

  test('a signed-out admin is sent to sign in, then back to the admin page', async ({ page }) => {
    // The role is remembered (mock mode's mpvMockRole)
    await page.goto('/account?mockRole=ADMIN');
    await expect(page.getByRole('heading', { level: 1, name: 'Your account' })).toBeVisible();
    await signedOutAt(page, '/admin/users');
    await expect(page).toHaveURL(/\/login$/);
    await fillSignIn(page, EMAIL, PASSWORD);
    await expect(page).toHaveURL(/\/admin\/users$/);
    await expect(page.getByRole('heading', { level: 1, name: 'User Admin' })).toBeVisible();
  });
});

test.describe('Links opened directly', () => {
  test('a challenge’s page opens straight from its address; one you aren’t in says so', async ({ page }) => {
    await page.goto('/challenges/challenge-two-years');
    await expect(page.getByRole('heading', { level: 1, name: 'Two years on the road' })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Leaderboard' }).getByRole('listitem')).toHaveCount(3);
    await expect(page.getByRole('textbox', { name: 'Join link' })).toHaveValue(/\/challenges\/join\/CHA2-YR5R-DTRP$/);

    await page.goto('/challenges/no-such-challenge');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText("That challenge doesn't exist, or you're not in it.")).toBeVisible();
    await expect(page.getByRole('list', { name: 'Leaderboard' })).toHaveCount(0);
  });

  test('a join link’s “Sign in to join” comes back to the challenge once signed in', async ({ page }) => {
    test.skip(Date.now() >= Date.parse('2027-01-01T00:00:00Z'), 'the seeded challenge has finished');
    await signedOutAt(page, '/challenges/join/CHA2-YR5R-DTRP');
    await expect(page.getByRole('heading', { level: 1, name: 'Two years on the road' })).toBeVisible();
    await page.getByRole('link', { name: 'Sign in to join' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await fillSignIn(page, EMAIL, PASSWORD);
    // Back to the link; the test user is already in it, so on to its page
    await expect(page).toHaveURL(/\/challenges\/challenge-two-years$/);
    await expect(page.getByRole('list', { name: 'Leaderboard' }).getByRole('listitem')).toHaveCount(3);
  });

  test('a gift’s page signed out asks to sign in; signed in, it can be redeemed', async ({ page }) => {
    const code = await buyGift(page);
    await signedOutAt(page, `/gift/${code}`);
    await expect(page.getByRole('heading', { name: 'A year of First Class' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Redeem the gift' })).toHaveCount(0);
    await page.getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await fillSignIn(page, EMAIL, PASSWORD);
    await expect(page).toHaveURL(new RegExp(`/gift/${code}$`));
    await page.getByRole('button', { name: 'Redeem the gift' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'It’s yours: First Class until' })).toBeVisible();
  });
});
