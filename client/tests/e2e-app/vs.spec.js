import { test, expect, MOCK_STORE_KEY, goInApp, openMap, openStats, signOut } from './fixtures.js';

// Vs mode (26 Nov 2026, the user's wish: "connect to another account and have all your stats and
// badges compared ... gold silver bronze ratings for top people"; at most 8 people; docs/API.md
// "Vs mode"). The mock seeds "Who has travelled most?", started by the test user with Sam and Jo
// in (the test user 10 golds, Sam 8 silvers, Jo 2 silvers and 6 bronzes), and Sam's crew, which
// the test user isn't in (its link: SAMC-RW22-VS88).

const SEEDED = 'Who has travelled most?';
const SAMS_LINK = '/vs/join/SAMC-RW22-VS88';
const table = (page) => page.getByRole('table', { name: 'The medal table' });
// Leaving the map: on the dev server the next page's code waits behind the map's idle
// preloads (each landmark model's picture is a module of its own there, about 1,770), which
// took 7 to 10 s (26 Nov 2026). A build bundles them, so only the tests wait longer.
const AFTER_THE_MAP = { timeout: 30_000 };

test.describe('Vs mode', () => {
  test('the statistics lead to it; the medal table, every category and the badges', async ({ page }) => {
    await openMap(page);
    await openStats(page);
    await page.getByRole('dialog', { name: 'Travel statistics' }).getByRole('link', { name: 'Vs mode: compare with friends' }).click();
    await expect(page).toHaveURL(/\/vs$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Vs mode' })).toBeVisible(AFTER_THE_MAP);
    const list = page.getByRole('region', { name: 'Your comparisons' });
    await expect(list).toContainText('3 people · you started it');
    await list.getByRole('link', { name: SEEDED }).click();

    await expect(page.getByRole('heading', { level: 1, name: SEEDED })).toBeVisible();
    await expect(page.getByText('You’re 1st of 3: 10 gold.')).toBeVisible();
    await expect(table(page).locator('tbody tr')).toHaveText([
      /^1st\s*Charlie Reid \(you\)\s*10\s*0\s*0$/,
      /^2nd\s*Sam Rivers\s*0\s*8\s*0$/,
      /^3rd\s*Jo Patel\s*0\s*2\s*6$/,
    ]);
    // Three people: each category ranked, a tie sharing its medal
    const landmarks = page.getByRole('region', { name: 'Landmarks stamped' });
    await expect(landmarks.getByRole('listitem')).toHaveText([/^1st\s*Charlie Reid \(you\)\s*24/, /^2nd\s*Jo Patel\s*1/, /^2nd\s*Sam Rivers\s*1/]);
    await expect(landmarks.getByRole('img', { name: 'Silver' })).toHaveCount(2);
    await expect(page.getByRole('region', { name: 'Distance travelled' })).toContainText('101,211 km');
    await expect(page.locator('[data-vs-category]')).toHaveCount(10);
    await expect(page.locator('[data-vs-badge]').first()).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Join link' })).toHaveValue(/\/vs\/join\/VS22-FRND-8MAX$/);
    await expect(page.getByText(/^3 of 8 in\./)).toBeVisible();
  });

  test('your medals as a picture to share', async ({ page }) => {
    await page.goto('/vs/vs-friends');
    await page.getByRole('button', { name: 'Share a picture' }).click();
    const dialog = page.getByRole('dialog', { name: 'Share your medals' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'Words to go with it' })).toHaveValue(/^1st place in “Who has travelled most\?”: 10 gold\./);
    await expect(dialog.locator('img')).toBeVisible();
  });

  test('start one, rename it, re-link it and delete it', async ({ page }) => {
    await page.goto('/vs');
    const start = page.getByRole('region', { name: 'Start a comparison' });
    await start.getByRole('textbox', { name: 'Title' }).fill('The gang');
    await expect(start.getByRole('combobox', { name: 'The map that counts for you' })).toHaveValue('map-home');
    await start.getByRole('button', { name: 'Start the comparison' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'The gang' })).toBeVisible();
    await expect(page.getByText('Your numbers so far. Medals come once a friend joins.')).toBeVisible();
    await expect(table(page).locator('tbody tr')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Share a picture' })).toHaveCount(0);
    const link = page.getByRole('textbox', { name: 'Join link' });
    const first = await link.inputValue();
    expect(first).toMatch(/\/vs\/join\/[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}$/);
    // The starter can't leave, only delete
    await expect(page.getByRole('button', { name: 'Leave the comparison' })).toHaveCount(0);

    const invite = page.getByRole('region', { name: 'Bring your friends' });
    await invite.getByRole('button', { name: 'Make a new link' }).click();
    await invite.getByRole('button', { name: 'Make a new link' }).first().click();
    await expect(link).not.toHaveValue(first);

    const settings = page.getByRole('region', { name: 'Change the comparison' });
    await settings.getByRole('textbox', { name: 'Title' }).fill('The gang of eight');
    await settings.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'The gang of eight' })).toBeVisible();
    await settings.getByRole('button', { name: 'Delete the comparison' }).click();
    await settings.getByRole('button', { name: 'Delete it' }).click();
    await expect(page).toHaveURL(/\/vs$/);
    await expect(page.getByRole('region', { name: 'Your comparisons' }).getByRole('link', { name: 'The gang of eight' })).toHaveCount(0);
  });

  test('join a friend’s by its link, then leave', async ({ page }) => {
    await page.goto(SAMS_LINK);
    await expect(page.getByRole('heading', { level: 1, name: 'Sam’s crew' })).toBeVisible();
    await expect(page.getByText(/Sam Rivers wants to compare travels/)).toBeVisible();
    await expect(page.getByText(/2 people are in so far, 8 at most\./)).toBeVisible();
    await page.getByRole('button', { name: 'Join the comparison' }).click();
    await expect(page).toHaveURL(/\/vs\/vs-sams-crew$/);
    await expect(table(page).locator('tbody tr')).toHaveCount(3);
    // Opening the link again goes straight to it
    await goInApp(page, SAMS_LINK);
    await expect(page).toHaveURL(/\/vs\/vs-sams-crew$/);
    await page.getByRole('button', { name: 'Leave the comparison' }).click();
    await expect(page).toHaveURL(/\/vs$/);
    await expect(page.getByRole('region', { name: 'Your comparisons' }).getByRole('link', { name: 'Sam’s crew' })).toHaveCount(0);
  });

  test('two people head to head', async ({ page }) => {
    await page.goto('/vs/vs-friends');
    await expect(page.getByRole('heading', { level: 1, name: SEEDED })).toBeVisible();
    // Jo leaves (in the saved demo data, read again on the reload), so it's the test user and Sam
    await page.evaluate((key) => {
      const db = JSON.parse(localStorage.getItem(key));
      db.vsMembers = db.vsMembers.filter((m) => !(m.groupId === 'vs-friends' && m.userId === 'mock-jo'));
      localStorage.setItem(key, JSON.stringify(db));
    }, MOCK_STORE_KEY);
    await page.reload();
    await expect(page.locator('[data-vs-head-to-head]')).toBeVisible();
    await expect(page.getByText('Head to head')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Countries', exact: true })).toContainText(/20.*4/);
  });

  test('a join link signed out asks to sign in; a broken one says so', async ({ page }) => {
    await page.goto('/vs');
    await signOut(page);
    await goInApp(page, SAMS_LINK);
    await expect(page.getByRole('heading', { level: 1, name: 'Sam’s crew' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in to join' })).toBeVisible();
    await goInApp(page, '/vs/join/AAAA-AAAA-AAAA');
    await expect(page.getByText("That link doesn't work. Ask for a new one.")).toBeVisible();
  });
});
