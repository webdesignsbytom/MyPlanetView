import { test, expect, HOME_MAP, HOME_SHARE_CODE, SAM_MAP, expectMapOpen, expectStats, goInApp, openMap, openStats, openSwitcher, openTool, pressTool, showTools, toolbar } from './fixtures.js';

// The statistics' Trips tile (the map's own trips and the group trips added to it)
const tripsCount = (page) => {
  const stats = page.getByRole('dialog', { name: 'Travel statistics' });
  return stats.locator('div').filter({ has: page.getByText('Trips', { exact: true }) }).last().getByRole('definition');
};

// Group trips (docs/API.md "Group trips"): a trip shown on other people's maps ("Add to my
// map"), its countries marked there when it's done. Seeded (src/dev/mock/seed.js): the
// test user views Sam's map, so is on its completed South-East Asia loop (Thailand,
// Vietnam, Cambodia); Alex added Tom's planned stag do in Prague to the test user's map,
// and the test user isn't on that trip.

const myMapsCard = (page) => page.getByRole('region', { name: 'On your maps' });
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** On a trip's page: "Add to my map", then the map. */
async function addToMyMap(page, mapName) {
  const card = myMapsCard(page);
  await card.getByRole('button', { name: 'Add to my map' }).click();
  await card.getByRole('list', { name: 'Your maps', exact: true }).getByRole('button', { name: `Add to ${mapName}` }).click();
  await expect(card.getByRole('list', { name: 'Your maps showing this trip' }).getByText(mapName, { exact: true })).toBeVisible();
  return card;
}

