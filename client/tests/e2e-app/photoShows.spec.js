import { test, expect, HOME_MAP, MOCK_STORE_KEY, mapReady, openMap, openTool, pressTool, signOut } from './fixtures.js';

// Slideshows of chosen photos, shared by a link of their own (25 Nov 2026, the user's wish:
// "share just a slideshow of selected photos"; docs/API.md "Photo slideshows"). An editor picks
// photos in the photo album, a country's ticket or a trip's page; whoever opens the link
// watches just those, starting with the title, and nothing else of the map. They're saved on
// the map (27 Nov 2026, the user's wish), 2, 10 or 25 by its plan, and the photo album's "Saved
// slideshows" plays them again. The seed has one, "Our favourite photos" (SPN2-SHW8-TRP5: the
// Colosseum, the Eiffel Tower and Amsterdam), on the test user's Business map: 1 of 10.

const SEEDED = 'SPN2-SHW8-TRP5';
const CODE_LINK = /\/show\/[2-9A-Z]{4}-[2-9A-Z]{4}-[2-9A-Z]{4}$/;

/** Changes the mock's store (`edit(db, value)` runs in the page), then reloads. */
async function editStore(page, edit, arg) {
  await page.evaluate(
    ({ key, source, value }) => {
      const db = JSON.parse(localStorage.getItem(key));
      new Function('db', 'value', source)(db, value);
      localStorage.setItem(key, JSON.stringify(db));
    },
    { key: MOCK_STORE_KEY, source: `(${edit.toString()})(db, value);`, value: arg },
  );
  await page.reload();
}

/** The slideshow over the page, paused, so the arrow keys step it. */
async function pausedShow(page, title) {
  const show = page.getByRole('dialog', { name: title });
  await expect(show).toBeVisible();
  await show.getByRole('button', { name: 'Pause', exact: true }).click();
  return { show, stage: show.locator('[data-slide-kind]') };
}

