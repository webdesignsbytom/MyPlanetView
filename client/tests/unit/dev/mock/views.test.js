import { beforeEach, describe, expect, it } from 'vitest';
import {
  LANDMARK_ROWS,
  atLeast,
  byTripOrder,
  canSeePhoto,
  countryExists,
  distanceM,
  higherRole,
  landmarkById,
  linkedTrips,
  mapRole,
  mapStats,
  mapStyleOf,
  mapSummary,
  mapTripsView,
  mapView,
  markParentsVisited,
  markVisited,
  momentCountsByCountry,
  momentSpots,
  photoDetail,
  photoListItem,
  photoPage,
  photoRole,
  photoUrls,
  slugify,
  stampedLandmarkIds,
  tripMapIds,
  tripRole,
  tripView,
  userName,
  videoStateOf,
} from '@/dev/mock/views';
import { FRAN_MAP, HOME_MAP, JO_MAP, MORGANS_MAP, SAM_MAP, TOM_MAP, db, freshStore, signOut } from './mockApi';

beforeEach(() => freshStore());

const map = (id) => db().maps.find((m) => m.id === id);
const trip = (id) => db().trips.find((t) => t.id === id);
const photo = (id) => db().photos.find((p) => p.id === id);
const homePhotos = () => db().photos.filter((p) => p.mapId === HOME_MAP);

describe('small helpers', () => {
  it('slugs names as the server does', () => {
    expect(slugify('Château de Versailles')).toBe('chateau-de-versailles');
    expect(slugify('  Ha Long Bay! ')).toBe('ha-long-bay');
  });

  it('knows the countries and the landmarks, with their pins and UK nations', () => {
    expect(countryExists('FR')).toBe(true);
    expect(countryExists('ZZ')).toBe(false);
    expect(LANDMARK_ROWS.map((l) => l.name)).toEqual([...LANDMARK_ROWS.map((l) => l.name)].sort((a, b) => a.localeCompare(b)));
    expect(landmarkById('lm-eiffel-tower')).toMatchObject({ countryCode: 'FR', slug: 'eiffel-tower' });
    expect(landmarkById('lm-tower-of-london').nation).toBe('XE');
    expect('nation' in landmarkById('lm-eiffel-tower')).toBe(false);
    expect(landmarkById('nope')).toBeNull();
  });

  it('measures great-circle distances', () => {
    expect(distanceM(51.5074, -0.1278, 48.8566, 2.3522)).toBeGreaterThan(340000);
    expect(distanceM(51.5074, -0.1278, 48.8566, 2.3522)).toBeLessThan(345000);
    expect(distanceM(1, 1, 1, 1)).toBe(0);
  });

  it('names people, "Someone" for an unknown one', () => {
    expect(userName('mock-alex')).toBe('Alex Morgan');
    expect(userName('nope')).toBe('Someone');
  });
});

describe('roles', () => {
  it('ranks roles', () => {
    expect(higherRole('VIEWER', 'EDITOR')).toBe('EDITOR');
    expect(higherRole(null, 'VIEWER')).toBe('VIEWER');
    expect(higherRole('OWNER', null)).toBe('OWNER');
    expect(higherRole(null, null)).toBeNull();
    expect(atLeast('CO_OWNER', 'EDITOR')).toBe(true);
    expect(atLeast('VIEWER', 'EDITOR')).toBe(false);
    expect(atLeast(null, 'VIEWER')).toBe(false);
  });

  it('gives the test user each seeded map’s role, and nothing signed out', () => {
    expect(mapRole(map(HOME_MAP))).toBe('OWNER');
    expect(mapRole(map(SAM_MAP))).toBe('VIEWER');
    expect(mapRole(map(MORGANS_MAP))).toBe('VIEWER');
    expect(mapRole(map(TOM_MAP))).toBeNull();
    expect(mapRole(null)).toBeNull();
    signOut();
    expect(mapRole(map(HOME_MAP))).toBeNull();
  });

  it('gives a trip the higher of the map role and the trip role', () => {
    expect(tripRole(trip('trip-jo-lisbon'))).toBe('EDITOR');
    expect(tripRole(trip('trip-sam-asia'))).toBe('VIEWER');
    expect(tripRole(trip('trip-tom-stag'))).toBeNull();
    expect(tripRole(null)).toBeNull();
    expect(photoRole(photo('photo-lisbon'))).toBe('EDITOR');
    expect(photoRole(photo('photo-eiffel'))).toBe('OWNER');
  });
});

