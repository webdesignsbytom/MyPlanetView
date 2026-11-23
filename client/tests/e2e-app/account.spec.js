import { test, expect, HOME_MAP, MOCK_STORE_KEY, goInApp, makeJpeg, signOut } from './fixtures.js';

// The account page's own forms (pages.spec.js checks its cards are there): the avatar, the
// email address, the password and deleting the account with its leaving plan. Mock mode is
// better-auth's replies (handlers/account.js): the test user's password is 12345678 until
// changed, and a change of address waits for the emailed links, so nothing changes here.

const card = (page, name) => page.getByRole('region', { name, exact: true });

/** Change the saved demo data, then load the page again so mock mode reads it. */
async function editStore(page, edit) {
  await page.evaluate(
    ({ key, source }) => {
      const db = JSON.parse(localStorage.getItem(key));
      new Function('db', source)(db);
      localStorage.setItem(key, JSON.stringify(db));
    },
    { key: MOCK_STORE_KEY, source: `(${edit.toString()})(db);` },
  );
  await page.reload();
}

async function openAccount(page) {
  await page.goto('/account');
  await expect(page.getByRole('heading', { level: 1, name: 'Your account' })).toBeVisible();
}

test.describe('The account page', () => {
  test('an avatar is uploaded and removed; only pictures are taken', async ({ page }) => {
    await openAccount(page);
    const profile = card(page, 'Profile');
    await expect(profile.getByText('PNG, JPEG, WebP or GIF, up to 5 MB.')).toBeVisible();
    const file = profile.locator('#avatar-file');

    await file.setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not a picture') });
    await expect(profile.getByRole('alert')).toHaveText('Choose a PNG, JPEG, WebP or GIF image.');

    await file.setInputFiles(await makeJpeg(page, { name: 'me.jpg' }));
    await expect(profile.getByRole('alert')).toHaveText('Your avatar has been updated.');
    await expect(profile.getByRole('button', { name: 'Change avatar' })).toBeVisible();

    await profile.getByRole('button', { name: 'Remove', exact: true }).click();
    await expect(profile.getByRole('alert')).toHaveText('Your avatar has been removed.');
    await expect(profile.getByRole('button', { name: 'Upload avatar' })).toBeVisible();
    await expect(profile.getByRole('button', { name: 'Remove', exact: true })).toHaveCount(0);
  });

  test('the display name is saved, and can’t be left empty', async ({ page }) => {
    await openAccount(page);
    const profile = card(page, 'Profile');
    const name = profile.getByRole('textbox', { name: /^Display name/ });
    await expect(name).toHaveValue('Charlie Reid');
    await name.fill('   ');
    await profile.getByRole('button', { name: 'Save name' }).click();
    await expect(profile.getByText('Enter a display name.')).toBeVisible();
    await name.fill('Charlie R.');
    await profile.getByRole('button', { name: 'Save name' }).click();
    await expect(profile.getByRole('alert')).toHaveText('Your name has been updated.');
    await page.reload();
    await expect(card(page, 'Profile').getByRole('textbox', { name: /^Display name/ })).toHaveValue('Charlie R.');
  });

  test('an unverified address can resend its link and can’t add an avatar yet', async ({ page }) => {
    await openAccount(page);
    await editStore(page, (db) => {
      db.users[0].emailVerified = false;
    });
    const profile = card(page, 'Profile');
    await expect(profile.getByText('Verify your email to add a photo.')).toBeVisible();
    await expect(profile.getByRole('button', { name: 'Upload avatar' })).toHaveAttribute('aria-disabled', 'true');

    const email = card(page, 'Email');
    await expect(email).toContainText('Your email address isn\'t verified yet.');
    await email.getByRole('button', { name: 'Resend verification email' }).click();
    await expect(email.getByRole('alert')).toHaveText('Verification email sent to test@myplanetview.local.');
    // Unverified, a new address gets the link straight away
    await expect(email.getByText('We\'ll send a link to the new address to confirm it.')).toBeVisible();
  });

  test('a new email address is checked, then confirmed from the current one first', async ({ page }) => {
    await openAccount(page);
    const email = card(page, 'Email');
    await expect(email.getByText('Your email address is verified.')).toBeVisible();
    await expect(email).toContainText('Current email: test@myplanetview.local');
    const field = email.getByRole('textbox', { name: /^New email address/ });
    const submit = email.getByRole('button', { name: 'Change email' });

    await submit.click();
    await expect(email.getByText('Enter your new email address.')).toBeVisible();
    await field.fill('charlie@');
    await submit.click();
    await expect(email.getByText('Enter a valid email address.')).toBeVisible();
    await field.fill('TEST@myplanetview.local');
    await submit.click();
    await expect(email.getByText('That is already your email address.')).toBeVisible();

    await field.fill('charlie@example.test');
    await submit.click();
    await expect(email.getByRole('alert')).toHaveText(
      "If no other account uses charlie@example.test, we've sent a link to test@myplanetview.local to confirm the change. After that, we'll email a link to charlie@example.test; your email changes once you click it.",
    );
    await expect(field).toHaveValue('');
    // Nothing changes until the links are followed
    await expect(email).toContainText('Current email: test@myplanetview.local');
  });

  test('the password changes after its checks, and the new one signs in', async ({ page }) => {
    await openAccount(page);
    const password = card(page, 'Password');
    const current = password.getByLabel(/^Current password/);
    const next = password.getByLabel(/^New password/);
    const again = password.getByLabel(/^Confirm new password/);
    const submit = password.getByRole('button', { name: 'Change password' });
    await expect(password.getByRole('checkbox', { name: 'Sign out of my other devices' })).toBeChecked();

    await submit.click();
    await expect(password.getByText('Enter your current password.')).toBeVisible();
    await expect(current).toBeFocused();

    await current.fill('12345678');
    await next.fill('weak');
    await again.fill('weak');
    await submit.click();
    await expect(password.locator('#newPassword-error')).toContainText('Use 8 to 128 characters');

    await next.fill('Passport2027!');
    await again.fill('Passport2027?');
    await submit.click();
    await expect(password.getByText('Passwords do not match.')).toBeVisible();

    // The server checks the current one
    await current.fill('wrong-one');
    await again.fill('Passport2027!');
    await submit.click();
    await expect(password.getByRole('alert')).toHaveText('Invalid password');

    await current.fill('12345678');
    await submit.click();
    await expect(password.getByRole('alert')).toHaveText('Your password has been updated.');
    await expect(current).toHaveValue('');

    await signOut(page);
    await goInApp(page, '/login');
    const form = page.getByRole('region', { name: 'Login form' });
    await form.getByLabel('Email', { exact: true }).fill('test@myplanetview.local');
    await form.getByLabel('Password', { exact: true }).fill('Passport2027!');
    await form.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/map$/);
  });

  test('deleting the account wants the password; by default the map goes to its editor and the photos stay', async ({ page }) => {
    const saved = [];
    page.on('console', (msg) => {
      if (msg.text().startsWith('[mock] leaving plan saved')) saved.push(msg.text());
    });
    await openAccount(page);
    const del = card(page, 'Delete account');
    await expect(del.getByRole('combobox', { name: `“${HOME_MAP}”` })).toHaveValue('mock-alex');
    const submit = del.getByRole('button', { name: 'Delete my account' });

    await submit.click();
    await expect(del.getByText('Enter your password to confirm.')).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Delete your account?' })).toHaveCount(0);

    // A wrong password: the confirmation, then the server's answer, and nothing deleted
    await del.getByLabel('Your password').fill('not-it');
    await submit.click();
    const confirm = page.getByRole('dialog', { name: 'Delete your account?' });
    await expect(confirm).toContainText(`“${HOME_MAP}” goes to Alex Morgan.`);
    await expect(confirm).toContainText('Your photos on other people’s maps stay there.');
    await expect(confirm).toContainText('It cannot be undone.');
    await confirm.getByRole('button', { name: 'Confirm' }).click();
    await expect(del.getByRole('alert')).toHaveText('Invalid password');
    await expect(page).toHaveURL(/\/account$/);

    // Cancelled, nothing happens
    await del.getByLabel('Your password').fill('12345678');
    await submit.click();
    await confirm.getByRole('button', { name: 'Cancel' }).click();
    await expect(confirm).toBeHidden();
    await expect(page).toHaveURL(/\/account$/);

    await submit.click();
    await confirm.getByRole('button', { name: 'Confirm' }).click();
    await expect(page).toHaveURL(/:\d+\/$/);
    expect(saved.at(-1)).toBe(
      '[mock] leaving plan saved {"maps":[{"mapId":"map-home","action":"TRANSFER","toUserId":"mock-alex"}],"leavePhotos":true}',
    );
  });
});
