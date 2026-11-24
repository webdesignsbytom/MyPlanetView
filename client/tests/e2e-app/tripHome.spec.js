import { test, expect, HOME_MAP, openMap } from './fixtures.js';

// "Welcome home" (23 Nov 2026, the user's wish: the day after a trip ends, remind people to share
// it, for word of mouth): the map's tag offers a picture of the trip and the map's link, and the
// email of the same name can be switched off. The seeded map's "Italian summer" is 2 to 16 July
// 2025, three stops in Italy.

const tagOf = (page) => page.getByRole('region', { name: 'Welcome home' });

test('the day after a trip, the map welcomes them home: a picture of the trip and the map’s link to share', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2025-07-17T12:00:00'));
  await openMap(page);
  const tag = tagOf(page);
  await expect(tag).toContainText('Welcome home from Italian summer!');

  // A picture of the trip: its country coloured in, its days and photos
  await tag.getByRole('button', { name: 'Share a picture' }).click();
  const dialog = page.getByRole('dialog', { name: 'Share a picture of your trip' });
  const card = dialog.locator('img[data-share-card]');
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute('alt', /^Your share card: Italian summer, 1 country, 15 days, \d+ photos$/);
  // One country: its own map with its regions, not a speck on the world (24 Nov 2026, the user's wish)
  await expect(card).toHaveAttribute('data-map-view', 'country');
  const download = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Save the picture' }).click();
  expect((await download).suggestedFilename()).toBe('my-planet-view-trip.png');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();

  // The map's link: the sharing dialog
  await tag.getByRole('button', { name: 'Send my map’s link' }).click();
  const share = page.getByRole('dialog', { name: `Share “${HOME_MAP}”` });
  await expect(share.getByRole('textbox', { name: 'Share link' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(share).toBeHidden();

  // Closed, it stays away, after a reload too
  await tag.getByRole('button', { name: 'Close: welcome home' }).click();
  await expect(tag).toHaveCount(0);
  await openMap(page);
  await expect(page.getByRole('heading', { level: 1, name: HOME_MAP, exact: true })).toBeAttached();
  await expect(tagOf(page)).toHaveCount(0);

  // The email's button (?home=) brings it back
  await openMap(page, '/maps/map-home?home=trip-italy');
  await expect(tagOf(page)).toContainText('Welcome home from Italian summer!');
});

test('nothing while the trip is still going, or two weeks after it', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2025-07-16T12:00:00'));
  await openMap(page);
  await expect(page.getByRole('heading', { level: 1, name: HOME_MAP, exact: true })).toBeAttached();
  await expect(tagOf(page)).toHaveCount(0);

  await page.clock.setFixedTime(new Date('2025-07-31T12:00:00'));
  await openMap(page);
  await expect(page.getByRole('heading', { level: 1, name: HOME_MAP, exact: true })).toBeAttached();
  await expect(tagOf(page)).toHaveCount(0);
});

test('the account page switches the “Welcome home” email off, and so does its own unsubscribe link', async ({ page }) => {
  await page.goto('/account');
  const card = page.getByRole('region', { name: 'Emails we send' });
  const box = card.getByRole('checkbox', { name: /Welcome home/ });
  await expect(box).toBeChecked();
  await box.uncheck();
  await expect(card.getByText('Saved.')).toBeVisible();
  await page.reload();
  const again = page.getByRole('region', { name: 'Emails we send' });
  await expect(again.getByRole('checkbox', { name: /Welcome home/ })).not.toBeChecked();
  // "On this day" is its own
  await expect(again.getByRole('checkbox', { name: /On this day/ })).toBeChecked();
  await again.getByRole('checkbox', { name: /Welcome home/ }).check();
  await expect(again.getByText('Saved.')).toBeVisible();

  await page.goto('/unsubscribe?u=mock-user&t=signed&l=trips');
  await expect(page.getByRole('heading', { name: 'Welcome home' })).toBeVisible();
  await page.getByRole('button', { name: 'Stop these emails' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'no more “Welcome home” emails' })).toBeVisible();
  await page.goto('/account');
  const after = page.getByRole('region', { name: 'Emails we send' });
  await expect(after.getByRole('checkbox', { name: /Welcome home/ })).not.toBeChecked();
  await expect(after.getByRole('checkbox', { name: /On this day/ })).toBeChecked();
});
