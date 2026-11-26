import { test, expect, HOME_MAP, HOME_SHARE_CODE, goInApp, mapReady, openMap, openTool, pressTool, toolbar } from './fixtures.js';

// The supporter badge (docs/API.md "The supporter badge"; 24 Nov 2026, the user's wish): a paying
// member's plan hangs under their map's banner, for everyone who opens it, share links too, and
// their Settings turn it off. The test user pays for Business. The banner is wide screens' only.

const banner = (page) => page.getByRole('region', { name: 'Map banner' });
const badgeIn = (where) => where.getByRole('link', { name: 'Business Class member. About our plans (opens in a new tab)' });

test('a paying member’s badge hangs under their banner, for everyone, until Settings turns it off', async ({ page }) => {
  await openMap(page);
  const badge = badgeIn(banner(page));
  await expect(badge).toBeVisible();
  await expect(badge).toHaveAttribute('href', '/pricing');
  await expect(badge).toHaveAttribute('target', '_blank');

  // Through its share link too
  await pressTool(page, 'Share this map');
  const dialog = page.getByRole('dialog', { name: `Share “${HOME_MAP}”` });
  await dialog.getByRole('combobox', { name: 'General access' }).selectOption('Anyone with the link');
  await expect(dialog.getByRole('combobox', { name: 'General access' })).toHaveValue('ANYONE_WITH_LINK');
  await dialog.getByRole('button', { name: 'Done' }).click();
  await goInApp(page, `/shared/${HOME_SHARE_CODE}`);
  await expect(page).toHaveURL(new RegExp(`/shared/${HOME_SHARE_CODE}$`));
  await expect(badgeIn(banner(page))).toBeVisible();

  // Settings show the owner their badge and its switch: off, it goes from the banner at once
  await goInApp(page, '/map');
  await mapReady(page);
  const settings = await openTool(page, 'Map settings', 'Settings');
  await expect(settings.locator('[data-supporter-settings] [data-supporter-badge]')).toHaveText(/Business Class member/);
  const box = settings.getByRole('switch', { name: 'Show my Business Class badge' });
  await expect(box).toBeChecked();
  await settings.getByText('Show my Business Class badge', { exact: true }).click();
  await expect(box).not.toBeChecked();
  await expect(banner(page).locator('[data-supporter-badge]')).toHaveCount(0);
  await settings.getByRole('button', { name: 'Close Settings' }).click();

  // ...and from the share link
  await goInApp(page, `/shared/${HOME_SHARE_CODE}`);
  await expect(page).toHaveURL(new RegExp(`/shared/${HOME_SHARE_CODE}$`));
  await expect(banner(page)).toBeVisible();
  await expect(banner(page).locator('[data-supporter-badge]')).toHaveCount(0);
});

test('through a share link, Settings has no badge switch, even for the owner', async ({ page }) => {
  await openMap(page);
  await pressTool(page, 'Share this map');
  const dialog = page.getByRole('dialog', { name: `Share “${HOME_MAP}”` });
  await dialog.getByRole('combobox', { name: 'General access' }).selectOption('Anyone with the link');
  await dialog.getByRole('button', { name: 'Done' }).click();
  await goInApp(page, `/shared/${HOME_SHARE_CODE}`);
  await expect(page).toHaveURL(new RegExp(`/shared/${HOME_SHARE_CODE}$`));
  // The same map's page stays on screen while the share page's code loads, so Settings could be
  // opened on it and go with it (CI, 24-26 Nov 2026): wait for the share page, which has no
  // sharing, as grouptrips.spec.js does
  await expect(toolbar(page).getByRole('button', { name: 'Share this map', exact: true })).toHaveCount(0);
  await mapReady(page);
  await expect(badgeIn(banner(page))).toBeVisible();
  const settings = await openTool(page, 'Map settings', 'Settings');
  await expect(settings.locator('[data-supporter-settings]')).toHaveCount(0);
});