describe('photos', () => {
  it('shows hidden photos and unready videos to editors only', () => {
    expect(canSeePhoto(photo('photo-hidden'), 'VIEWER')).toBe(false);
    expect(canSeePhoto(photo('photo-hidden'), 'EDITOR')).toBe(true);
    const video = { kind: 'VIDEO', hidden: false, videoState: 'PROCESSING', readyAt: new Date(Date.now() + 60000).toISOString() };
    expect(canSeePhoto(video, 'VIEWER')).toBe(false);
    expect(canSeePhoto(video, 'EDITOR')).toBe(true);
    expect(canSeePhoto(photo('photo-eiffel'), null)).toBe(false);
  });

  it('turns a processing video ready once its time comes, and keeps a failed one failed', () => {
    expect(videoStateOf({ kind: 'PHOTO' })).toBeNull();
    expect(videoStateOf({ kind: 'VIDEO' })).toBe('READY');
    const video = { kind: 'VIDEO', videoState: 'PROCESSING', readyAt: new Date(Date.now() - 1).toISOString() };
    expect(videoStateOf(video)).toBe('READY');
    expect(video.videoState).toBe('READY');
    expect(videoStateOf({ kind: 'VIDEO', videoState: 'FAILED' })).toBe('FAILED');
  });

  it('serves the test photos’ three copies, posters for the stand-ins, and blobs for uploads', () => {
    expect(photoUrls(photo('photo-eiffel'))).toEqual({
      thumb: '/seed-photos/eiffel-tower/thumb.webp',
      display: '/seed-photos/eiffel-tower/display.webp',
      original: '/seed-photos/eiffel-tower/original.jpg',
    });
    expect(photoUrls(photo('photo-bangkok')).thumb).toMatch(/th/);
    expect(photoUrls(db().photos.find((p) => p.mapId === FRAN_MAP)).video).toMatch(/^\/seed-videos\/.+\/video\.mp4$/);
    expect(photoUrls({ image: { thumbKey: 'missing' } })).toEqual({ thumb: null, display: null, original: null, print: null });
  });

  it('never gives a viewer the GPS, the original, hidden or unconfirmed matches', () => {
    const asViewer = photoDetail(photo('photo-eiffel'), 'VIEWER');
    for (const field of ['latitude', 'longitude', 'originalUrl', 'bestCopy', 'hidden']) expect(field in asViewer).toBe(false);
    expect(asViewer.displayUrl).toMatch(/display\.webp$/);
    expect(photoListItem(photo('photo-alhambra'), 'VIEWER').landmarks).toEqual([]);
    const asEditor = photoDetail(photo('photo-alhambra'), 'EDITOR');
    expect(asEditor).toMatchObject({ latitude: 37.1762, longitude: -3.5882, bestCopy: 'ORIGINAL', hidden: false });
    expect(asEditor.originalUrl).toMatch(/original\.jpg$/);
    expect(asEditor.landmarks).toEqual([{ id: 'lm-alhambra', name: expect.any(String), confirmed: false, source: 'GPS', distanceM: 15 }]);
    expect(photoDetail(photo('photo-dam'), 'VIEWER').themes.map((t) => t.running)).toContain(true);
  });
});

