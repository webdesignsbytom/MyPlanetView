import { test, expect, HOME_MAP, SAM_MAP, SAM_SHARE_CODE, goInApp, openMap, openTool, playMyWorld, signOut } from './fixtures.js';

// The slideshows (docs/FEATURE-PLAN.md, "Slideshows"). The test user's map has 16 photos
// (one hidden, which its owner sees); oldest taken first they start in the Netherlands
// (2016), then Spain (2018) and the United States. Its dated moments come between them in
// date order: "Charlie was born" (1990) and "Moved to Dublin" (2012) open the show, and
// "Saw flamenco in Granada" (August 2018) follows Spain's card.

// What's on screen in words, for screen readers: the footer shows only the controls
// (16 Nov 2026, the user's wish), with this live region out of sight
const saidIn = (show) => show.locator('footer [aria-live]');

/**
 * The captions (alt texts) of the next `count` photos, stepping on with the arrow key
 * (title cards skipped). The stage says which slide it shows (`data-slide-id`).
 */
async function photosInOrder(page, show, count) {
  const stage = show.locator('[data-slide-id]');
  await expect(stage).not.toHaveAttribute('data-slide-id', '');
  const seen = [];
  while (seen.length < count) {
    const id = await stage.getAttribute('data-slide-id');
    if ((await stage.getAttribute('data-slide-kind')) === 'photo') seen.push(await stage.locator('img').getAttribute('alt'));
    await page.keyboard.press('ArrowRight');
    await expect(stage).not.toHaveAttribute('data-slide-id', id);
  }
  return seen;
}

