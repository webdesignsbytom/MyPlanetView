import { test, expect, SAM_MAP, openMap, openTool, toolButton } from './fixtures.js';

// Badges and goals (docs/API.md, "Badges and goals"). The seed (src/dev/mock/seed.js) gives
// the test user's map three goals: twenty-five countries by the end of 2027 (20 of 25: the
// demo couple's travels, on every continent but South America and Antarctica), a bucket
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
    // On a phone the tag is folded behind its flag stamp until asked for
    if (page.viewportSize().width < 768) {
      const flag = page.getByRole('button', { name: 'Next goal', exact: true });
      await expect(flag).toHaveAttribute('aria-pressed', 'false');
      await expect(goalTag(page)).toBeHidden();
      await flag.click();
      await expect(flag).toHaveAttribute('aria-pressed', 'true');
    }
    await expect(goalTag(page)).toHaveAccessibleName(
      'Next goal: Twenty-five countries by the end of 2027, 20 of 25 countries. Open badges and goals',
    );

    // The goal tag opens the panel (on a phone, the toolbar has no stamp for it)
    await goalTag(page).click();
    const panel = page.getByRole('dialog', { name: 'Badges and goals' });
    await expect(panel).toBeVisible();
    // The goals, with their progress
    await expect(panel.getByRole('article', { name: 'Twenty-five countries by the end of 2027' })).toContainText('20 of 25 countries');
    await expect(panel.getByRole('article', { name: 'Our bucket list' })).toContainText('Still to go: Japan, Peru and Iceland');
    await expect(panel.getByRole('article', { name: 'Every country in the British Isles' })).toContainText('Reached');
    // Badges: earned ones say so with a date; the others how far along they are (words, not colour)
    await expect(sticker(panel, 'A first country in Europe.')).toContainText(/Earned \d+ \w+ \d{4}/);
    await expect(sticker(panel, 'A first country in Asia.')).toContainText(/Earned/);
    await expect(sticker(panel, 'A first country in South America.')).toContainText('0 of 1');
    await expect(sticker(panel, 'A first landmark stamped')).toContainText(/Earned/);

    // A new goal: every country in Benelux (the Netherlands is done)
    await panel.getByRole('button', { name: 'Add a goal' }).click();
    const form = panel.getByRole('form', { name: 'New goal' });
    await expect(form.getByRole('combobox', { name: 'What kind of goal' })).toBeFocused();
    await form.getByRole('combobox', { name: 'What kind of goal' }).selectOption('Every country in a region or continent');
    await expect(form.getByText(/counts once you went there by the end of that day/)).toBeVisible();
    await form.getByRole('button', { name: 'Add goal' }).click();
    await expect(form.getByRole('alert')).toHaveText('Choose a region or a continent.');
    await form.getByRole('combobox', { name: 'Which region or continent' }).selectOption('Benelux');
    await form.getByRole('button', { name: 'Add goal' }).click();
    const benelux = panel.getByRole('article', { name: 'Every country in Benelux' });
    await expect(benelux).toContainText('1 of 3 countries');
    await expect(benelux).toContainText('Still to go: Belgium and Luxembourg');
    await panel.getByRole('button', { name: 'Close Badges and goals' }).click();

    // Peru visited: South America's badge, and with it six continents, announced once; the
    // bucket list moves on
    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('searchbox', { name: 'Search countries' }).fill('peru');
    await list.getByRole('button', { name: 'Status for Peru: Want to go' }).click();
    await list.getByRole('combobox', { name: 'Status for Peru' }).selectOption('Visited');
    const news = page.getByRole('status').filter({ hasText: 'New badges: South America and Six continents.' });
    await expect(news).toBeVisible();
    await news.getByRole('button', { name: 'See badges and goals' }).click();
    const again = page.getByRole('dialog', { name: 'Badges and goals' });
    await expect(news).toBeHidden();
    await expect(sticker(again, 'A first country in South America.')).toContainText(/Earned/);
    await expect(again.getByRole('article', { name: 'Our bucket list' })).toContainText('1 of 3 places');
    // A deadline counts the day a country was marked too (19 Nov 2026, the user's decision):
    // Peru, ticked by hand today, moves this one
    await expect(again.getByRole('article', { name: 'Twenty-five countries by the end of 2027' })).toContainText('21 of 25 countries');
  });

  // 25 Nov 2026, the user's wish: "when you earn a badge have the popup modal have a share
  // button. Share modal needs a preview of the post."
  test('a new badge is shared as a picture from its pop-up, the post previewed with its words', { tag: '@phone' }, async ({ page }) => {
    await openMap(page);
    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('searchbox', { name: 'Search countries' }).fill('peru');
    await list.getByRole('button', { name: 'Status for Peru: Want to go' }).click();
    await list.getByRole('combobox', { name: 'Status for Peru' }).selectOption('Visited');
    const news = page.getByRole('status').filter({ hasText: 'New badges: South America and Six continents.' });
    await news.getByRole('button', { name: 'Share a picture' }).click();
    await expect(news).toBeHidden();

    // Two at once: the first to start with, the other a press away
    const dialog = page.getByRole('dialog', { name: 'Share what you earned' });
    const choice = dialog.getByRole('group', { name: 'Which one to share' });
    await expect(choice.getByRole('button', { name: 'South America' })).toHaveAttribute('aria-pressed', 'true');
    await expect(choice.getByRole('button', { name: 'Six continents' })).toHaveAttribute('aria-pressed', 'false');
    // The post: the badge's picture, its words under it
    const post = dialog.getByRole('region', { name: 'Preview of your post' });
    const card = post.locator('img[data-share-card]');
    await expect(card).toHaveAccessibleName(/^Your share card: South America, \d+ countries, \d+ continents/);
    await expect.poll(() => card.evaluate((img) => [img.naturalWidth, img.naturalHeight].join('×'))).toBe('1080×1350');
    const words = post.getByRole('textbox', { name: 'Words to go with it' });
    await expect(words).toHaveValue(/^New badge on my travel map: South America! \d+ countries so far\.$/);

    await choice.getByRole('button', { name: 'Six continents' }).click();
    await expect(card).toHaveAccessibleName(/^Your share card: Six continents,/);
    await expect(words).toHaveValue(/^New badge on my travel map: Six continents! /);
    await words.fill('Every continent people live on!');
    await expect(dialog.getByRole('button', { name: 'Copy the words' })).toBeEnabled();

    const download = page.waitForEvent('download');
    await dialog.getByRole('button', { name: 'Save the picture' }).click();
    expect((await download).suggestedFilename()).toBe('my-planet-view-badge-continents-all.png');
    await expect(dialog.getByText('Saved to your downloads.')).toBeVisible();
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
  });

  // The country collections (24 Nov 2026, the user's wish): bronze, silver and gold for a
  // quarter, half and all of a country's landmarks stamped, each medal shared as a picture
  test('a country’s landmarks earn its medals, shown on the suitcase and shared as a picture', { tag: '@phone' }, async ({ page }) => {
    await openMap(page);
    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('button', { name: 'Malta', exact: true }).click();
    const malta = page.getByRole('dialog', { name: 'Malta' });
    // Malta has three landmarks: bronze at one, silver at two, gold at three
    const boxes = malta.getByRole('checkbox', { name: /^Been to / });
    await expect(boxes).toHaveCount(3);
    await boxes.nth(0).check();
    await expect(page.getByRole('status').filter({ hasText: 'Bronze for Malta' })).toBeVisible();
    await boxes.nth(1).check();
    const news = page.getByRole('status').filter({ hasText: 'Silver for Malta' });
    await expect(news).toBeVisible();
    await news.getByRole('button', { name: 'See badges and goals' }).click();

    const panel = page.getByRole('dialog', { name: 'Badges and goals' });
    await expect(panel.getByRole('heading', { name: 'Country collections' })).toBeVisible();
    const row = panel.locator('[data-collection="MT"]');
    await expect(row).toContainText('2 of 3 landmarks stamped');
    await expect(row.locator('[data-medal="bronze"]')).toContainText(/Earned \d+ \w+ \d{4}/);
    await expect(row.locator('[data-medal="silver"]')).toContainText(/Earned/);
    await expect(row.locator('[data-medal="gold"]')).toContainText('2 of 3');

    // The best medal as a picture to post
    await row.getByRole('button', { name: 'Share your silver medal for Malta' }).click();
    const card = page.getByRole('dialog', { name: 'Share your medal' });
    await expect(card.locator('[data-share-card]')).toHaveAccessibleName('Your share card: Malta, 2 landmarks stamped, 3 landmarks in Malta');
    await expect(card.getByRole('button', { name: /^(Share|Save the picture)$/ }).first()).toBeEnabled();
  });

  // Each group of badges folds away under its heading's arrow (24 Nov 2026, the user's wish:
  // to save space), and stays folded for the visit
  test('a group of badges folds away and opens again, and stays as it was left', { tag: '@phone' }, async ({ page }) => {
    await openMap(page);
    let panel = await openTool(page, 'Badges and goals', 'Badges and goals');
    const continents = panel.getByRole('button', { name: 'Continents', exact: true });
    await expect(continents).toHaveAttribute('aria-expanded', 'true');
    await expect(sticker(panel, 'A first country in Europe.')).toBeVisible();
    // Its arrow at the far right of the suitcase, the words at the left (25 Nov 2026, the user's wish)
    const [arrow, heading] = await Promise.all([continents.locator('svg').boundingBox(), continents.boundingBox()]);
    expect(heading.x + heading.width - (arrow.x + arrow.width)).toBeLessThan(2);
    expect(arrow.x).toBeGreaterThan(heading.x + heading.width / 2);

    await continents.click();
    await expect(continents).toHaveAttribute('aria-expanded', 'false');
    await expect(sticker(panel, 'A first country in Europe.')).toBeHidden();
    // The heading stays, and the other groups are still open
    await expect(panel.getByRole('heading', { name: 'Continents' })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Countries', exact: true })).toHaveAttribute('aria-expanded', 'true');

    // Closed and opened again, the panel is as it was left
    await panel.getByRole('button', { name: 'Close Badges and goals' }).click();
    panel = await openTool(page, 'Badges and goals', 'Badges and goals');
    const again = panel.getByRole('button', { name: 'Continents', exact: true });
    await expect(again).toHaveAttribute('aria-expanded', 'false');
    await expect(sticker(panel, 'A first country in Europe.')).toBeHidden();

    await again.click();
    await expect(again).toHaveAttribute('aria-expanded', 'true');
    await expect(sticker(panel, 'A first country in Europe.')).toBeVisible();
  });

  test('a goal is changed and deleted, and a bucket list starts from the “want to go” countries', async ({ page }) => {
    await openMap(page);
    const panel = await openTool(page, 'Badges and goals', 'Badges and goals');

    await panel.getByRole('button', { name: 'Edit Twenty-five countries by the end of 2027' }).click();
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
    await expect(await toolButton(page, 'Badges and goals')).toBeVisible();
    await openTool(page, 'Travel statistics', 'Travel statistics');
    await page.getByRole('dialog', { name: 'Travel statistics' }).getByRole('button', { name: 'Badges and goals' }).click();
    await expect(page.getByRole('dialog', { name: 'Badges and goals' })).toBeVisible();
  });

  test('a couple shares its badges; on a family’s map each traveller has their own, from the completed trips they were on', async ({ page }) => {
    await openMap(page);
    // A couple travels together: one set of badges, no one's own (18 Nov 2026, the user's wish)
    let panel = await openTool(page, 'Badges and goals', 'Badges and goals');
    await expect(panel.getByRole('group', { name: 'Whose badges' })).toHaveCount(0);

    const settings = await openTool(page, 'Map settings', 'Settings');
    await settings.getByRole('tab', { name: 'This map' }).click();
    const thisMap = settings.getByRole('tabpanel', { name: 'This map' });
    await thisMap.getByText('A family', { exact: true }).click();
    await thisMap.getByRole('button', { name: 'Save map' }).click();
    await expect(thisMap.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();

    panel = await openTool(page, 'Badges and goals', 'Badges and goals');
    const whose = panel.getByRole('group', { name: 'Whose badges' });
    await expect(whose.getByRole('button', { name: 'Everyone' })).toHaveAttribute('aria-pressed', 'true');

    // Alex's first completed trip in Europe was the Amsterdam weekend (ending 14 March 2016);
    // Alex was on none in South America
    await whose.getByRole('button', { name: 'Alex' }).click();
    await expect(whose.getByRole('button', { name: 'Alex' })).toHaveAttribute('aria-pressed', 'true');
    await expect(panel.getByText(/From the completed trips Alex was on\./)).toBeVisible();
    await expect(sticker(panel, 'A first country in Europe.')).toContainText('Earned 14 Mar 2016');
    await expect(sticker(panel, 'A first country in South America.')).toContainText('0 of 1');
    // Travel badges only: no landmarks or photos for one person
    await expect(sticker(panel, 'A first landmark stamped')).toHaveCount(0);

    await whose.getByRole('button', { name: 'Everyone' }).click();
    await expect(sticker(panel, 'A first landmark stamped')).toContainText(/Earned/);
  });
});
