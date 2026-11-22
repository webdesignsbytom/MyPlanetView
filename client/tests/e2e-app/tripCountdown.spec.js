import { test, expect, openMap } from './fixtures.js';

// The countdown to the next trip (22 Nov 2026, the user's wish): the seeded map's next planned
// trip is "Japan in spring", from 1 April 2027; April is Japan's best time in its guide.

test('the map counts down to the next trip, says if it’s a good time, and opens the trip and the Travel Desk', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2027-03-20T12:00:00'));
  await openMap(page);
  const tag = page.getByRole('region', { name: 'Your next trip' });
  await expect(tag).toContainText('12 days until Japan in spring');
  await expect(tag).toContainText('April is the best time for Japan.');
  await expect(tag.getByRole('link', { name: 'Open the trip' })).toHaveAttribute('href', /\/trips\/.+/);

  await tag.getByRole('button', { name: 'Travel Desk' }).click();
  const desk = page.getByRole('dialog', { name: 'Travel Desk' });
  await expect(desk).toContainText('For Japan');
  await desk.getByRole('button', { name: /^Close/ }).first().click();

  // Closed, it stays away for the day
  await tag.getByRole('button', { name: 'Close: your next trip' }).click();
  await expect(tag).toHaveCount(0);
});

test('the day before, and on the day', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2027-03-31T12:00:00'));
  await openMap(page);
  await expect(page.getByRole('region', { name: 'Your next trip' })).toContainText('1 day until Japan in spring');
});
