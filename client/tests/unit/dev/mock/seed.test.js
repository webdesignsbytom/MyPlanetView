import { describe, expect, it } from 'vitest';
import { MOCK_PASSWORD, buildSeed, exampleOfferId, exampleOffers } from '@/dev/mock/seed';
import { FRAN_ID, FRAN_MAP_ID, addFirstClassMap } from '@/dev/mock/seedFirstClass';
import { LANDMARKS } from '@/dev/mock/data/landmarks';
import { EXAMPLE_OFFERS } from '@/dev/mock/data/offers';
import { SEED_PHOTOS, seedPhotoBySlug } from '@/dev/mock/data/seedPhotos';
import { SEED_VIDEOS } from '@/dev/mock/data/seedVideos';
import SUBDIVISIONS from '@/dev/mock/data/subdivisions';
import { UK_NATION_OUTLINES } from '@/dev/mock/data/ukNations';
import { LANDMARK_ROWS } from '@/dev/mock/views';
import { countryExists } from '@/dev/mock/views';
import { HOME_MAP, MORGANS_MAP, USER } from './mockApi';

const seed = buildSeed();
const home = (list) => list.filter((row) => row.mapId === HOME_MAP);

describe('the seed’s people', () => {
  it('signs everyone in with the server seed’s password', () => {
    expect(MOCK_PASSWORD).toBe('12345678');
  });

  it('has the test user first: Charlie Reid, verified', () => {
    expect(seed.users[0]).toMatchObject({ id: USER, name: 'Charlie Reid', email: 'test@myplanetview.local', emailVerified: true, role: 'USER' });
    expect(seed.users.find((u) => u.id === 'mock-paused').isActive).toBe(false);
    expect(seed.users.find((u) => u.id === 'mock-admin').role).toBe('ADMIN');
  });

  it('gives the test user Business monthly with one extra map, and Fran First Class', () => {
    expect(seed.subscriptions.find((s) => s.userId === USER)).toMatchObject({ plan: 'REGULAR', interval: 'MONTH', status: 'active', extraMaps: 1 });
    expect(seed.subscriptions.find((s) => s.userId === FRAN_ID)).toMatchObject({ plan: 'PREMIUM', interval: 'YEAR' });
    expect(seed.subscriptions).toHaveLength(2);
  });
});

describe('the test user’s map', () => {
  it('is "Charlie & Alex’s travels", a couple’s map with Alex editing and Sam viewing', () => {
    const map = seed.maps.find((m) => m.id === HOME_MAP);
    expect(map).toMatchObject({ name: "Charlie & Alex's travels", groupType: 'COUPLE', isDefault: true, ownerId: USER });
    expect(seed.mapMembers.filter((m) => m.mapId === HOME_MAP).map((m) => [m.userId, m.role])).toEqual([
      ['mock-alex', 'EDITOR'],
      ['mock-sam', 'VIEWER'],
    ]);
    expect(home(seed.travellers).map((t) => t.name)).toEqual(['Charlie', 'Alex']);
  });

  it('has all 16 test photos, one hidden, and the stamps the passport shows', () => {
    const photos = home(seed.photos);
    expect(photos).toHaveLength(16);
    expect(photos.filter((p) => p.hidden).map((p) => p.id)).toEqual(['photo-hidden']);
    expect(photos.every((p) => p.image.kind === 'seed')).toBe(true);
    const confirmed = home(seed.photoLandmarks).filter((pl) => pl.confirmed);
    const stamps = new Set(confirmed.map((pl) => pl.landmarkId));
    expect(stamps.size).toBe(13);
    // Paris's banks of the Seine on two photos; the Alhambra still a suggestion
    expect(confirmed.filter((pl) => pl.landmarkId === 'lm-paris-banks-of-the-seine')).toHaveLength(2);
    expect(home(seed.photoLandmarks).find((pl) => pl.landmarkId === 'lm-alhambra')).toMatchObject({ confirmed: false, confirmedAt: null });
    expect(confirmed.every((pl) => pl.confirmedAt)).toBe(true);
  });

  it('has its visits, the completed and planned trips, moments and goals', () => {
    expect(home(seed.visits).filter((v) => v.status !== 'WANT_TO_GO')).toHaveLength(8);
    expect(home(seed.visits).filter((v) => v.status === 'WANT_TO_GO').map((v) => v.countryCode)).toEqual(['JP', 'PE', 'IS']);
    expect(home(seed.trips).map((t) => [t.title, t.status])).toEqual([
      ['Italian summer', 'COMPLETED'],
      ['Japan in spring', 'PLANNED'],
    ]);
    expect(seed.moments).toHaveLength(11);
    expect(seed.moments.filter((m) => m.hidden)).toHaveLength(2);
    expect(seed.goals).toHaveLength(4);
  });

  it('has New York and Massachusetts visited and a Paris pin with two visits', () => {
    expect(seed.subdivisionVisits.map((v) => v.code)).toEqual(['US-NY', 'US-MA']);
    expect(seed.pins).toEqual([expect.objectContaining({ id: 'pin-paris', countryCode: 'FR', hidden: false })]);
    expect(seed.pinVisits.map((v) => v.pinId)).toEqual(['pin-paris', 'pin-paris']);
  });

  it('has Tom’s stag do added to it by Alex', () => {
    expect(seed.tripMaps).toEqual([expect.objectContaining({ tripId: 'trip-tom-stag', mapId: HOME_MAP, addedById: 'mock-alex' })]);
  });
});

