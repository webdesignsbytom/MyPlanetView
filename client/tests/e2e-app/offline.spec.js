import { test, expect } from './fixtures.js';

// The installed app (PWA) can be opened with no connection: the app says so, and the note
// goes once the connection is back (components/utils/OfflineNotice.jsx). The service worker
// itself only exists in production builds, so it isn't part of these tests.
test.describe('Offline', () => {
  test('the app says when the connection drops, and stops saying it when it comes back', { tag: '@phone' }, async ({ page, context }) => {
    await page.goto('/account');
    await expect(page.getByRole('heading', { level: 1, name: 'Your account' })).toBeVisible();
    const notice = page.getByRole('status').filter({ hasText: 'You’re offline.' });
    await expect(notice).toHaveCount(0);

    await context.setOffline(true);
    await expect(notice).toBeVisible();
    await context.setOffline(false);
    await expect(notice).toHaveCount(0);
  });
});
