import { test, expect, goInApp, signOut } from './fixtures.js';

// Friends challenges (docs/API.md, "Friends challenges"). The mock seeds "Two years on the
// road" (countries with a photo in 2025–2026), started by Sam, with the test user (2:
// Italy and France) and Jo (1: Portugal) in. Names and counts only.

const SEEDED = 'Two years on the road';
const SEEDED_LINK = '/challenges/join/CHA2-YR5R-DTRP';
// The seeded challenge runs to the end of 2026: joining it is only possible until then
const seededRunning = () => Date.now() < Date.parse('2027-01-01T00:00:00Z');

test.describe('Friends challenges', () => {
  test('the list and a leaderboard: names and counts, you marked', async ({ page }) => {
    await page.goto('/challenges');
    await expect(page.getByRole('heading', { level: 1, name: 'Challenges' })).toBeVisible();
    const list = page.getByRole('region', { name: 'Your challenges' });
    await expect(list).toContainText('You: 2 countries · 3 people');
    await list.getByRole('link', { name: SEEDED }).click();

    await expect(page.getByRole('heading', { level: 1, name: SEEDED })).toBeVisible();
    const board = page.getByRole('list', { name: 'Leaderboard' }).getByRole('listitem');
    await expect(board).toHaveText([/^1st\s*Charlie Reid \(you\)\s*2 countries$/, /^2nd\s*Jo Patel\s*1 country$/, /^3rd\s*Sam Rivers\s*Started it\s*0 countries$/]);
    await expect(page.getByRole('region', { name: 'Your map' })).toContainText("Counting “Charlie & Alex's travels”");
    // Not the starter: no changes, but leaving
    await expect(page.getByRole('region', { name: 'Change the challenge' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Leave the challenge' })).toBeVisible();
  });

  test('start one, change it and delete it', async ({ page }) => {
    await page.goto('/challenges');
    const start = page.getByRole('region', { name: 'Start a challenge' });
    await start.getByRole('textbox', { name: 'Title' }).fill('Landmark race');
    await start.getByRole('combobox', { name: 'What it counts' }).selectOption({ label: 'Landmarks stamped' });
    await start.getByRole('spinbutton', { name: 'First to… (optional)' }).fill('10');
    await start.getByRole('button', { name: 'Start it' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Landmark race' })).toBeVisible();
    await expect(page.getByText(/^Landmarks stamped, .+\. First to 10\.$/)).toBeVisible();
    const board = page.getByRole('list', { name: 'Leaderboard' }).getByRole('listitem');
    await expect(board).toHaveCount(1);
    await expect(board.first()).toContainText('Charlie Reid (you)');
    // The link to send friends
    await expect(page.getByRole('textbox', { name: 'Join link' })).toHaveValue(/\/challenges\/join\/[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}$/);
    // The starter can't leave, only delete
    await expect(page.getByRole('button', { name: 'Leave the challenge' })).toHaveCount(0);

    const settings = page.getByRole('region', { name: 'Change the challenge' });
    await expect(settings.getByRole('combobox', { name: 'What it counts' })).toBeDisabled();
    await settings.getByRole('textbox', { name: 'Title' }).fill('Landmark race 2');
    await settings.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Landmark race 2' })).toBeVisible();

    await settings.getByRole('button', { name: 'Delete the challenge' }).click();
    await settings.getByRole('button', { name: 'Delete it' }).click();
    await expect(page).toHaveURL(/\/challenges$/);
    await expect(page.getByRole('region', { name: 'Your challenges' }).getByRole('link', { name: 'Landmark race 2' })).toHaveCount(0);
  });

  test('leave, then join again by its link, choosing the map that counts', async ({ page }) => {
    test.skip(!seededRunning(), 'the seeded challenge has finished');
    await page.goto('/challenges');
    await page.getByRole('link', { name: SEEDED }).click();
    await page.getByRole('button', { name: 'Leave the challenge' }).click();
    await expect(page).toHaveURL(/\/challenges$/);
    await expect(page.getByRole('region', { name: 'Your challenges' })).toContainText('None yet.');

    await page.goto(SEEDED_LINK);
    await expect(page.getByRole('heading', { level: 1, name: SEEDED })).toBeVisible();
    await expect(page.getByText('Started by Sam Rivers, 2 people in')).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'The map that counts for you' })).toHaveValue('map-home');
    await page.getByRole('button', { name: 'Join the challenge' }).click();
    await expect(page.getByRole('list', { name: 'Leaderboard' }).getByRole('listitem')).toHaveCount(3);
    await expect(page).toHaveURL(/\/challenges\/challenge-two-years$/);
  });

  test('a join link signed out asks to sign in; someone already in goes to its page', async ({ page }) => {
    await page.goto(SEEDED_LINK);
    await expect(page).toHaveURL(/\/challenges\/challenge-two-years$/);
    // Signed out (a page load would sign the mock in again: move within the app)
    await signOut(page);
    await goInApp(page, SEEDED_LINK);
    await expect(page.getByRole('heading', { level: 1, name: SEEDED })).toBeVisible();
    if (seededRunning()) await expect(page.getByRole('link', { name: 'Sign in to join' })).toBeVisible();
    else await expect(page.getByText('This challenge has finished.')).toBeVisible();
    await goInApp(page, '/challenges/join/AAAA-AAAA-AAAA');
    await expect(page.getByText("That challenge link doesn't work. Ask for a new one.")).toBeVisible();
  });
});
