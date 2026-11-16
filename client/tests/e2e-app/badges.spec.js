import { test, expect, SAM_MAP, openMap, openTool, toolbar } from './fixtures.js';

// Badges and goals (docs/API.md, "Badges and goals"). The seed (src/dev/mock/seed.js) gives
// the test user's map three goals: ten countries by the end of 2027 (8 of 10), a bucket
// list of its "want to go" countries (Japan, Peru, Iceland: 0 of 3) and the British Isles
// (reached). What the demo data has already earned is awarded quietly, so nothing is
// announced on the first visit. Sam's map (the test user views it) has one goal.

/** The luggage tag under the map's title: the nearest unmet goal. */
const goalTag = (page) => page.getByRole('button', { name: /\. Open badges and goals$/ });
/** A badge's sticker, found by its description. */
const sticker = (panel, description) => panel.getByRole('listitem').filter({ hasText: description });

test.describe('Badges and goals', () => {
  test('the owner sees the badges, adds a goal, and a new badge is announced', { tag: '@phone' }, async ({ page }) => {
    await openMap(page);
    await expect(goalTag(page)).toHaveAccessibleName(
      'Next goal: Ten countries by the end of 2027, 8 of 10 countries. Open badges and goals',
    );

    // The goal tag opens the panel (on a phone, the toolbar has no stamp for it)
    await goalTag(page).click();
    const panel = page.getByRole('dialog', { name: 'Badges and goals' });
    await expect(panel).toBeVisible();
    // The goals, with their progress
    await expect(panel.getByRole('article', { name: 'Ten countries by the end of 2027' })).toContainText('8 of 10 countries');
    await expect(panel.getByRole('article', { name: 'Our bucket list' })).toContainText('Still to go: Japan, Peru and Iceland');
    await expect(panel.getByRole('article', { name: 'Every country in the British Isles' })).toContainText('Reached');
    // Badges: earned ones say so with a date; the others how far along they are (words, not colour)
    await expect(sticker(panel, 'A first country in Europe.')).toContainText(/Earned \d+ \w+ \d{4}/);
    await expect(sticker(panel, 'A first country in Asia.')).toContainText('0 of 1');
    await expect(sticker(panel, 'A first landmark stamped')).toContainText(/Earned/);

    // A new goal: every country in Benelux (the Netherlands is done)
    await panel.getByRole('button', { name: 'Add a goal' }).click();
    const form = panel.getByRole('form', { name: 'New goal' });
    await expect(form.getByRole('combobox', { name: 'What kind of goal' })).toBeFocused();
    await form.getByRole('combobox', { name: 'What kind of goal' }).selectOption('Every country in a region or continent');
    await expect(form.getByText(/only counts once a photo taken there by the end of that day proves it/)).toBeVisible();
    await form.getByRole('button', { name: 'Add goal' }).click();
    await expect(form.getByRole('alert')).toHaveText('Choose a region or a continent.');
    await form.getByRole('combobox', { name: 'Which region or continent' }).selectOption('Benelux');
    await form.getByRole('button', { name: 'Add goal' }).click();
    const benelux = panel.getByRole('article', { name: 'Every country in Benelux' });
    await expect(benelux).toContainText('1 of 3 countries');
    await expect(benelux).toContainText('Still to go: Belgium and Luxembourg');
    await panel.getByRole('button', { name: 'Close Badges and goals' }).click();

    // Japan visited: Asia's badge is announced once, and the bucket list moves on
    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('searchbox', { name: 'Search countries' }).fill('japan');
    await list.getByRole('button', { name: 'Status for Japan: Want to go' }).click();
    await list.getByRole('combobox', { name: 'Status for Japan' }).selectOption('Visited');
    const news = page.getByRole('status').filter({ hasText: 'New badge: Asia.' });
    await expect(news).toBeVisible();
    await news.getByRole('button', { name: 'See badges and goals' }).click();
    const again = page.getByRole('dialog', { name: 'Badges and goals' });
    await expect(news).toBeHidden();
    await expect(sticker(again, 'A first country in Asia.')).toContainText(/Earned/);
    await expect(again.getByRole('article', { name: 'Our bucket list' })).toContainText('1 of 3 places');
    // With a deadline only a photo counts: Japan, ticked by hand, doesn't move this one
    await expect(again.getByRole('article', { name: 'Ten countries by the end of 2027' })).toContainText('8 of 10 countries');
  });

  test('a goal is changed and deleted, and a bucket list starts from the “want to go” countries', async ({ page }) => {
    await openMap(page);
    const panel = await openTool(page, 'Badges and goals', 'Badges and goals');

    await panel.getByRole('button', { name: 'Edit Ten countries by the end of 2027' }).click();
    const edit = panel.getByRole('form', { name: 'Change the goal' });
    await edit.getByRole('spinbutton', { name: 'How many countries' }).fill('8');
    await edit.getByRole('textbox', { name: 'Name it (optional)' }).fill('');
    await edit.getByRole('button', { name: 'Save goal' }).click();
    // Met as soon as it's asked for less: reached, under the name made from what it asks
    await expect(panel.getByRole('article', { name: '8 countries' })).toContainText('Reached');

    await panel.getByRole('button', { name: 'Delete 8 countries' }).click();
    await panel.getByRole('button', { name: 'Yes, delete' }).click();
    await expect(panel.getByRole('article', { name: '8 countries' })).toHaveCount(0);

    await panel.getByRole('button', { name: 'Add a goal' }).click();
    const form = panel.getByRole('form', { name: 'New goal' });
    await form.getByRole('combobox', { name: 'What kind of goal' }).selectOption('A bucket list of places');
    await form.getByRole('button', { name: 'Add your “want to go” countries (3)' }).click();
    await expect(form.getByRole('list', { name: 'Places on the list' }).getByRole('listitem')).toHaveText(['Japan', 'Peru', 'Iceland']);
    await form.getByRole('button', { name: 'Take Peru off the list' }).click();
    await form.getByRole('textbox', { name: 'Name it (optional)' }).fill('Next summer');
    await form.getByRole('button', { name: 'Add goal' }).click();
    await expect(panel.getByRole('article', { name: 'Next summer' })).toContainText('0 of 2 places');
  });

  test('a viewer sees the badges and goals but can’t change them', async ({ page }) => {
    await openMap(page, '/maps/map-sam');
    await expect(page.getByRole('application', { name: `${SAM_MAP}: world map` })).toBeVisible();
    await expect(goalTag(page)).toHaveAccessibleName('Next goal: All of Southeast Asia, 3 of 11 countries. Open badges and goals');
    const panel = await openTool(page, 'Badges and goals', 'Badges and goals');
    await expect(panel.getByRole('article', { name: 'All of Southeast Asia' })).toContainText('3 of 11 countries');
    await expect(sticker(panel, 'A first country in Oceania.')).toContainText(/Earned/);
    await expect(panel.getByRole('button', { name: 'Add a goal' })).toHaveCount(0);
    await expect(panel.getByRole('button', { name: /^(Edit|Delete) / })).toHaveCount(0);
    await expect(panel.getByRole('link', { name: 'Open the passport' })).toHaveAttribute('href', '/maps/map-sam/passport');
  });

  test('the goal tag can be hidden in the map settings', async ({ page }) => {
    await openMap(page);
    await expect(goalTag(page)).toBeVisible();
    const settings = await openTool(page, 'Map settings', 'Settings');
    // The switch is drawn over its input: press its name
    await settings.getByText('Goal progress tag', { exact: true }).click();
    await expect(settings.getByRole('switch', { name: 'Goal progress tag' })).not.toBeChecked();
    await expect(goalTag(page)).toHaveCount(0);
    // The panel is still a stamp away, and the stats link to it
    await expect(toolbar(page).getByRole('button', { name: 'Badges and goals', exact: true })).toBeVisible();
    await openTool(page, 'Travel statistics', 'Travel statistics');
    await page.getByRole('dialog', { name: 'Travel statistics' }).getByRole('button', { name: 'Badges and goals' }).click();
    await expect(page.getByRole('dialog', { name: 'Badges and goals' })).toBeVisible();
  });
});
