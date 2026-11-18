import {
  test,
  expect,
  MOCK_STORE_KEY,
  SAM_MAP,
  SAM_SHARE_CODE,
  expectStats,
  goInApp,
  openMap,
  openTool,
  signOut,
} from './fixtures.js';

// Country notes and moments (docs/API.md "Countries visited" and "Moments"). The seeded
// moments (src/dev/mock/seed.js): on the test user's map, a birth (1990), a move to Dublin
// (2012), flamenco in Spain (2018), an engagement in Paris (2019), gelato on the Italian
// trip (2025) and a party hidden from viewers (undated); on Sam's map (the test user
// views it), Angkor Wat at sunrise and a hidden lost passport; on Jo's map, one on the
// Lisbon trip (which the test user edits alone) and Mia's birth, which isn't on it.

/** Open a country's ticket from the country list. */
async function openCountry(page, name) {
  const list = await openTool(page, 'Country list', 'Countries');
  await list.getByRole('searchbox', { name: 'Search countries' }).fill(name.slice(0, 5).toLowerCase());
  await list.getByRole('button', { name, exact: true }).click();
  const panel = page.getByRole('dialog', { name });
  await expect(panel).toBeVisible();
  return panel;
}

const momentsIn = (scope) => scope.getByRole('region', { name: 'Moments' });