test.describe('Slideshows', () => {
  test('the whole map plays oldest first: steps, pauses, plays on and closes', async ({ page }) => {
    await openMap(page);
    // "Play my world" is the photo album's (24 Nov 2026), pressed with the keyboard
    const album = await openTool(page, 'Photo album', 'Photo album');
    const stamp = album.getByRole('button', { name: 'Play my world', exact: true });
    await stamp.focus();
    await page.keyboard.press('Enter');
    const show = page.getByRole('dialog', { name: `Slideshow: ${HOME_MAP}` });
    await expect(show).toBeVisible();

    // It plays at once, from the oldest moment (its kind, date, place and story), with
    // focus on Pause: Space pauses it
    const born = show.getByRole('article', { name: 'Moment: Charlie was born' });
    await expect(born).toBeVisible();
    await expect(born.getByText('Born · 1990')).toBeVisible();
    await expect(born.getByText('Manchester, United Kingdom')).toBeVisible();
    await expect(born.getByText('In a snowstorm, apparently.')).toBeVisible();
    await expect(show.getByRole('button', { name: 'Pause', exact: true })).toBeFocused();
    await page.keyboard.press('Space');
    const play = show.getByRole('button', { name: 'Play', exact: true });
    await expect(play).toBeVisible();

    // Paused, it waits for you: the next moment, then the first country's title card (its
    // poster and name), then the first photo (its count, place and day for screen
    // readers only: nothing but the controls under it)
    const next = show.getByRole('button', { name: 'Next', exact: true });
    await next.click();
    await expect(show.getByRole('article', { name: 'Moment: Moved to Dublin' }).getByText('Moved here · September 2012')).toBeVisible();
    await next.click();
    await expect(show.getByText('First stop', { exact: true })).toBeVisible();
    await expect(show.getByRole('img', { name: 'Travel poster for Netherlands' })).toBeVisible();
    await next.click();
    await expect(show.getByRole('img', { name: 'Canals at dusk' })).toBeVisible();
    await expect(saidIn(show)).toContainText('Photo 1 of 16. Netherlands · Amsterdam');
    await expect(saidIn(show)).toContainText('12 Mar 2016');

    // The arrow keys: on to Spain's card, the moment there, then its photo, and back
    await page.keyboard.press('ArrowRight');
    await expect(show.getByText('Next stop', { exact: true })).toBeVisible();
    await expect(show.getByRole('img', { name: 'Travel poster for Spain' })).toBeVisible();
    await page.keyboard.press('ArrowRight');
    const flamenco = show.getByRole('article', { name: 'Moment: Saw flamenco in Granada' });
    await expect(flamenco.getByText('Alhambra, Spain')).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(show.getByRole('img', { name: 'Granada' })).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(flamenco).toBeVisible();

    // Still paused a while later; then playing at 3 seconds a photo moves on by itself
    // (a moment stays up 6 seconds, long enough to read)
    await page.waitForTimeout(3500);
    await expect(flamenco).toBeVisible();
    await show.getByRole('button', { name: '3 seconds a photo' }).click();
    await expect(show.getByRole('button', { name: '3 seconds a photo' })).toHaveAttribute('aria-pressed', 'true');
    await play.click();
    await expect(show.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
    await expect(show.getByRole('img', { name: 'Granada' })).toBeVisible({ timeout: 8000 });

    // Escape closes it, and focus goes back to the stamp
    await page.keyboard.press('Escape');
    await expect(show).toBeHidden();
    await expect(stamp).toBeFocused();
  });

  test('the shuffle plays the photos in another order', async ({ page }) => {
    await openMap(page);
    const show = await playMyWorld(page);
    await show.getByRole('button', { name: 'Pause', exact: true }).click();
    const taken = await photosInOrder(page, show, 6);
    expect(taken).toEqual([
      'Canals at dusk',
      'Granada',
      'Lower Manhattan from Jersey City',
      'The Golden Gate from Crissy Field',
      'Evening by the Seine',
      'The Cliffs of Moher',
    ]);

    const shuffle = show.getByRole('button', { name: 'Shuffle', exact: true });
    await shuffle.click();
    await expect(shuffle).toHaveAttribute('aria-pressed', 'true');
    await expect(show.locator('[data-slide-id]')).toHaveAttribute('data-slide-index', '0');
    const shuffled = await photosInOrder(page, show, 6);
    expect(shuffled).toHaveLength(6);
    expect(shuffled).not.toEqual(taken);
  });

  test('a country’s photos, and a trip’s, play from their own pages', async ({ page }) => {
    await openMap(page);
    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('searchbox', { name: 'Search countries' }).fill('france');
    await list.getByRole('button', { name: 'France', exact: true }).click();
    const france = page.getByRole('dialog', { name: 'France' });
    await france.getByRole('button', { name: 'Play slideshow' }).click();
    const show = page.getByRole('dialog', { name: 'Slideshow: France' });
    // One country: no title cards. The engagement (2019) came before its oldest photo
    await expect(show.getByRole('article', { name: 'Moment: Got engaged at the Eiffel Tower' })).toBeVisible();
    await show.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(show.getByRole('img', { name: 'Evening by the Seine' })).toBeVisible();
    await expect(saidIn(show)).toContainText('Photo 1 of 3');
    await show.getByRole('button', { name: 'Close the slideshow' }).click();
    await expect(show).toBeHidden();
    await expect(france).toBeVisible();

    await page.goto('/trips/trip-italy');
    await page.getByRole('button', { name: 'Slideshow of Italian summer' }).click();
    const trip = page.getByRole('dialog', { name: 'Slideshow: Italian summer' });
    await expect(trip.getByRole('img', { name: 'First morning in Rome' })).toBeVisible();
    await expect(saidIn(trip)).toContainText('Photo 1 of 3');
  });

  test('a share link’s map plays for someone signed out', async ({ page }) => {
    await signOut(page);
    await goInApp(page, `/shared/${SAM_SHARE_CODE}`);
    await expect(page.getByRole('application', { name: `${SAM_MAP}: world map` })).toBeVisible();
    const show = await playMyWorld(page);
    await expect(show.getByText('First stop', { exact: true })).toBeVisible();
    await show.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(show.getByRole('img', { name: 'Temple roofs' })).toBeVisible();
    await expect(saidIn(show)).toContainText('Photo 1 of 1');
  });
});
