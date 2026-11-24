import { test, expect, openMap, openTool, pressCountry } from './fixtures.js';

// "Guess where I was" (23 Nov 2026, the user's wish: friends guess where your photos were taken,
// share their score, and the link brings new people in). The seed has the test user's game
// "Guess where we were" (GWHR-2WAS-7MAP): the Eiffel Tower, the Colosseum, Amsterdam's canals
// and the Alhambra, with Sam on the board at 2,980.

const CODE = 'GWHR-2WAS-7MAP';

test('an editor makes a game from the map’s photos and gets its link', async ({ page }) => {
  await openMap(page);
  const stats = await openTool(page, 'Travel statistics', 'Travel statistics');
  await stats.getByRole('button', { name: 'Guess where I was: a game for friends' }).click();
  const dialog = page.getByRole('dialog', { name: 'Guess where I was' });
  await expect(dialog.getByText('Guess where we were')).toBeVisible();
  await expect(dialog.getByText(/4 photos · played 1 time · best: Sam, 2,980/)).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Link to Guess where we were' })).toHaveValue(new RegExp(`/guess/${CODE}$`));

  // A first choice is made: photos from different countries
  const chosen = dialog.locator('[data-guess-chosen]');
  await expect(chosen).not.toHaveAttribute('data-guess-chosen', '0');
  await dialog.getByRole('textbox', { name: 'Its title' }).fill('Where in the world?');
  await dialog.getByRole('button', { name: 'Make the game' }).click();
  const made = dialog.locator('[data-guess-made]');
  await expect(made.getByText('Your game is ready')).toBeVisible();
  await expect(made.getByRole('textbox', { name: 'Link to Where in the world?' })).toHaveValue(/\/guess\/[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}$/);
});

test('a friend plays by the link: guesses on the map or the list, sees each answer, and goes on the board', async ({ page }) => {
  await page.goto(`/guess/${CODE}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Guess where we were' })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Sam', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Start the game' }).click();

  // 1: the Eiffel Tower, chosen from the list
  await expect(page.getByRole('heading', { name: 'Photo 1 of 4' })).toBeVisible();
  await page.getByRole('combobox', { name: 'Or choose the country' }).selectOption({ label: 'France' });
  await page.getByRole('button', { name: 'Guess France' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Yes! Eiffel Tower, France.' })).toBeVisible();
  await page.getByRole('button', { name: 'Next photo' }).click();

  // 2: the Colosseum, pressed on the map (wrongly: Spain)
  await expect(page.getByRole('heading', { name: 'Photo 2 of 4' })).toBeVisible();
  await page.locator('[data-guess-map]').scrollIntoViewIfNeeded();
  await pressCountry(page, 'ES');
  await page.getByRole('button', { name: 'Guess Spain' }).click();
  await expect(page.locator('[data-guess-result="wrong"]')).toContainText(/It was Colosseum, Italy: about [\d,]+ km \([\d,]+ miles\) from your guess\./);
  await page.getByRole('button', { name: 'Next photo' }).click();

  for (const [round, country] of [
    [3, 'Netherlands'],
    [4, 'Spain'],
  ]) {
    await expect(page.getByRole('heading', { name: `Photo ${round} of 4` })).toBeVisible();
    await page.getByRole('combobox', { name: 'Or choose the country' }).selectOption({ label: country });
    await page.getByRole('button', { name: `Guess ${country}` }).click();
    await expect(page.locator('[data-guess-result="right"]')).toBeVisible();
    await page.getByRole('button', { name: round === 4 ? 'See your score' : 'Next photo' }).click();
  }

  const total = page.locator('[data-guess-total]');
  await expect(total).toHaveText(/^[\d,]+ of 4,000 points$/);
  const score = Number(await total.getAttribute('data-guess-total'));
  expect(score).toBeGreaterThan(3000);
  await page.getByRole('textbox', { name: 'Your name for the leaderboard' }).fill('Jo');
  await page.getByRole('button', { name: 'Put me on the board' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'You’re number 1 on the board.' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Leaderboard' }).getByRole('listitem')).toHaveText([/^1\.\s*Jo/, /^2\.\s*Sam/]);
  await expect(page.getByRole('link', { name: 'Make your own travel map, free' })).toHaveAttribute('href', /\/sign-up\?utm_source=guess/);
});

test('a game that’s gone says so', async ({ page }) => {
  await page.goto('/guess/ZZZZ-ZZZZ-ZZZZ');
  await expect(page.getByRole('alert').filter({ hasText: 'This game doesn’t exist any more.' })).toBeVisible({ timeout: 30_000 });
});
