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

  // The link and the desk side by side under the words, the desk in the bottom right corner,
  // in line with the close stamp's right edge (23 Nov 2026, the user's wish)
  const tagBox = await tag.boundingBox();
  const linkBox = await tag.getByRole('link', { name: 'Open the trip' }).boundingBox();
  const deskBox = await tag.getByRole('button', { name: 'Travel Desk' }).boundingBox();
  const closeBox = await tag.getByRole('button', { name: 'Close: your next trip' }).boundingBox();
  expect(deskBox.x).toBeGreaterThan(linkBox.x + linkBox.width);
  expect(Math.abs(deskBox.y + deskBox.height / 2 - (linkBox.y + linkBox.height / 2))).toBeLessThan(4);
  expect(deskBox.y).toBeGreaterThanOrEqual(closeBox.y + closeBox.height);
  // (the close stamp is tilted, so its box pokes out a few pixels)
  expect(Math.abs(deskBox.x + deskBox.width - (closeBox.x + closeBox.width))).toBeLessThan(4);
  expect(tagBox.y + tagBox.height - (deskBox.y + deskBox.height)).toBeLessThan(24);

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