describe('photoPage', () => {
  const page = (filters, role = 'OWNER', options) => photoPage(homePhotos(), role, filters, options);

  it('lists the whole map newest upload first, a country’s and a trip’s in gallery order', () => {
    const all = page({ limit: '60' }).photos.map((p) => p.id);
    expect(all).toHaveLength(16);
    expect(all[0]).toBe('photo-hidden');
    expect(page({ country: 'FR' }).photos.every((p) => p.countryCode === 'FR')).toBe(true);
    expect(page({ tripId: 'trip-italy' }).photos.map((p) => p.id).sort()).toEqual(['photo-cinque-terre', 'photo-colosseum', 'photo-florence-cathedral']);
    expect(page({}, 'VIEWER').photos.some((p) => p.id === 'photo-hidden')).toBe(false);
  });

  it('pages with the last photo’s id as the cursor, 30 by default and 60 at most', () => {
    const first = page({ limit: '5' });
    expect(first.photos).toHaveLength(5);
    expect(first.nextCursor).toBe(first.photos[4].id);
    const rest = page({ limit: '60', cursor: first.nextCursor });
    expect(rest.photos).toHaveLength(11);
    expect(rest.nextCursor).toBeNull();
    expect(page({ limit: '999' }).photos).toHaveLength(16);
  });

  it('orders by when they were taken, and shuffles the same way for the same seed', () => {
    const taken = page({ order: 'taken', limit: '60' }).photos.map((p) => p.takenAt);
    expect(taken).toEqual([...taken].sort());
    const a = page({ order: 'shuffle', seed: '42', limit: '60' }).photos.map((p) => p.id);
    expect(page({ order: 'shuffle', seed: '42', limit: '60' }).photos.map((p) => p.id)).toEqual(a);
    expect([...a].sort()).toEqual(page({ limit: '60' }).photos.map((p) => p.id).sort());
    const half = page({ order: 'shuffle', seed: '42', limit: '8' });
    expect(page({ order: 'shuffle', seed: '42', limit: '8', cursor: half.nextCursor }).photos.map((p) => p.id)).toEqual(a.slice(8));
  });

  it('adds display copies, the best copies for editors, and the photos with no country', () => {
    expect(page({ display: '1', limit: '1' }).photos[0].displayUrl).toBeTruthy();
    const best = page({ best: '1', limit: '1' }).photos[0].best;
    expect(best).toMatchObject({ copy: 'ORIGINAL', contentType: 'image/jpeg', bytes: null });
    expect(page({ best: '1' }, 'VIEWER')).toEqual({ error: 'You do not have permission to do that.', status: 403 });
    expect(page({ best: '1' }, 'OWNER', { allowBest: false }).status).toBe(403);
    photo('photo-dam').countryCode = null;
    expect(page({ unplaced: '1' }).photos.map((p) => p.id)).toEqual(['photo-dam']);
  });

  it('lists a landmark’s confirmed photos in any country', () => {
    expect(page({ landmark: 'lm-paris-banks-of-the-seine' }).photos.map((p) => p.id)).toEqual(['photo-eiffel', 'photo-louvre']);
  });

  it('refuses a malformed filter', () => {
    for (const filters of [{ order: 'random' }, { order: 'shuffle' }, { unplaced: 'yes' }, { unplaced: '1', country: 'FR' }, { display: 'maybe' }, { best: '2' }]) {
      expect(page(filters)).toEqual({ error: 'Malformed data.' });
    }
    expect(page({ order: 'shuffle', seed: '42', cursor: 'not-in-it' })).toEqual({ error: 'Malformed data.' });
  });
});