describe('the Morgans’ family map', () => {
  it('is Alex’s, with the test user viewing and as the unlinked traveller Charlie', () => {
    expect(seed.maps.find((m) => m.id === MORGANS_MAP)).toMatchObject({ name: 'The Morgans', groupType: 'FAMILY', ownerId: 'mock-alex' });
    expect(seed.mapMembers.find((m) => m.mapId === MORGANS_MAP && m.userId === USER).role).toBe('VIEWER');
    const charlie = seed.travellers.find((t) => t.id === 'trav-morgan-charlie');
    expect(charlie).toMatchObject({ name: 'Charlie', userId: null });
  });

  it('has the Easter trip with two photos and a hidden one, the churros and Ireland', () => {
    const trip = seed.trips.find((t) => t.id === 'trip-morgans-spain');
    expect(trip).toMatchObject({ title: 'Spain at Easter', status: 'COMPLETED', startDate: '2010-04-01' });
    const photos = seed.photos.filter((p) => p.mapId === MORGANS_MAP);
    expect(photos.filter((p) => p.tripId === trip.id).map((p) => p.hidden)).toEqual([false, false, true]);
    expect(photos.find((p) => p.countryCode === 'IE').id).toBe('photo-morgans-moher');
    expect(seed.moments.find((m) => m.id === 'moment-morgans-churros').title).toBe('Charlie’s first churros');
  });
});

describe('the admin lists and the rest', () => {
  it('has the two promo codes, the challenge and the invites', () => {
    expect(seed.promoCodes.map((p) => [p.code, p.maxUses])).toEqual([
      ['SAMTRAVELS', 500],
      ['TRAVELTALK', null],
    ]);
    expect(seed.users.filter((u) => u.promoCodeId === 'promo-traveltalk').map((u) => u.name)).toEqual(['Jo Patel', 'Tom Baker']);
    expect(seed.challenges[0]).toMatchObject({ title: 'Two years on the road', joinCode: 'CHA2YR5RDTRP', createdById: 'mock-sam' });
    expect(seed.invites.find((i) => i.token === 'demo-invite')).toMatchObject({ email: 'test@myplanetview.local', mapId: 'map-jo' });
  });

  it('has the example offers with fixed ids, and their click tallies', () => {
    expect(exampleOfferId(0)).toBe('0ffe0000-0000-4000-8000-000000000001');
    const offers = exampleOffers();
    expect(offers).toHaveLength(EXAMPLE_OFFERS.length);
    expect(offers[0]).toMatchObject({ id: exampleOfferId(0), key: EXAMPLE_OFFERS[0].key, active: true });
    expect(seed.offerClicks).toHaveLength(4);
  });

  it('enters two photos in this month’s theme and one in last month’s', () => {
    expect(seed.themeEntries.map((e) => e.photoId).sort()).toEqual(['photo-alhambra', 'photo-dam', 'photo-eiffel']);
  });
});

describe('seedFirstClass', () => {
  it('adds Fran, her plan, her map of four videos and the test user as its viewer', () => {
    expect(seed.users.find((u) => u.id === FRAN_ID).name).toBe('Fran Okafor');
    expect(seed.maps.find((m) => m.id === FRAN_MAP_ID).ownerId).toBe(FRAN_ID);
    const videos = seed.photos.filter((p) => p.mapId === FRAN_MAP_ID);
    expect(videos).toHaveLength(SEED_VIDEOS.length);
    expect(videos.every((v) => v.kind === 'VIDEO' && v.latitude === null && v.durationS > 0)).toBe(true);
    expect(seed.mapMembers.find((m) => m.mapId === FRAN_MAP_ID)).toMatchObject({ userId: USER, role: 'VIEWER' });
  });

  it('adds nothing twice', () => {
    const db = buildSeed();
    const counts = (d) => [d.users.length, d.maps.length, d.photos.length, d.visits.length, d.mapMembers.length, d.subscriptions.length];
    const before = counts(db);
    expect(addFirstClassMap(db)).toBe(db);
    expect(counts(db)).toEqual(before);
  });
});

describe('the generated data', () => {
  it('has the server’s 1,332 landmarks, 1,273 of them UNESCO sites, each in a country of the map', () => {
    expect(LANDMARKS).toHaveLength(1332);
    expect(LANDMARKS.filter((l) => l.isUnesco)).toHaveLength(1273);
    for (const lm of LANDMARKS) {
      expect(countryExists(lm.countryCode)).toBe(true);
      expect(Math.abs(lm.latitude)).toBeLessThanOrEqual(90);
      expect(lm.matchRadiusM).toBeGreaterThan(0);
    }
    expect(new Set(LANDMARK_ROWS.map((l) => l.id)).size).toBe(1332);
  });

  it('has the 16 test photos and the four videos', () => {
    expect(SEED_PHOTOS).toHaveLength(16);
    expect(seedPhotoBySlug('eiffel-tower').countryCode).toBe('FR');
    expect(SEED_VIDEOS).toHaveLength(4);
    for (const clip of SEED_VIDEOS) expect(clip).toEqual(expect.objectContaining({ slug: expect.any(String), countryCode: expect.any(String), durationS: expect.any(Number) }));
  });

  it('has the example offers, each with a key, kind, placements and an https link', () => {
    expect(EXAMPLE_OFFERS).toHaveLength(30);
    for (const offer of EXAMPLE_OFFERS) {
      expect(offer.key).toMatch(/^[a-z0-9-]+$/);
      expect(offer.url.startsWith('https://')).toBe(true);
      expect(offer.placements.length).toBeGreaterThan(0);
    }
  });

  it('has the states of each country map and the UK nations’ outlines', () => {
    expect(SUBDIVISIONS['US-NY']).toEqual({ m: 'US' });
    expect(Object.keys(SUBDIVISIONS).length).toBeGreaterThan(3000);
    expect(Object.keys(UK_NATION_OUTLINES).sort()).toEqual(['XC', 'XE', 'XI', 'XW']);
  });
});
