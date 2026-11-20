import { test, expect, HOME_MAP, MOCK_STORE_KEY, mapReady, openMap, openTool } from './fixtures.js';

// Taking your travels with you (docs/API.md, "Travel copies") against mock mode, where an
// approved copy is made at once. The seed (src/dev/mock/seed.js) has Alex's family map "The
// Morgans", with the test user on it as a viewer and as its traveller Charlie (not linked to
// their account): the Easter trip to Spain (two photos and a hidden one), a moment about
// Charlie, and a photo of Ireland.

const FAMILY_MAP = 'The Morgans';

async function openThisMapSettings(page) {
  const settings = await openTool(page, 'Map settings', 'Settings');
  await settings.getByRole('tab', { name: 'This map' }).click();
  return settings.getByRole('tabpanel', { name: 'This map' });
}

/** The saved demo data. */
const readStore = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), MOCK_STORE_KEY);

/** Change the saved demo data, then load the page again so mock mode reads it. */
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

test.describe('Travel copies', () => {
  test('someone on a family map asks for copies of a trip they went on, then withdraws it', async ({ page }) => {
    await openMap(page);
    const thisMap = await openThisMapSettings(page);
    const section = thisMap.getByRole('region', { name: 'Bring your travels' });
    await section.getByRole('button', { name: 'Choose travels to bring' }).click();

    const dialog = page.getByRole('dialog', { name: 'Bring your travels' });
    await dialog.getByRole('combobox', { name: 'Copy from' }).selectOption({ label: `${FAMILY_MAP} (Alex Morgan)` });
    // Which traveller they are: Alex's traveller is Alex's account
    const who = dialog.getByRole('group', { name: 'Which one are you?' });
    await expect(who.getByRole('radio', { name: 'Alex (someone else’s account)' })).toBeDisabled();
    await who.getByRole('radio', { name: 'Charlie', exact: true }).click();
    await expect(who.getByRole('radio', { name: 'Charlie', exact: true })).toBeChecked();

    // Their trip, and the moment about them; the hidden photo never counts
    const trips = dialog.getByRole('group', { name: 'Trips you went on' });
    await expect(trips.getByRole('checkbox')).toHaveCount(1);
    await expect(dialog.getByRole('group', { name: 'Moments about you' }).getByRole('checkbox', { name: /^Charlie’s first churros/ })).toBeVisible();
    await trips.getByRole('checkbox', { name: /^Spain at Easter/ }).check();
    const summary = dialog.getByRole('region', { name: 'What comes across' });
    await expect(summary).toContainText('Comes to 2 photos and 1 trip.');

    await dialog.getByRole('button', { name: 'Ask for a copy' }).click();
    await expect(dialog.getByRole('status')).toContainText('Asked. Alex Morgan has been emailed');
    await expect(dialog.getByRole('status')).toContainText(`your copies arrive on “${HOME_MAP}”`);
    const saved = (await readStore(page)).travelCopyRequests;
    expect(saved).toEqual([
      expect.objectContaining({
        status: 'PENDING',
        fromMapId: 'map-morgans',
        toMapId: 'map-home',
        travellerId: 'trav-morgan-charlie',
        tripIds: ['trip-morgans-spain'],
        photoIds: ['photo-morgans-sagrada', 'photo-morgans-alhambra'],
      }),
    ]);
    await dialog.getByRole('button', { name: 'Done' }).click();
    await expect(dialog).toBeHidden();

    // The request in this map's settings, waiting; withdrawn, it's gone
    const requests = section.getByRole('list', { name: 'Your requests' });
    const request = requests.getByRole('listitem');
    await expect(request).toContainText(`From “${FAMILY_MAP}”: 2 photos and 1 trip`);
    await expect(request).toContainText('Waiting for an answer');
    await request.getByRole('button', { name: 'Withdraw' }).click();
    await expect(requests).toHaveCount(0);
    expect((await readStore(page)).travelCopyRequests).toEqual([]);
  });

  test('the family map’s owner reviews a request from the map and approves it: the copies land on the other map', async ({ page }) => {
    await openMap(page);
    // Alex asks, as Alex, for the Italian summer (and the gelato moment) on Alex's own map
    await editStore(
      page,
      (db, now) => {
        db.travelCopyRequests.push({
          id: 'copy-alex-italy',
          status: 'PENDING',
          fromMapId: 'map-home',
          toMapId: 'map-morgans',
          travellerId: 'trav-alex',
          requestedById: 'mock-alex',
          decidedById: null,
          tripIds: ['trip-italy'],
          momentIds: ['moment-gelato'],
          photoIds: ['photo-colosseum', 'photo-florence-cathedral', 'photo-cinque-terre'],
          photoCursor: 0,
          copiedPhotos: 0,
          skippedPhotos: 0,
          createdAt: now,
          decidedAt: null,
          finishedAt: null,
        });
      },
      new Date().toISOString(),
    );
    await mapReady(page);

    const tag = page.getByRole('region', { name: 'A request to copy travels' });
    await expect(tag).toContainText('Alex Morgan asks for copies of their travels as Alex.');
    await tag.getByRole('button', { name: 'Review it' }).click();

    const dialog = page.getByRole('dialog', { name: 'Copy their travels?' });
    await expect(dialog).toContainText(`for their own map “${FAMILY_MAP}”: 3 photos, 1 trip and 1 moment.`);
    await expect(dialog.getByRole('region', { name: 'Trips' })).toContainText('Italian summer');
    await expect(dialog.getByRole('region', { name: 'Moments' })).toContainText('Best gelato of the trip');
    await expect(dialog.getByRole('region', { name: 'Photos' })).toContainText('Italy: 3');
    await dialog.getByRole('button', { name: 'Approve and copy' }).click();
    await expect(dialog.getByRole('status')).toHaveText('Copied 3 photos');
    // Answered: off the map
    await expect(tag).toHaveCount(0);

    // The copies are Alex's map's own: new photos (with the Colosseum's stamp), the trip, the
    // moment, and Italy visited from the trip's first day; the test user's map keeps everything
    const db = await readStore(page);
    expect(db.travelCopyRequests.find((r) => r.id === 'copy-alex-italy')).toMatchObject({
      status: 'DONE',
      decidedById: 'mock-user',
      photoCursor: 3,
      copiedPhotos: 3,
      skippedPhotos: 0,
    });
    const copies = db.photos.filter((p) => p.mapId === 'map-morgans' && p.copiedFromId);
    expect(copies.map((p) => p.copiedFromId).sort()).toEqual(['photo-cinque-terre', 'photo-colosseum', 'photo-florence-cathedral']);
    const trip = db.trips.find((t) => t.mapId === 'map-morgans' && t.copiedFromId === 'trip-italy');
    expect(trip).toMatchObject({ title: 'Italian summer', status: 'COMPLETED', createdById: 'mock-alex', travellerIds: ['trav-morgan-alex'] });
    expect(db.stops.filter((s) => s.tripId === trip.id).map((s) => s.placeName)).toEqual(['Rome', 'Florence', 'Cinque Terre']);
    for (const copy of copies) expect(copy).toMatchObject({ uploaderId: 'mock-alex', tripId: trip.id, countryCode: 'IT', hidden: false });
    const colosseum = copies.find((p) => p.copiedFromId === 'photo-colosseum');
    expect(db.photoLandmarks).toContainEqual(expect.objectContaining({ photoId: colosseum.id, mapId: 'map-morgans', landmarkId: 'lm-colosseum', confirmed: true }));
    const moment = db.moments.find((m) => m.mapId === 'map-morgans' && m.copiedFromId === 'moment-gelato');
    const florence = copies.find((p) => p.copiedFromId === 'photo-florence-cathedral');
    expect(moment).toMatchObject({ title: 'Best gelato of the trip', tripId: trip.id, spotShared: false, photoIds: [florence.id], travellerIds: ['trav-morgan-alex'] });
    expect(db.visits.find((v) => v.mapId === 'map-morgans' && v.countryCode === 'IT')).toMatchObject({ status: 'VISITED', firstVisitedOn: '2025-07-02' });
    expect(db.photos.filter((p) => p.mapId === 'map-home')).toHaveLength(16);
  });
});