/** Add moments straight into the saved demo data (dated from 1 Jan 2000), then reload. */
async function addMoments(page, count) {
  await page.evaluate(
    ({ key, count: n }) => {
      const db = JSON.parse(localStorage.getItem(key));
      for (let i = 0; i < n; i++) {
        db.moments.push({
          id: `moment-extra-${String(i).padStart(2, '0')}`,
          mapId: 'map-home',
          tripId: null,
          createdById: 'mock-user',
          kind: 'SAW_OR_DID',
          title: `Day out ${i + 1}`,
          text: null,
          happenedOn: new Date(Date.UTC(2000, 0, 1 + i)).toISOString().slice(0, 10),
          datePrecision: 'DAY',
          countryCode: 'GB',
          landmarkId: null,
          placeName: null,
          hidden: false,
          travellerIds: [],
          photoIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      localStorage.setItem(key, JSON.stringify(db));
    },
    { key: MOCK_STORE_KEY, count },
  );
  await page.reload();
}

test.describe('Country notes', () => {
  test('an editor writes a country’s note, cleaned as the server keeps it, and a viewer reads one', { tag: '@phone' }, async ({ page }) => {
    await openMap(page);
    const japan = await openCountry(page, 'Japan');
    const notes = japan.getByRole('textbox', { name: 'Notes' });
    await expect(notes).toHaveValue('Cherry blossom season');
    await expect(japan.getByRole('button', { name: 'Save note' })).toBeDisabled();

    // Tags and spaces at the ends go, as on the server
    await notes.fill('  Cherry blossom is in <b>early</b> April  ');
    await japan.getByRole('button', { name: 'Save note' }).click();
    await expect(japan.getByRole('status').filter({ hasText: 'Note saved.' })).toBeVisible();
    await expect(notes).toHaveValue('Cherry blossom is in early April');

    // Kept
    await page.reload();
    const again = await openCountry(page, 'Japan');
    await expect(again.getByRole('textbox', { name: 'Notes' })).toHaveValue('Cherry blossom is in early April');

    // A note belongs to the country's visit: none to write before it has a status
    const germany = await openCountry(page, 'Germany');
    await expect(germany.getByRole('textbox', { name: 'Notes' })).toHaveCount(0);
    await germany.getByRole('combobox', { name: 'Been there?' }).selectOption('Want to go');
    await germany.getByRole('textbox', { name: 'Notes' }).fill('Christmas markets in December');
    await germany.getByRole('button', { name: 'Save note' }).click();
    await expect(germany.getByRole('status').filter({ hasText: 'Note saved.' })).toBeVisible();
    // Cleared
    await germany.getByRole('textbox', { name: 'Notes' }).fill('');
    await germany.getByRole('button', { name: 'Save note' }).click();
    await expect(germany.getByRole('status').filter({ hasText: 'Note cleared.' })).toBeVisible();

    // A viewer (Sam's map) reads the note, with nothing to write in
    await openMap(page, '/maps/map-sam');
    const thailand = await openCountry(page, 'Thailand');
    await expect(thailand.getByRole('region', { name: 'Notes' })).toContainText('Next time: the islands in the south.');
    await expect(thailand.getByRole('textbox', { name: 'Notes' })).toHaveCount(0);
  });
});

test.describe('Moments', () => {
  test('a moment is added, edited, hidden and deleted in a country, and marked on the map', { tag: '@phone' }, async ({ page }) => {
    await openMap(page);
    await expect(page.locator('[data-moment-mark="FR"]')).toBeAttached();
    await expect(page.locator('[data-moment-mark="DE"]')).toHaveCount(0);

    const germany = await openCountry(page, 'Germany');
    const moments = momentsIn(germany);
    await expect(moments.getByText('No moments in Germany yet.')).toBeVisible();
    await moments.getByRole('button', { name: 'Add a moment' }).click();
    const form = moments.getByRole('region', { name: 'Add a moment' });
    await form.getByRole('combobox', { name: 'What kind' }).selectOption({ label: 'Celebration' });
    await form.getByRole('textbox', { name: 'Title' }).fill('Christmas market in Berlin');
    await form.getByRole('textbox', { name: 'The story' }).fill('Mulled wine and gingerbread.');
    await form.getByRole('combobox', { name: 'When' }).selectOption({ label: 'A month' });
    await form.getByRole('combobox', { name: 'Month' }).selectOption({ label: 'December' });
    await form.getByRole('textbox', { name: 'Year' }).fill('2023');
    await form.getByRole('combobox', { name: 'Landmark' }).selectOption({ label: 'Brandenburg Gate' });
    await form.getByRole('group', { name: 'Who it’s about' }).getByRole('button', { name: 'Alex', exact: true }).click();
    // Germany has no status yet: marking it visited is offered, and ticked
    await expect(form.getByRole('checkbox', { name: 'Mark Germany as visited on the map' })).toBeChecked();
    await form.getByRole('button', { name: 'Add moment' }).click();

    const card = moments.getByRole('article', { name: 'Christmas market in Berlin' });
    await expect(card).toContainText('Celebration · December 2023 · Brandenburg Gate');
    await expect(card).toContainText('Mulled wine and gingerbread.');
    await expect(card).toContainText('With Alex');
    await expect(germany.getByRole('combobox', { name: 'Been there?' })).toHaveValue('VISITED');
    await expectStats(page, '9 countries, 2 continents, 16 photos');
    await expect(page.locator('[data-moment-mark="DE"]')).toBeAttached();

    // Edited: a new title, the day, a photo from elsewhere on the map, and hidden
    await card.getByRole('button', { name: 'Edit Christmas market in Berlin' }).click();
    const edit = moments.getByRole('region', { name: 'Edit Christmas market in Berlin' });
    await edit.getByRole('textbox', { name: 'Title' }).fill('Christmas market by the Gate');
    await edit.getByRole('combobox', { name: 'When' }).selectOption({ label: 'A day' });
    await edit.getByLabel('Day', { exact: true }).fill('2023-12-16');
    const photos = edit.getByRole('group', { name: 'Photos' });
    await photos.getByRole('button', { name: 'Choose photos' }).click();
    await expect(photos.getByText('No photos here yet.')).toBeVisible();
    await photos.getByRole('checkbox', { name: 'Show photos from anywhere on the map' }).check();
    await photos.getByRole('button', { name: 'Tower Bridge', exact: true }).click();
    await expect(photos.getByRole('button', { name: 'Tower Bridge', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(photos.getByText('1 of 20 chosen')).toBeVisible();
    await edit.getByRole('checkbox', { name: /^Hide from viewers/ }).check();
    await edit.getByRole('button', { name: 'Save moment' }).click();

    const edited = moments.getByRole('article', { name: 'Christmas market by the Gate' });
    await expect(edited).toContainText('Celebration · 16 Dec 2023 · Brandenburg Gate');
    await expect(edited).toContainText('Hidden from viewers');
    await expect(edited.getByRole('button', { name: 'Open photo 1 of Christmas market by the Gate' })).toBeVisible();
    await expect(moments.getByRole('article', { name: 'Christmas market in Berlin' })).toHaveCount(0);

    // Deleted, after asking
    await edited.getByRole('button', { name: 'Delete Christmas market by the Gate' }).click();
    await edited.getByRole('button', { name: 'Keep it' }).click();
    await expect(edited).toBeVisible();
    await edited.getByRole('button', { name: 'Delete Christmas market by the Gate' }).click();
    await edited.getByRole('button', { name: 'Yes, delete it' }).click();
    await expect(edited).toHaveCount(0);
    await expect(moments.getByText('No moments in Germany yet.')).toBeVisible();
    await expect(page.locator('[data-moment-mark="DE"]')).toHaveCount(0);
    // The country stays visited
    await expectStats(page, '9 countries, 2 continents, 16 photos');
  });

  test('a birth offers to add the baby as a traveller born there, once the map has room, and marks the country lived in', async ({ page }) => {
    await openMap(page);
    // A couple's map is two people, and has its two: no baby to add (17 Nov 2026, the user's wish)
    let canada = await openCountry(page, 'Canada');
    let moments = momentsIn(canada);
    await moments.getByRole('button', { name: 'Add a moment' }).click();
    let form = moments.getByRole('region', { name: 'Add a moment' });
    await form.getByRole('combobox', { name: 'What kind' }).selectOption({ label: 'Born' });
    await expect(form.getByRole('checkbox', { name: /^Add the baby/ })).toHaveCount(0);

    // Nor another traveller in Settings, until it's a family's map
    const setup = await openTool(page, 'Map settings', 'Settings');
    await setup.getByRole('tab', { name: 'This map' }).click();
    const thisMap = setup.getByRole('tabpanel', { name: 'This map' });
    await expect(thisMap.getByRole('button', { name: 'Add another traveller' })).toHaveCount(0);
    await thisMap.getByText('A family', { exact: true }).click();
    await expect(thisMap.getByRole('button', { name: 'Add another traveller' })).toBeVisible();
    await thisMap.getByRole('button', { name: 'Save map' }).click();
    await expect(thisMap.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();

    canada = await openCountry(page, 'Canada');
    moments = momentsIn(canada);
    await moments.getByRole('button', { name: 'Add a moment' }).click();
    form = moments.getByRole('region', { name: 'Add a moment' });
    await expect(form.getByRole('checkbox', { name: /^Add the baby/ })).toHaveCount(0);
    await form.getByRole('combobox', { name: 'What kind' }).selectOption({ label: 'Born' });
    await form.getByRole('textbox', { name: 'Title' }).fill('Our baby was born');
    await form.getByRole('combobox', { name: 'When' }).selectOption({ label: 'Only the year' });
    await form.getByRole('textbox', { name: 'Year' }).fill('2026');
    // A birth suggests "lived there"
    await expect(form.getByRole('checkbox', { name: 'Mark Canada as lived there on the map' })).toBeChecked();
    await form.getByRole('checkbox', { name: 'Add the baby to this map as a traveller, born in Canada' }).check();
    // Their name is needed
    await form.getByRole('button', { name: 'Add moment' }).click();
    await expect(form.getByRole('alert')).toHaveText('Give the baby’s name, to add them to the map.');
    await form.getByRole('textbox', { name: 'Their name' }).fill('Robin');
    await form.getByRole('button', { name: 'Add moment' }).click();

    const card = moments.getByRole('article', { name: 'Our baby was born' });
    await expect(card).toContainText('Born · 2026');
    await expect(card).toContainText('With Robin');
    await expect(canada.getByRole('combobox', { name: 'Been there?' })).toHaveValue('LIVED');
    await expectStats(page, '9 countries, 2 continents, 16 photos');

    // Robin is the map's third traveller, born in Canada
    const settings = await openTool(page, 'Map settings', 'Settings');
    await settings.getByRole('tab', { name: 'This map' }).click();
    const robin = settings.getByRole('group', { name: 'Traveller 3' });
    await expect(robin.getByRole('textbox', { name: 'Name' })).toHaveValue('Robin');
    await expect(robin.getByRole('combobox', { name: 'Born in' })).toHaveValue('CA');
  });

  test('the timeline tells the map’s story in date order, for everyone or one traveller', async ({ page }) => {
    await openMap(page);
    const timeline = await openTool(page, 'Timeline', 'Timeline');
    await expect(timeline.getByRole('heading', { level: 3 })).toHaveText(['1990', '2012', '2018', '2019', '2025', '2027', 'Undated']);
    await expect(timeline.getByRole('listitem')).toHaveText([
      /^Charlie was born/,
      /^Moved to Dublin/,
      /^Saw flamenco in Granada/,
      /^Got engaged at the Eiffel Tower/,
      /^Italian summer/,
      /^Best gelato of the trip/,
      /^Japan in spring/,
      /^Stag do in Prague.*Group trip from Tom's map/,
      /^Planning a surprise party.*Hidden from viewers/,
    ]);
    // The group trip the test user isn't on doesn't open; their own trips do
    await expect(timeline.getByRole('link', { name: /Stag do in Prague/ })).toHaveCount(0);
    await expect(timeline.getByRole('link', { name: /Japan in spring/ })).toBeVisible();

    // Alex's story: their moments and the trips they went on
    await timeline.getByRole('combobox', { name: 'Whose story' }).selectOption({ label: 'Alex' });
    await expect(timeline.getByRole('listitem')).toHaveText([
      /^Moved to Dublin/,
      /^Saw flamenco in Granada/,
      /^Got engaged at the Eiffel Tower/,
      /^Italian summer/,
      /^Best gelato of the trip/,
      /^Japan in spring/,
    ]);

    // A moment opens its country
    await timeline.getByRole('button', { name: /^Got engaged at the Eiffel Tower/ }).click();
    const france = page.getByRole('dialog', { name: 'France' });
    await expect(momentsIn(france).getByRole('article', { name: 'Got engaged at the Eiffel Tower' })).toBeVisible();

    // A trip opens its page
    const again = await openTool(page, 'Timeline', 'Timeline');
    await again.getByRole('link', { name: /^Italian summer/ }).click();
    await expect(page).toHaveURL(/\/trips\/trip-italy$/);
    await expect(momentsIn(page).getByRole('article', { name: 'Best gelato of the trip' })).toBeVisible();
  });

  test('the timeline loads moments a page at a time, keeping the trips in order', async ({ page }) => {
    await openMap(page);
    await addMoments(page, 35);
    const timeline = await openTool(page, 'Timeline', 'Timeline');
    // The first 30 moments: the 1990 birth and 29 days out in 2000; no trip comes after them yet
    await expect(timeline.getByRole('listitem')).toHaveCount(30);
    await expect(timeline.getByRole('listitem').last()).toHaveText(/^Day out 29/);
    await expect(timeline.getByRole('link', { name: /Italian summer/ })).toHaveCount(0);

    await timeline.getByRole('button', { name: 'Show more of the story' }).click();
    // 41 moments and 3 trips
    await expect(timeline.getByRole('listitem')).toHaveCount(44);
    await expect(timeline.getByRole('link', { name: /^Italian summer/ })).toBeVisible();
    await expect(timeline.getByRole('button', { name: 'Show more of the story' })).toHaveCount(0);
    await expect(timeline.getByRole('listitem').last()).toHaveText(/^Planning a surprise party/);
  });

  test('a viewer and a share link never see hidden moments', { tag: '@phone' }, async ({ page }) => {
    // Sam's map, which the test user views: the lost passport (Thailand) is hidden
    await openMap(page, '/maps/map-sam');
    await expect(page.locator('[data-moment-mark="KH"]')).toBeAttached();
    await expect(page.locator('[data-moment-mark="TH"]')).toHaveCount(0);
    const timeline = await openTool(page, 'Timeline', 'Timeline');
    await expect(timeline.getByRole('listitem')).toHaveText([/^South-East Asia loop/, /^Sunrise at Angkor Wat/]);

    await timeline.getByRole('button', { name: /^Sunrise at Angkor Wat/ }).click();
    const cambodia = page.getByRole('dialog', { name: 'Cambodia' });
    await expect(momentsIn(cambodia).getByRole('article', { name: 'Sunrise at Angkor Wat' })).toContainText('Angkor Wat');
    await expect(momentsIn(cambodia).getByRole('button', { name: 'Add a moment' })).toHaveCount(0);
    await expect(momentsIn(cambodia).getByRole('button', { name: /^(Edit|Delete) / })).toHaveCount(0);
    const thailand = await openCountry(page, 'Thailand');
    await expect(momentsIn(thailand).getByText('No moments in Thailand yet.')).toBeVisible();

    // Signed out, through the map's share link: the same
    await signOut(page);
    await goInApp(page, `/shared/${SAM_SHARE_CODE}`);
    await expect(page.getByRole('application', { name: `${SAM_MAP}: world map` })).toBeVisible();
    await expect(page.locator('[data-moment-mark="TH"]')).toHaveCount(0);
    const shared = await openTool(page, 'Timeline', 'Timeline');
    await expect(shared.getByRole('listitem')).toHaveText([/^South-East Asia loop/, /^Sunrise at Angkor Wat/]);
    await expect(shared.getByRole('link')).toHaveCount(0);
    const sharedThailand = await openCountry(page, 'Thailand');
    await expect(momentsIn(sharedThailand).getByText('No moments in Thailand yet.')).toBeVisible();
  });

  test('an editor of a trip alone adds moments to that trip only, with its photos', async ({ page }) => {
    // The test user edits Jo's Lisbon trip, with no role on Jo's map
    await page.goto('/trips/trip-jo-lisbon');
    const moments = momentsIn(page);
    // Only the trip's moment (Mia's birth on Jo's map isn't on it)
    await expect(moments.getByRole('article')).toHaveCount(1);
    await expect(moments.getByRole('article', { name: 'Pastéis de nata at Belém' })).toContainText('Tower of Belém, Portugal');

    await moments.getByRole('button', { name: 'Add a moment' }).click();
    const form = moments.getByRole('region', { name: 'Add a moment' });
    // On this trip: no trip to choose, its first stop's country to start with, no baby to
    // add to a map they can't change, no country to mark
    await expect(form.getByRole('combobox', { name: 'Trip' })).toHaveCount(0);
    await expect(form.getByRole('combobox', { name: 'Country' })).toHaveValue('PT');
    await form.getByRole('combobox', { name: 'What kind' }).selectOption({ label: 'Born' });
    await expect(form.getByRole('checkbox', { name: /^Add the baby/ })).toHaveCount(0);
    await expect(form.getByRole('checkbox', { name: /^Mark / })).toHaveCount(0);
    await form.getByRole('combobox', { name: 'What kind' }).selectOption({ label: 'Something we saw or did' });
    await form.getByRole('textbox', { name: 'Title' }).fill('Tram 28 up the hill');

    // Only the trip's photos, and no others from the map
    const photos = form.getByRole('group', { name: 'Photos' });
    await photos.getByRole('button', { name: 'Choose photos' }).click();
    await expect(photos.getByRole('checkbox', { name: /anywhere on the map/ })).toHaveCount(0);
    await expect(photos.getByRole('listitem')).toHaveCount(1);
    await photos.getByRole('button', { name: 'Belém', exact: true }).click();
    await form.getByRole('button', { name: 'Add moment' }).click();

    const card = moments.getByRole('article', { name: 'Tram 28 up the hill' });
    await expect(card).toContainText('Something we saw or did · No date · Portugal');
    await expect(card.getByRole('button', { name: 'Open photo 1 of Tram 28 up the hill' })).toBeVisible();
    // Undated, so after the dated one
    await expect(moments.getByRole('article')).toHaveText([/^Pastéis de nata/, /^Tram 28/]);

    // Their own moment, edited and hidden
    await card.getByRole('button', { name: 'Edit Tram 28 up the hill' }).click();
    const edit = moments.getByRole('region', { name: 'Edit Tram 28 up the hill' });
    await edit.getByRole('checkbox', { name: /^Hide from viewers/ }).check();
    await edit.getByRole('button', { name: 'Save moment' }).click();
    await expect(moments.getByRole('article', { name: 'Tram 28 up the hill' })).toContainText('Hidden from viewers');
  });
});