describe('maps', () => {
  it('counts the test user’s map as the server does', () => {
    const stats = mapStats(map(HOME_MAP), 'OWNER');
    expect(stats).toMatchObject({ countries: 8, specialPlaces: 0, regions: 0, continents: 2, photos: 16, landmarks: 13, trips: 3 });
    expect(stats.byTraveller).toEqual([
      { travellerId: 'trav-test', name: 'Charlie', countries: 1, daysAway: 15, lifeAwayShare: null },
      { travellerId: 'trav-alex', name: 'Alex', countries: 1, daysAway: 15, lifeAwayShare: null },
    ]);
    expect(stats.countriesInWorld).toBeGreaterThan(200);
    expect(mapStats(map(HOME_MAP), 'VIEWER')).toMatchObject({ photos: 15, landmarks: 12 });
  });

  it('counts the special places, regions and the UK’s nations apart', () => {
    db().visits.push(
      { mapId: HOME_MAP, countryCode: 'AQ', status: 'VISITED' },
      { mapId: HOME_MAP, countryCode: 'XS', status: 'VISITED' },
      { mapId: HOME_MAP, countryCode: 'XH', status: 'VISITED' },
    );
    expect(mapStats(map(HOME_MAP), 'OWNER')).toMatchObject({ countries: 8, specialPlaces: 2, regions: 1, continents: 3 });
    map(HOME_MAP).splitUk = true;
    db().visits.push({ mapId: HOME_MAP, countryCode: 'XC', status: 'VISITED' });
    expect(mapStats(map(HOME_MAP), 'OWNER').countries).toBe(8);
  });

  it('summarises a map, with the plan fields for its owner alone', () => {
    expect(mapSummary(map(HOME_MAP), 'OWNER')).toMatchObject({ id: HOME_MAP, role: 'OWNER', counts: { countries: 8, photos: 16, trips: 3 }, locked: false, tier: 'PLAN' });
    expect('locked' in mapSummary(map(SAM_MAP), 'VIEWER')).toBe(false);
  });

  it('gives viewers no travellers’ accounts, no hidden moments and only shared pins', () => {
    const asViewer = mapView(map(HOME_MAP), 'VIEWER', { withPlan: true });
    expect('plan' in asViewer).toBe(false);
    expect('userId' in asViewer.travellers[0]).toBe(false);
    expect(asViewer.momentCountsByCountry.PT).toBeUndefined();
    expect(asViewer.momentSpots.map((s) => s.id)).toEqual(['moment-engaged']);
    expect(asViewer.stampedLandmarkIds).not.toContain('lm-tower-of-belem');
    const asOwner = mapView(map(HOME_MAP), 'OWNER', { withPlan: true });
    expect(asOwner.travellers[0].userId).toBe('mock-user');
    expect(asOwner.plan.id).toBe('REGULAR');
    expect(asOwner.momentCountsByCountry.PT).toBe(1);
    expect(asOwner.momentSpots.map((s) => s.id)).toEqual(['moment-born', 'moment-engaged']);
    expect(asOwner).toMatchObject({ splitUk: false, homeCountryCode: null, style: null, tickedLandmarkIds: [] });
  });

  it('counts moments and pins as the server does', () => {
    expect(momentCountsByCountry(HOME_MAP)).toEqual({ GB: 1, IE: 1, ES: 1, FR: 1, IT: 1 });
    expect(momentSpots(SAM_MAP)).toEqual([expect.objectContaining({ id: 'moment-angkor', countryCode: 'KH' })]);
    expect(stampedLandmarkIds(map(SAM_MAP), 'VIEWER')).toEqual(['lm-historic-city-of-ayutthaya']);
  });

  it('shows a map in its own style, else its owner’s, else none', () => {
    expect(mapStyleOf(map(HOME_MAP))).toBeNull();
    db().mapSettings = { style: 'starry' };
    expect(mapStyleOf(map(HOME_MAP))).toBe('starry');
    expect(mapStyleOf(map(SAM_MAP))).toBeNull();
    map(SAM_MAP).style = 'old-map';
    expect(mapStyleOf(map(SAM_MAP))).toBe('old-map');
    map(SAM_MAP).style = 'jupiter';
    expect(mapStyleOf(map(SAM_MAP))).toBeNull();
  });
});

describe('visits', () => {
  it('marks a missing country visited, turns "want to go" visited and leaves the rest', () => {
    expect(markVisited(HOME_MAP, 'DE', 'PHOTO')).toEqual([{ mapId: HOME_MAP, countryCode: 'DE', status: 'VISITED', source: 'PHOTO', firstVisitedOn: null, notes: null }]);
    expect(markVisited(HOME_MAP, 'JP', 'TRIP')[0]).toMatchObject({ countryCode: 'JP', status: 'VISITED', source: 'TRIP' });
    expect(markVisited(HOME_MAP, 'GB', 'PHOTO')).toEqual([]);
    expect(markVisited(HOME_MAP, null, 'PHOTO')).toEqual([]);
  });

  it('brings Antarctica with the South Pole, and keeps a nation as the UK on a map that doesn’t split it', () => {
    expect(markVisited(HOME_MAP, 'XS', 'MANUAL').map((v) => v.countryCode)).toEqual(['XS', 'AQ']);
    db().visits = db().visits.filter((v) => !(v.mapId === HOME_MAP && v.countryCode === 'GB'));
    expect(markVisited(HOME_MAP, 'XC', 'TRIP').map((v) => v.countryCode)).toEqual(['GB']);
  });

  it('marks the parent of a place visited or lived by hand, and nothing for "want to go"', () => {
    expect(markParentsVisited(HOME_MAP, 'XS', 'WANT_TO_GO')).toEqual([]);
    expect(markParentsVisited(HOME_MAP, 'FR', 'VISITED')).toEqual([]);
    expect(markParentsVisited(HOME_MAP, 'XB', 'LIVED').map((v) => v.countryCode)).toEqual(['ID']);
  });
});