test.describe('Shared slideshows', () => {
  test('an editor picks photos in the album and gets a link that plays just those', { tag: '@phone' }, async ({ page }) => {
    await openMap(page);
    const album = await openTool(page, 'Photo album', 'Photo album');
    await album.getByRole('button', { name: 'Make a slideshow' }).click();
    const maker = page.getByRole('dialog', { name: 'Make a slideshow' });
    await expect(maker.getByText('None chosen yet')).toBeVisible();
    await expect(maker.getByText('1 of 10 saved on this map')).toBeVisible();
    await expect(maker.getByRole('button', { name: 'Save the slideshow' })).toBeDisabled();

    await maker.getByRole('textbox', { name: 'Title' }).fill('Paris and Rome');
    await maker.getByRole('button', { name: 'Evening by the Seine' }).click();
    await maker.getByRole('button', { name: 'First morning in Rome' }).click();
    await expect(maker.getByText('2 chosen')).toBeVisible();
    // A hidden photo can't go in
    await expect(maker.getByRole('button', { name: /hidden: it can’t go in a slideshow/ })).toBeDisabled();
    await maker.getByRole('radio', { name: 'The order I chose them in' }).check();
    await maker.getByRole('combobox', { name: 'Each photo stays up for' }).selectOption('3 seconds');
    await maker.getByRole('button', { name: 'Save the slideshow' }).click();

    await expect(maker.getByRole('status').first()).toContainText('“Paris and Rome” is saved: 2 photos');
    const link = await maker.getByRole('textbox', { name: 'Link to Paris and Rome' }).inputValue();
    expect(link).toMatch(CODE_LINK);
    await expect(maker.getByRole('link', { name: 'Open Paris and Rome (opens in a new tab)' })).toHaveAttribute('target', '_blank');
    await expect(maker.getByRole('button', { name: 'Copy the link to Paris and Rome' })).toBeVisible();
    await maker.getByRole('button', { name: 'Done' }).click();
    await expect(maker).toBeHidden();

    // Someone with the link (not signed in): it plays at once, the title first, then just
    // those photos in the order chosen, at the show's speed, and asks them to make their own map
    await signOut(page);
    await page.goto(new URL(link).pathname);
    const { show, stage } = await pausedShow(page, 'Paris and Rome');
    await expect(stage).toHaveAttribute('data-slide-kind', 'intro');
    await expect(stage).toContainText('Paris and Rome');
    await expect(stage).toContainText('2 photos');
    await expect(show.getByRole('button', { name: '3 seconds a photo' })).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(stage).toHaveAttribute('data-slide-id', 'photo-eiffel');
    await expect(show.getByRole('img', { name: 'Evening by the Seine' })).toBeVisible();
    await page.keyboard.press('ArrowRight');
    await expect(stage).toHaveAttribute('data-slide-id', 'photo-colosseum');
    await page.keyboard.press('ArrowRight');
    await expect(stage).toHaveAttribute('data-slide-kind', 'end');
    await expect(show.getByRole('link', { name: 'Make your own travel map, free' })).toBeVisible();
    // Nothing else of the map
    await expect(page.getByText(HOME_MAP)).toHaveCount(0);

    // Closed: the page, to play it again
    await show.getByRole('button', { name: 'Close the slideshow' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Paris and Rome' })).toBeVisible();
    await expect(page.getByText('2 photos', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Play the slideshow' }).click();
    await expect(page.getByRole('dialog', { name: 'Paris and Rome' })).toBeVisible();
  });

  test('a country’s ticket and a trip’s page start one with their name as its title', async ({ page }) => {
    await openMap(page);
    const list = await openTool(page, 'Country list', 'Countries');
    await list.getByRole('searchbox', { name: 'Search countries' }).fill('france');
    await list.getByRole('button', { name: 'France', exact: true }).click();
    const france = page.getByRole('dialog', { name: 'France' });
    await france.getByRole('button', { name: 'Make a slideshow' }).click();
    let maker = page.getByRole('dialog', { name: 'Make a slideshow' });
    await expect(maker.getByRole('textbox', { name: 'Title' })).toHaveValue('France');
    // France's photos only
    await expect(maker.getByRole('button', { name: 'Evening by the Seine' })).toBeVisible();
    await expect(maker.getByRole('button', { name: 'First morning in Rome' })).toHaveCount(0);
    await maker.getByRole('button', { name: 'Choose all' }).click();
    await maker.getByRole('button', { name: 'Save the slideshow' }).click();
    await expect(maker.getByRole('status').first()).toContainText('“France” is saved');
    await maker.getByRole('button', { name: 'Done' }).click();

    await page.goto('/trips/trip-italy');
    await expect(page.getByRole('heading', { level: 1, name: 'Italian summer' })).toBeVisible();
    await page.getByRole('button', { name: 'Make a slideshow' }).click();
    maker = page.getByRole('dialog', { name: 'Make a slideshow' });
    await expect(maker.getByRole('textbox', { name: 'Title' })).toHaveValue('Italian summer');
    await expect(maker.getByRole('button', { name: 'First morning in Rome' })).toBeVisible();
  });

  test('the share dialog lists the map’s slideshows: renamed, given a new link, deleted', async ({ page }) => {
    await openMap(page);
    await pressTool(page, 'Share this map');
    const dialog = page.getByRole('dialog', { name: `Share “${HOME_MAP}”` });
    const section = dialog.getByRole('region', { name: 'Slideshows' });
    await expect(section.getByText('Our favourite photos')).toBeVisible();
    await expect(section.getByText(/3 photos · made/)).toBeVisible();
    await expect(section.getByText('1 of 10 saved on this map')).toBeVisible();
    await expect(section.getByRole('textbox', { name: 'Link to Our favourite photos' })).toHaveValue(new RegExp(`/show/${SEEDED}$`));

    await section.getByRole('button', { name: 'Rename' }).click();
    await section.getByRole('textbox', { name: 'New title' }).fill('Best of us');
    await section.getByRole('button', { name: 'Save' }).click();
    await expect(section.getByText('Best of us', { exact: true })).toBeVisible();

    await section.getByRole('button', { name: 'New link' }).click();
    await section.getByRole('button', { name: 'Make a new link' }).click();
    await expect(section.getByText('A new link is ready. The old one no longer works.')).toBeVisible();
    const fresh = await section.getByRole('textbox', { name: 'Link to Best of us' }).inputValue();
    expect(fresh).toMatch(CODE_LINK);
    expect(fresh).not.toContain(SEEDED);

    await section.getByRole('button', { name: 'Delete' }).click();
    await section.getByRole('button', { name: 'Delete it' }).click();
    await expect(section.getByText(/No slideshows saved yet/)).toBeVisible();
    await expect(section.getByText('0 of 10 saved on this map')).toBeVisible();

    // The old link, and the deleted show's, say it's gone
    await page.goto(`/show/${SEEDED}`);
    await expect(page.getByRole('alert')).toHaveText('This slideshow isn’t there any more. Ask whoever sent it for a new link.');
    await page.goto(new URL(fresh).pathname);
    await expect(page.getByRole('alert')).toHaveText('This slideshow isn’t there any more. Ask whoever sent it for a new link.');
  });

  // 27 Nov 2026, the user's wish: "We need to be able to save slide shows. 2, 10, 25 is the
  // amount per tier", each a link to its photos, never copies
  test('the photo album keeps the saved slideshows: played again, and counted against the map’s plan', async ({ page }) => {
    await openMap(page);
    // On Economy, with a second slideshow saved: the map keeps 2, and has 2
    await editStore(page, (db) => {
      db.subscriptions = db.subscriptions.filter((s) => s.userId !== 'mock-user');
      const seeded = db.photoShows.find((s) => s.id === 'show-home');
      const day = '2026-11-20T10:00:00.000Z';
      db.photoShows.push({ ...seeded, id: 'show-second', code: 'SCND2SHW8TW2', title: 'Just Amsterdam', photoIds: ['photo-dam'], createdAt: day, updatedAt: day });
    });
    await mapReady(page);
    const album = await openTool(page, 'Photo album', 'Photo album');

    // Full: it says so before any photo is chosen, and nothing can be saved
    await album.getByRole('button', { name: 'Make a slideshow' }).click();
    let maker = page.getByRole('dialog', { name: 'Make a slideshow' });
    await expect(maker.getByText('2 of 2 slideshows saved on this map. Delete one, or upgrade to save more.')).toBeVisible();
    await expect(maker.getByRole('link', { name: 'See the plans' })).toHaveAttribute('href', '/pricing');
    await maker.getByRole('button', { name: 'Evening by the Seine' }).click();
    await expect(maker.getByRole('button', { name: 'Save the slideshow' })).toBeDisabled();
    await maker.getByRole('button', { name: 'Cancel' }).click();
    await expect(maker).toBeHidden();

    // The saved ones: each plays again, as its link plays it
    await album.getByRole('button', { name: 'Saved slideshows' }).click();
    const saved = page.getByRole('dialog', { name: 'Saved slideshows' });
    await expect(saved.getByText('2 of 2 saved on this map')).toBeVisible();
    await expect(saved.getByText('Just Amsterdam', { exact: true })).toBeVisible();
    await saved.getByRole('button', { name: 'Play Our favourite photos' }).click();
    const { show, stage } = await pausedShow(page, 'Our favourite photos');
    await expect(stage).toHaveAttribute('data-slide-kind', 'intro');
    // Its photos in first: until then there's no next slide, and the key did nothing (CI, 27 Nov 2026)
    await expect(show.getByRole('button', { name: 'Next', exact: true })).toBeEnabled();
    await page.keyboard.press('ArrowRight');
    await expect(stage).toHaveAttribute('data-slide-id', 'photo-colosseum');
    await show.getByRole('button', { name: 'Close the slideshow' }).click();
    await expect(show).toBeHidden();

    // One deleted makes room for another
    const second = saved.locator('[data-photo-show="show-second"]');
    await second.getByRole('button', { name: 'Delete' }).click();
    await second.getByRole('button', { name: 'Delete it' }).click();
    await expect(saved.getByText('1 of 2 saved on this map')).toBeVisible();
    await saved.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(saved).toBeHidden();

    await album.getByRole('button', { name: 'Make a slideshow' }).click();
    maker = page.getByRole('dialog', { name: 'Make a slideshow' });
    await expect(maker.getByText('1 of 2 saved on this map')).toBeVisible();
    await maker.getByRole('button', { name: 'Evening by the Seine' }).click();
    await maker.getByRole('button', { name: 'Save the slideshow' }).click();
    await expect(maker.getByRole('status').first()).toContainText('is saved: 1 photo');
  });
});