test.describe('Group trips', () => {
  test('a done trip added to your map marks its countries there; taking it off keeps them', { tag: '@phone' }, async ({ page }) => {
    await page.goto('/trips/trip-sam-asia');
    await expect(page.getByRole('heading', { level: 1, name: 'South-East Asia loop' })).toBeVisible();
    const card = myMapsCard(page);
    await card.getByRole('button', { name: 'Add to my map' }).click();
    // The maps the test user owns or edits, not the trip's own (Sam's, which they only view)
    const choices = card.getByRole('list', { name: 'Your maps', exact: true });
    await expect(choices.getByRole('listitem')).toHaveText([new RegExp(`^${escape(HOME_MAP)}`)]);
    await choices.getByRole('button', { name: `Add to ${HOME_MAP}` }).click();
    await expect(card.getByText(`Added to ${HOME_MAP}, with its countries marked there.`)).toBeVisible();
    const showing = card.getByRole('list', { name: 'Your maps showing this trip' });
    await expect(showing.getByRole('listitem')).toHaveText([new RegExp(`^${escape(HOME_MAP)}\\s*Take it off$`)]);

    // On the map: Thailand, Vietnam and Cambodia, and the trip, from Sam's map, which opens
    await openMap(page);
    await expectStats(page, '11 countries, 3 continents, 16 photos');
    const trips = await openTool(page, 'Trips', 'Trips');
    const link = trips.getByRole('link', { name: /South-East Asia loop/ });
    await expect(link).toContainText('Group trip');
    await expect(link).toContainText(`From ${SAM_MAP}`);
    await expect(link).toContainText('3 stops · 1 photo');
    await link.click();

    // Taken off: the countries stay
    await expect(page).toHaveURL(/\/trips\/trip-sam-asia$/);
    await myMapsCard(page).getByRole('button', { name: `Take it off ${HOME_MAP}` }).click();
    await expect(myMapsCard(page).getByText(`Taken off ${HOME_MAP}. The countries it marked there stay.`)).toBeVisible();
    await expect(myMapsCard(page).getByRole('list', { name: 'Your maps showing this trip' })).toHaveCount(0);
    await openMap(page);
    await expectStats(page, '11 countries, 3 continents, 16 photos');
    const after = await openTool(page, 'Trips', 'Trips');
    await expect(after.getByText('South-East Asia loop')).toHaveCount(0);
  });

  test('a planned trip added to another of your maps marks its countries there once it’s done', async ({ page }) => {
    // A second map of the test user's own
    await openMap(page);
    await expectMapOpen(page, HOME_MAP);
    const switcher = await openSwitcher(page);
    await switcher.getByRole('button', { name: 'New map' }).click();
    await switcher.getByText('Just me', { exact: true }).click();
    await switcher.getByRole('textbox', { name: 'Map name' }).fill('Road trips');
    await switcher.getByRole('button', { name: 'Create map' }).click();
    await expectMapOpen(page, 'Road trips');
    const roadTrips = page.url();

    // Japan in spring (planned, on the test user's own map) added to it: nothing marked yet
    await page.goto('/trips/trip-japan');
    const card = await addToMyMap(page, 'Road trips');
    await expect(card.getByText('Added to Road trips. Its countries are marked there once the trip is done.')).toBeVisible();
    // The trip's own map isn't offered
    await card.getByRole('button', { name: 'Add to my map' }).click();
    await expect(card.getByRole('list', { name: 'Your maps', exact: true }).getByRole('listitem')).toHaveText([/^Road trips\s*Already on it$/]);

    // Done: Japan is marked on both maps
    await page.getByRole('button', { name: 'Edit trip' }).click();
    const edit = page.getByRole('region', { name: 'Edit trip' });
    await edit.getByRole('combobox', { name: 'Status' }).selectOption('Done');
    await edit.getByRole('button', { name: 'Save trip' }).click();
    await expect(edit).toBeHidden();

    await page.goto(roadTrips);
    await expectStats(page, '1 country, 1 continent, 0 photos');
    const trips = await openTool(page, 'Trips', 'Trips');
    await expect(trips.getByRole('link', { name: /Japan in spring/ })).toContainText(`From ${HOME_MAP}`);
    await openMap(page);
    await expectStats(page, '9 countries, 3 continents, 16 photos');
  });

  test('a group trip you aren’t on shows only its title, dates, status and countries, and its owner can take it off', async ({ page }) => {
    await openMap(page);
    await openStats(page);
    // Trips: the map's own two and the group trip
    await expect(tripsCount(page)).toHaveText('3');

    const trips = await openTool(page, 'Trips', 'Trips');
    const stag = trips.getByRole('listitem').filter({ hasText: 'Stag do in Prague' });
    await expect(stag).toContainText('Group trip');
    await expect(stag).toContainText("From Tom's map");
    await expect(stag).toContainText('Planning · 14 May 2027 – 17 May 2027 · Czechia');
    await expect(stag).not.toContainText('stop');
    await expect(stag.getByRole('link')).toHaveCount(0);

    // The map's owner takes it off, without being on the trip
    await stag.getByRole('button', { name: 'Take Stag do in Prague off this map' }).click();
    await expect(trips.getByText('Stag do in Prague')).toHaveCount(0);
    await openStats(page);
    await expect(tripsCount(page)).toHaveText('2');

    // Its page is still closed to them
    await page.goto('/trips/trip-tom-stag');
    await expect(page.getByRole('heading', { level: 1, name: 'Trip not found' })).toBeVisible();
  });

  test('through a share link, group trips are always in their limited form', async ({ page }) => {
    // The test user is on Sam's trip, and adds it to their map, then turns its link on
    await page.goto('/trips/trip-sam-asia');
    await addToMyMap(page, HOME_MAP);
    await openMap(page);
    await pressTool(page, 'Share this map');
    const dialog = page.getByRole('dialog', { name: `Share “${HOME_MAP}”` });
    await dialog.getByRole('combobox', { name: 'General access' }).selectOption('Anyone with the link');
    await expect(dialog.getByRole('combobox', { name: 'General access' })).toHaveValue('ANYONE_WITH_LINK');
    await dialog.getByRole('button', { name: 'Done' }).click();

    // Through the link, even for someone on the trip: no counts, no cover, no link
    await goInApp(page, `/shared/${HOME_SHARE_CODE}`);
    // The same map's page stays on screen while the share page loads: wait for the latter
    // (no sharing or switching from a share link)
    await expect(page).toHaveURL(new RegExp(`/shared/${HOME_SHARE_CODE}$`));
    // With the phone's menu open, so a tool that's missing is really missing
    await showTools(page);
    await expect(toolbar(page).getByRole('button', { name: 'Share this map', exact: true })).toHaveCount(0);
    await expect(page.getByRole('application', { name: `${HOME_MAP}: world map` })).toBeVisible();
    const trips = await openTool(page, 'Trips', 'Trips');
    await expect(trips.getByRole('link')).toHaveCount(0);
    const asia = trips.getByRole('listitem').filter({ hasText: 'South-East Asia loop' });
    await expect(asia).toContainText(`From ${SAM_MAP}`);
    await expect(asia).toContainText('Done · 8 Jan 2024 – 1 Mar 2024 · Thailand, Vietnam, Cambodia');
    await expect(asia).not.toContainText('stop');
    await expect(trips.getByRole('button', { name: /off this map$/ })).toHaveCount(0);
  });
});
