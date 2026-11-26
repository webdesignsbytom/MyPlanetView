import { test, expect } from './fixtures.js';
import { MAGNETIC_POLES_YEAR } from '../../src/utils/map/specialPlaces.js';

// The admin pages against mock mode's few fake rows (src/dev/mock/seed.js, handlers/admin.js
// and handlers/billing.js): the dashboard, users (roles, status, memberships, moving a map),
// the developer's audit log and the contact forms. `?mockRole=` makes the test user an admin
// or a developer (remembered for the visit).

/** Open an admin page as `role`, once it has drawn (the role is set as mock mode starts). */
async function openAs(page, path, role, heading) {
  await page.goto(`${path}?mockRole=${role}`);
  await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
}

const userRow = (page, name) => page.getByRole('article', { name, exact: true });

test.describe('Admin pages', () => {
  test('the dashboard links the admin pages, and the audit log only for a developer', async ({ page }) => {
    await openAs(page, '/admin', 'ADMIN', 'Admin Dashboard');
    const manage = page.getByRole('region', { name: 'Manage' });
    await expect(manage.getByRole('link')).toHaveText([
      /^Contact Forms/,
      /^Users/,
      /^Promo Codes/,
      /^Travel Offers/,
      /^Photo Themes/,
      /^Feedback/,
      /^Gifts and Referrals/,
    ]);
    // The latest contact forms are on it too
    await expect(page.getByRole('region', { name: 'Contact Forms' }).getByRole('article')).toHaveCount(2);

    await openAs(page, '/admin', 'DEVELOPER', 'Admin Dashboard');
    await expect(page.getByRole('region', { name: 'Manage' }).getByRole('link')).toHaveCount(8);
    await page.getByRole('region', { name: 'Manage' }).getByRole('link', { name: /^Audit Log/ }).click();
    await expect(page).toHaveURL(/\/admin\/events$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Audit Log' })).toBeVisible();
  });

  // The overview (the audit, 26 Nov 2026): the site's numbers and each daily job's last run
  // (mock mode's are pretend runs at their times, fine)
  test('the dashboard opens with the overview and the daily jobs', async ({ page }) => {
    await openAs(page, '/admin', 'ADMIN', 'Admin Dashboard');
    const overview = page.getByRole('region', { name: 'Overview' });
    await expect(overview.locator('[data-overview-tile="Accounts"]')).toContainText('verified');
    await expect(overview.locator('[data-overview-tile="Paying members"]')).toContainText('Business 1');
    await expect(overview.locator('[data-overview-job]')).toHaveCount(2);
    await expect(overview.locator('[data-overview-job="cleanup"]')).toContainText('Ran fine');
    await expect(overview.locator('[data-overview-job="emails"]')).toContainText('Daily emails (08:00 UTC each day)');
    await overview.getByRole('link', { name: 'Look up a gift code' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Gifts and Referrals' })).toBeVisible();
  });

  // The yearly reminders (26 Nov 2026, the user's wish): from the January after the magnetic
  // poles' pins' year, the overview says to move them, first, under To do
  test('the overview says when the magnetic poles are due a move, and not before', async ({ page }) => {
    await page.clock.setFixedTime(new Date(Date.UTC(MAGNETIC_POLES_YEAR + 1, 0, 2, 12)));
    await openAs(page, '/admin', 'ADMIN', 'Admin Dashboard');
    const overview = page.getByRole('region', { name: 'Overview' });
    const reminder = overview.locator('[data-overview-reminder="magneticPoles"]');
    await expect(overview.getByRole('heading', { name: 'To do' })).toBeVisible();
    await expect(reminder).toContainText('Move the magnetic poles');
    await expect(reminder).toContainText(`Move them to ${MAGNETIC_POLES_YEAR + 1}'s`);

    await page.clock.setFixedTime(new Date(Date.UTC(MAGNETIC_POLES_YEAR, 11, 30, 12)));
    await overview.getByRole('button', { name: 'Reload the overview' }).click();
    await expect(overview.locator('[data-overview-tile="Accounts"]')).toBeVisible();
    await expect(reminder).toHaveCount(0);
  });

  // Support's "my gift code doesn't work": a gift bought (mock mode's Checkout is paid at once),
  // then found on the admin page however its code is typed
  test('a gift is found by its code, with who bought it', async ({ page }) => {
    await page.goto('/gifts');
    await expect(page.getByRole('heading', { level: 1, name: 'Give a year of travel' })).toBeVisible();
    await page.getByRole('radio', { name: /A year of First Class/ }).check();
    await page.getByLabel('Who it’s for (optional)').fill('Gran');
    await page.getByRole('button', { name: 'Pay £99 for the gift' }).click();
    await expect(page).toHaveURL(/\/gifts\?bought=1$/);
    const code = await page.locator('[data-gift-code]').first().getAttribute('data-gift-code');

    await openAs(page, '/admin/gifts', 'ADMIN', 'Gifts and Referrals');
    await expect(page.getByRole('list', { name: 'Gifts bought lately' }).locator(`[data-admin-gift="${code}"]`)).toBeVisible();
    await expect(page.getByText('No referral rewards yet.')).toBeVisible();

    const find = page.getByRole('region', { name: 'Find a gift' });
    await find.getByLabel(/^Gift code/).fill(code.toLowerCase());
    await find.getByRole('button', { name: 'Find' }).click();
    const found = page.getByRole('region', { name: 'The gift found' }).locator(`[data-admin-gift="${code}"]`);
    await expect(found).toContainText('A year of First Class, £99');
    await expect(found).toContainText('Paid, not redeemed yet');
    await expect(found).toContainText('Charlie Reid (test@myplanetview.local), for Gran');

    await find.getByLabel(/^Gift code/).fill('2222-3333-4444');
    await find.getByRole('button', { name: 'Find' }).click();
    await expect(page.getByRole('region', { name: 'The gift found' })).toHaveText('No gift has that code.');
  });

  test('users: search, filters, a role saved, and an account deactivated and back', async ({ page }) => {
    await openAs(page, '/admin/users', 'ADMIN', 'User Admin');
    const list = page.getByRole('region', { name: 'List of users' });
    await expect(list.getByRole('article')).toHaveCount(8);

    // Your own row can't be changed here
    const own = userRow(page, 'Charlie Reid');
    await expect(own).toContainText('This is your account — manage it from your account page.');
    await expect(own.getByRole('button', { name: 'Save role for Charlie Reid' })).toBeDisabled();
    await expect(own.getByRole('button', { name: 'Membership for Charlie Reid' })).toBeDisabled();

    const filters = page.getByRole('search', { name: 'Filter users' });
    await filters.getByRole('searchbox', { name: 'Search name or email' }).fill('quinn');
    await expect(list.getByRole('article')).toHaveCount(1);
    await expect(userRow(page, 'Pat Quinn')).toContainText('Deactivated');
    await filters.getByRole('searchbox', { name: 'Search name or email' }).fill('');
    await filters.getByRole('combobox', { name: 'Role' }).selectOption({ label: 'Admin' });
    await expect(list.getByRole('article')).toHaveCount(2);
    await filters.getByRole('combobox', { name: 'Role' }).selectOption({ label: 'All roles' });
    await filters.getByRole('combobox', { name: 'Status' }).selectOption({ label: 'Deactivated' });
    await expect(list.getByRole('article')).toHaveCount(1);
    await filters.getByRole('combobox', { name: 'Status' }).selectOption({ label: 'All statuses' });
    await expect(list.getByRole('article')).toHaveCount(8);

    // A role is saved only once it's changed
    const sam = userRow(page, 'Sam Rivers');
    const save = sam.getByRole('button', { name: 'Save role for Sam Rivers' });
    await expect(save).toBeDisabled();
    await sam.getByRole('combobox', { name: 'Role' }).selectOption({ label: 'Admin' });
    await save.click();
    await expect(page.getByRole('status').filter({ hasText: 'Sam Rivers is now Admin.' })).toBeVisible();
    await expect(userRow(page, 'Sam Rivers')).toContainText('ADMIN');

    // Deactivating asks first
    await userRow(page, 'Sam Rivers').getByRole('button', { name: 'Deactivate Sam Rivers' }).click();
    const confirm = page.getByRole('dialog', { name: 'Deactivate User' });
    await expect(confirm).toContainText('Deactivate Sam Rivers? They will be signed out everywhere');
    await confirm.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Sam Rivers has been deactivated.' })).toBeVisible();
    await userRow(page, 'Sam Rivers').getByRole('button', { name: 'Reactivate Sam Rivers' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Sam Rivers has been reactivated.' })).toBeVisible();
    await expect(userRow(page, 'Sam Rivers').getByRole('button', { name: 'Deactivate Sam Rivers' })).toBeVisible();
  });

  test('a user is deleted after a second press', async ({ page }) => {
    await openAs(page, '/admin/users', 'ADMIN', 'User Admin');
    await page.getByRole('button', { name: 'Delete user Tom Baker' }).click();
    const confirm = page.getByRole('dialog', { name: 'Delete User' });
    await confirm.getByRole('button', { name: 'Cancel' }).click();
    await expect(userRow(page, 'Tom Baker')).toBeVisible();
    await page.getByRole('button', { name: 'Delete user Tom Baker' }).click();
    await confirm.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Tom Baker has been deleted.' })).toBeVisible();
    await expect(userRow(page, 'Tom Baker')).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'List of users' }).getByRole('article')).toHaveCount(7);
  });

  test('Membership gives a complimentary plan for some months, and ends it', async ({ page }) => {
    await openAs(page, '/admin/users', 'ADMIN', 'User Admin');
    await userRow(page, 'Sam Rivers').getByRole('button', { name: 'Membership for Sam Rivers' }).click();
    const dialog = page.getByRole('dialog', { name: 'Membership: Sam Rivers' });
    await expect(dialog).toContainText('Plan now: Economy (free)');
    await expect(dialog.getByRole('region', { name: 'Complimentary memberships' })).toContainText('None yet.');

    // Whole months only
    const months = dialog.getByRole('spinbutton', { name: /^Months/ });
    await expect(months).toHaveValue('24');
    await months.fill('0');
    await dialog.getByRole('button', { name: 'Give membership' }).click();
    await expect(dialog.getByText(/^Give a whole number of months from \d+ to \d+\.$/)).toBeVisible();

    await months.fill('6');
    await dialog.getByRole('combobox', { name: 'Plan' }).selectOption({ label: 'Business' });
    await dialog.getByRole('textbox', { name: 'Reason (only admins see it)' }).fill('Influencer, spring 2027');
    await dialog.getByRole('button', { name: 'Give membership' }).click();
    await expect(dialog.getByText('Sam Rivers has complimentary Business for 6 months.')).toBeVisible();
    await expect(dialog).toContainText('Plan now: Business (complimentary)');
    const grants = dialog.getByRole('region', { name: 'Complimentary memberships' });
    await expect(grants.getByRole('listitem')).toHaveCount(1);
    await expect(grants.getByRole('listitem')).toContainText(/^Business, .+ \(running\)Influencer, spring 2027/);

    await grants.getByRole('button', { name: 'End Business membership now' }).click();
    await expect(dialog.getByText('Membership ended. Nothing of theirs is deleted.')).toBeVisible();
    await expect(dialog).toContainText('Plan now: Economy (free)');
    await expect(grants.getByRole('button', { name: 'End Business membership now' })).toHaveCount(0);

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('Transfer a map checks its fields, asks, then moves the map', async ({ page }) => {
    await openAs(page, '/admin/users', 'ADMIN', 'User Admin');
    const card = page.getByRole('region', { name: 'Transfer a map' });
    await card.getByRole('button', { name: 'Transfer map' }).click();
    await expect(card.getByText('Enter the map’s id (from its address: /maps/<id>).')).toBeVisible();
    await expect(card.getByText('Enter the new owner’s email address.')).toBeVisible();

    await card.getByLabel('Map id').fill('map-jo');
    await card.getByLabel('New owner’s email').fill('sam@example.test');
    await card.getByRole('button', { name: 'Transfer map' }).click();
    const confirm = page.getByRole('dialog', { name: 'Transfer this map?' });
    await expect(confirm).toContainText('The map map-jo will belong to sam@example.test, with its owner’s plan. The old owner loses access.');
    await confirm.getByRole('button', { name: 'Cancel' }).click();
    await expect(confirm).toBeHidden();

    await card.getByText('Keep the old owner on the map as an editor').click();
    await card.getByRole('button', { name: 'Transfer map' }).click();
    await expect(confirm).toContainText('The old owner stays as an editor.');
    await confirm.getByRole('button', { name: 'Confirm' }).click();
    await expect(card.getByText(/^“Jo's family trips” now belongs to sam@example\.test\./)).toBeVisible();
    // The form starts again
    await expect(card.getByLabel('Map id')).toHaveValue('');

    // An address with no account can't have it
    await card.getByLabel('Map id').fill('map-jo');
    await card.getByLabel('New owner’s email').fill('nobody@example.test');
    await card.getByRole('button', { name: 'Transfer map' }).click();
    await confirm.getByRole('button', { name: 'Confirm' }).click();
    await expect(card.getByRole('alert')).toBeVisible();
    await expect(card.getByText(/now belongs to/)).toHaveCount(0);
  });

  test('the audit log filters events, triages one, shows its details and deletes', async ({ page }) => {
    await openAs(page, '/admin/events', 'DEVELOPER', 'Audit Log');
    const list = page.getByRole('region', { name: 'List of events' });
    await expect(list.getByRole('article')).toHaveCount(4);

    const filters = page.getByRole('search', { name: 'Filter audit log' });
    await filters.getByRole('combobox', { name: 'Level' }).selectOption({ label: 'Error' });
    await expect(list.getByRole('article')).toHaveCount(1);
    await expect(list.getByRole('article', { name: 'confirm' })).toContainText('Upload larger than the display size cap');
    await filters.getByRole('combobox', { name: 'Level' }).selectOption({ label: 'All levels' });
    await filters.getByRole('searchbox', { name: 'Search message or action' }).fill('signed in');
    await expect(list.getByRole('article')).toHaveCount(1);
    await filters.getByRole('searchbox', { name: 'Search message or action' }).fill('');
    await expect(list.getByRole('article')).toHaveCount(4);

    const login = list.getByRole('article', { name: 'login' });
    await login.getByRole('combobox', { name: 'Status' }).selectOption({ label: 'Resolved' });
    await expect(page.getByRole('status').filter({ hasText: 'Event marked Resolved.' })).toBeVisible();
    await expect(login).toContainText('RESOLVED');

    const details = login.getByRole('button', { name: 'Show details' });
    await details.click();
    await expect(login.getByRole('button', { name: 'Hide details' })).toHaveAttribute('aria-expanded', 'true');
    await expect(login).toContainText('req-1');
    await expect(login).toContainText('/api/auth/sign-in/email');

    await login.getByRole('button', { name: 'Delete event login' }).click();
    await page.getByRole('dialog', { name: 'Delete Event' }).getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Event deleted.' })).toBeVisible();
    await expect(list.getByRole('article')).toHaveCount(3);

    await page.getByRole('button', { name: 'Delete All' }).click();
    const all = page.getByRole('dialog', { name: 'Delete All Events' });
    await expect(all).toContainText('This cannot be undone.');
    await all.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByText('No events match these filters.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete All' })).toHaveCount(0);
  });

  test('the contact forms are listed with a way to reply, and deleted one by one or all', async ({ page }) => {
    await openAs(page, '/admin/contact-forms', 'ADMIN', 'Admin - Contact Forms');
    const priya = page.getByRole('article', { name: 'Contact form submission from Priya Shah' });
    await expect(priya).toContainText('Can I share one trip without sharing my whole map?');
    await expect(priya.getByRole('link', { name: 'Email Priya Shah' })).toHaveAttribute('href', 'mailto:priya@example.test');

    const tom = page.getByRole('article', { name: 'Contact form submission from Tom Lee' });
    await page.getByRole('button', { name: 'Delete the contact form from Tom Lee' }).click();
    const confirm = page.getByRole('dialog', { name: 'Delete Contact Form' });
    // Cancel has the focus, so Enter can't delete by accident
    await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(confirm).toBeHidden();
    await expect(tom).toBeVisible();
    await page.getByRole('button', { name: 'Delete the contact form from Tom Lee' }).click();
    await confirm.getByRole('button', { name: 'Confirm' }).click();
    await expect(tom).toHaveCount(0);
    await expect(priya).toBeVisible();

    await page.getByRole('button', { name: 'Delete All' }).click();
    await page.getByRole('dialog', { name: 'Delete All Contact Forms' }).getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByText('No contact forms found.')).toBeVisible();
    // Kept: a reload shows none
    await page.reload();
    await expect(page.getByText('No contact forms found.')).toBeVisible();
  });
});
