import { test, expect, openMap } from './fixtures.js';

// The map's notes that come and go share one place, one at a time with arrows between them
// (components/map/MapTagStack.jsx; 26 Nov 2026, the audit: stacked, they covered Alaska,
// Hawaii and the west coast on a desktop, and the top third of a phone's map). On 26 Nov
// 2026 the demo map has two: a moment's day ("3 years ago today: The Taj Mahal at dawn")
// and the countdown to Japan.

test('two notes share one place: the first shows, the arrows show the other', { tag: '@phone' }, async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-26T12:00:00'));
  await openMap(page);
  const anniversary = page.getByRole('region', { name: 'On this day' });
  const countdown = page.getByRole('region', { name: 'Your next trip' });
  const stepper = page.getByRole('group', { name: 'More notes' });

  await expect(anniversary).toContainText('3 years ago today');
  await expect(countdown).toHaveCount(0);
  await expect(stepper).toContainText('1 of 2');

  await stepper.getByRole('button', { name: 'Next note' }).click();
  await expect(countdown).toContainText('days until Japan In Spring');
  await expect(anniversary).toHaveCount(0);
  await expect(stepper).toContainText('2 of 2');

  // Round again, then closing one leaves the other on its own, with no arrows
  await stepper.getByRole('button', { name: 'Next note' }).click();
  await expect(anniversary).toBeVisible();
  await anniversary.getByRole('button', { name: 'Close: on this day' }).click();
  await expect(countdown).toBeVisible();
  await expect(stepper).toHaveCount(0);
});

test('with one note there are no arrows', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2027-03-20T12:00:00'));
  await openMap(page);
  await expect(page.getByRole('region', { name: 'Your next trip' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'More notes' })).toHaveCount(0);
});