describe('trips', () => {
  it('orders trips undated first, then the latest start, then the newest', () => {
    const trips = [
      { startDate: '2020-01-01', createdAt: '1' },
      { startDate: null, createdAt: '1' },
      { startDate: '2024-01-01', createdAt: '1' },
      { startDate: '2024-01-01', createdAt: '2' },
    ];
    expect([...trips].sort(byTripOrder)).toEqual([trips[1], trips[3], trips[2], trips[0]]);
  });

  it('lists a map’s own trips with their countries, and the linked stag do in brief', () => {
    const trips = mapTripsView(map(HOME_MAP), 'OWNER');
    expect(trips.map((t) => t.id)).toEqual(['trip-tom-stag', 'trip-japan', 'trip-italy']);
    expect(trips[0]).toEqual({
      id: 'trip-tom-stag',
      title: 'Stag do in Prague',
      status: 'PLANNED',
      startDate: '2027-05-14',
      endDate: '2027-05-17',
      countryCodes: ['CZ'],
      linked: true,
      organiserMapName: "Tom's map",
      canOpen: false,
    });
    expect(trips[2]).toMatchObject({ countryCodes: ['IT'], linked: false, canOpen: true, stopCount: 3, photoCount: 3 });
    expect('countryCodes' in mapTripsView(map(HOME_MAP), 'VIEWER', { viaShareLink: true })[1]).toBe(false);
    expect(linkedTrips(HOME_MAP).map((t) => t.id)).toEqual(['trip-tom-stag']);
    expect(tripMapIds(trip('trip-tom-stag'))).toEqual([TOM_MAP, HOME_MAP]);
  });

  it('lets a trip-only editor edit but not delete, and hides a hidden cover below editor', () => {
    const lisbon = tripView(trip('trip-jo-lisbon'), 'EDITOR');
    expect(lisbon).toMatchObject({ canOpenMap: false, canDelete: false, role: 'EDITOR', mapName: "Jo's family trips" });
    expect(lisbon.uploadRules).toBeDefined();
    expect(tripView(trip('trip-italy'), 'OWNER')).toMatchObject({ canDelete: true, canOpenMap: true, coverPhotoId: 'photo-colosseum' });
    expect('uploadRules' in tripView(trip('trip-italy'), 'OWNER', { viaShareLink: true })).toBe(false);
    photo('photo-colosseum').hidden = true;
    expect(tripView(trip('trip-italy'), 'VIEWER')).toMatchObject({ coverPhotoId: null, coverThumbUrl: null });
    expect(tripView(trip('trip-italy'), 'VIEWER', { viaShareLink: true })).toMatchObject({ canOpenMap: false, canDelete: false, onMyMaps: [], canAddToMyMap: false });
  });

  it('says which of the test user’s maps show a trip, and whether it can go on another', () => {
    const stag = tripView(trip('trip-tom-stag'), null);
    expect(stag.onMyMaps).toEqual([{ mapId: HOME_MAP, name: "Charlie & Alex's travels", canRemove: true }]);
    expect(stag.canAddToMyMap).toBe(true);
    expect(tripView(trip('trip-italy'), 'OWNER').canAddToMyMap).toBe(false);
    expect(tripView(trip('trip-jo-lisbon'), 'EDITOR').stops[0]).toMatchObject({ landmarkName: expect.any(String), placeName: 'Lisbon' });
    expect(JO_MAP).toBe(trip('trip-jo-lisbon').mapId);
  });
});
