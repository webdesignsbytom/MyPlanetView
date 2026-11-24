import { beforeEach, describe, expect, it } from 'vitest';
import { buildPassport, mapStamps } from '@/dev/mock/passport';
import { ALEX, HOME_MAP, SAM_MAP, USER, db, freshStore } from './mockApi';
import { loadMapFacts } from '@/dev/mock/achievements';
import { mapStats } from '@/dev/mock/views';

beforeEach(() => freshStore());

const map = (id) => db().maps.find((m) => m.id === id);
const stampIds = (passport) => passport.pages.flatMap((p) => p.stamps.map((s) => s.landmarkId));

describe('mapStamps', () => {
  it('stamps each landmark with a confirmed photo once, with its earliest photo and count', () => {
    // 13 from photos, 12 from landmarks ticked "been here" (data/demoTravels.js)
    const stamps = mapStamps(HOME_MAP, { includeHidden: true });
    expect(stamps).toHaveLength(25);
    expect(stamps.filter((s) => !s.photo)).toHaveLength(12);
    const seine = stamps.find((s) => s.landmark.id === 'lm-paris-banks-of-the-seine');
    expect(seine.photoCount).toBe(2);
    expect(seine.photo.id).toBe('photo-eiffel');
    expect(stamps.some((s) => s.landmark.id === 'lm-alhambra')).toBe(false);
  });

  it('leaves out stamps only a hidden photo makes, below editor', () => {
    const stamps = mapStamps(HOME_MAP, { includeHidden: false });
    expect(stamps).toHaveLength(24);
    expect(stamps.some((s) => s.landmark.id === 'lm-tower-of-belem')).toBe(false);
  });
});

// 23 Nov 2026, the user's decision: "both methods should get a stamp in the passport"
describe('a landmark ticked "been here"', () => {
  const tick = (landmarkId, createdById = USER) =>
    db().landmarkVisits.push({ mapId: HOME_MAP, landmarkId, createdById, createdAt: '2026-11-01T10:00:00.000Z' });

  it('is a stamp with no photo, dated the day it was ticked, for everyone on the map', () => {
    tick('lm-alhambra');
    for (const role of ['OWNER', 'VIEWER']) {
      const passport = buildPassport(map(HOME_MAP), role);
      const stamp = passport.pages.flatMap((p) => p.stamps).find((s) => s.landmarkId === 'lm-alhambra');
      expect(stamp).toMatchObject({ ticked: true, photo: null, photoCount: 0, stampedOn: '2026-11-01' });
    }
    expect(buildPassport(map(HOME_MAP), 'OWNER').totals.landmarks).toBe(26);
    // It counts as a stamp for the badges and goals, and the stats
    expect(loadMapFacts(HOME_MAP, { includeHidden: true }).stamps.some((s) => s.landmarkId === 'lm-alhambra')).toBe(true);
    expect(mapStats(map(HOME_MAP), 'OWNER').landmarks).toBe(26);
  });

  it('stays the photo’s stamp when the landmark has a photo too', () => {
    tick('lm-colosseum');
    const stamp = mapStamps(HOME_MAP, { includeHidden: true }).find((s) => s.landmark.id === 'lm-colosseum');
    expect(stamp.photo).not.toBeNull();
    expect(mapStamps(HOME_MAP, { includeHidden: true })).toHaveLength(25);
  });

  it('is in the passport of the traveller whose account ticked it, never another’s', () => {
    tick('lm-alhambra', USER);
    tick('lm-delos', ALEX);
    const ids = (travellerId) => stampIds(buildPassport(map(HOME_MAP), 'OWNER', { travellerId }));
    expect(ids('trav-test')).toContain('lm-alhambra');
    expect(ids('trav-test')).not.toContain('lm-delos');
    expect(ids('trav-alex')).toContain('lm-delos');
    expect(ids('trav-alex')).not.toContain('lm-alhambra');
    // The seed's own: Schönbrunn ticked by Alex, Petra by Charlie
    expect(ids('trav-alex')).toContain('lm-schonbrunn-palace');
    expect(ids('trav-test')).not.toContain('lm-schonbrunn-palace');
    expect(ids('trav-test')).toContain('lm-petra');
  });
});

describe('buildPassport', () => {
  it('gives an editor the test user’s 25 stamps over the 20 countries visited or lived in', () => {
    const passport = buildPassport(map(HOME_MAP), 'OWNER');
    expect(passport.totals).toMatchObject({ countries: 20, landmarks: 25, specialPlaces: 0, regions: 0, continents: 5 });
    expect(passport.totals.unesco).toBeGreaterThan(0);
    expect(new Set(stampIds(passport)).size).toBe(25);
    expect(passport.map).toMatchObject({ id: HOME_MAP, ownerName: 'Charlie Reid', plan: { id: 'REGULAR' }, traveller: null });
    expect(passport.travellers.map((t) => t.name)).toEqual(['Charlie', 'Alex']);
  });

  it('orders the pages by when each country was first reached, with their status', () => {
    const passport = buildPassport(map(HOME_MAP), 'OWNER');
    expect(passport.pages.find((p) => p.countryCode === 'GB').status).toBe('LIVED');
    // The earlier of its first photo and its "first went" day (24 Nov 2026, the user's wish: in
    // the order visited): Portugal was first visited the day before its first photo
    expect(passport.pages.find((p) => p.countryCode === 'PT').enteredOn).toBe('2021-10-20');
    expect(buildPassport(map(HOME_MAP), 'VIEWER').pages.find((p) => p.countryCode === 'PT').enteredOn).toBe('2021-10-20');
    // The UK, lived in since 1990, comes first, whatever its photos' dates; then each place in
    // the order first visited (data/demoTravels.js)
    expect(passport.pages[0]).toMatchObject({ countryCode: 'GB', enteredOn: '1990-01-14' });
    expect(passport.pages.map((p) => p.countryCode)).toEqual(['GB', 'IE', 'US', 'NL', 'ES', 'FR', 'PT', 'GR', 'TR', 'MA', 'JO', 'TZ', 'ZA', 'IN', 'MY', 'NZ', 'MX', 'CU', 'IT', 'AT']);
    const dates = passport.pages.map((p) => p.enteredOn).filter(Boolean);
    expect(dates).toEqual([...dates].sort());
    // No page for a country only wanted
    expect(passport.pages.some((p) => p.countryCode === 'JP')).toBe(false);
  });

  // 24 Nov 2026, the user's report: Japan, marked visited (so dated today), came before places
  // marked earlier today with no date
  it('puts a country marked today after those marked before it, dated or not', () => {
    const now = Date.now();
    const iso = (minutesAgo) => new Date(now - minutesAgo * 60_000).toISOString();
    const today = new Date(now).toISOString().slice(0, 10);
    db().visits.push(
      { mapId: HOME_MAP, countryCode: 'DO', status: 'VISITED', source: 'MANUAL', firstVisitedOn: null, notes: null, createdAt: iso(15) },
      { mapId: HOME_MAP, countryCode: 'DZ', status: 'VISITED', source: 'MANUAL', firstVisitedOn: null, notes: null, createdAt: iso(10) },
      { mapId: HOME_MAP, countryCode: 'JP', status: 'VISITED', source: 'MANUAL', firstVisitedOn: today, notes: null, createdAt: iso(1) },
    );
    db().visits = db().visits.filter((v) => !(v.mapId === HOME_MAP && v.countryCode === 'JP' && v.status === 'WANT_TO_GO'));
    const codes = buildPassport(map(HOME_MAP), 'OWNER').pages.map((p) => p.countryCode);
    expect(codes.slice(-3)).toEqual(['DO', 'DZ', 'JP']);
  });

  it('lists what’s left to stamp, the moments at each landmark, and the photo picked', () => {
    db().landmarkCovers.push({ mapId: HOME_MAP, landmarkId: 'lm-paris-banks-of-the-seine', photoId: 'photo-louvre' });
    const passport = buildPassport(map(HOME_MAP), 'OWNER');
    const france = passport.pages.find((p) => p.countryCode === 'FR');
    const seine = france.stamps.find((s) => s.landmarkId === 'lm-paris-banks-of-the-seine');
    expect(seine).toMatchObject({ photo: { id: 'photo-louvre' }, photoChosen: true, photoCount: 2 });
    expect(france.stamps.find((s) => s.landmarkId === 'lm-eiffel-tower').moments.map((m) => m.id)).toEqual(['moment-engaged']);
    expect(france.toStamp.some((l) => l.id === 'lm-eiffel-tower')).toBe(false);
    expect(france.toStamp.length).toBeGreaterThan(10);
  });

  it('gives a viewer no hidden stamp, no hidden cover and no photoChosen', () => {
    db().photos.find((p) => p.id === 'photo-louvre').hidden = true;
    db().landmarkCovers.push({ mapId: HOME_MAP, landmarkId: 'lm-paris-banks-of-the-seine', photoId: 'photo-louvre' });
    const passport = buildPassport(map(HOME_MAP), 'VIEWER');
    expect(stampIds(passport)).not.toContain('lm-tower-of-belem');
    const seine = passport.pages.flatMap((p) => p.stamps).find((s) => s.landmarkId === 'lm-paris-banks-of-the-seine');
    expect(seine.photo.id).toBe('photo-eiffel');
    expect('photoChosen' in seine).toBe(false);
  });

  it('gives Sam’s map its one stamp, on the Economy cover', () => {
    const passport = buildPassport(map(SAM_MAP), 'VIEWER');
    expect(stampIds(passport)).toEqual(['lm-historic-city-of-ayutthaya']);
    expect(passport.map.plan.id).toBe('FREE');
  });

  it('builds one traveller’s own passport from their trips, moments and birthplace', () => {
    const passport = buildPassport(map(HOME_MAP), 'OWNER', { travellerId: 'trav-alex' });
    expect(passport.map.traveller).toEqual({ id: 'trav-alex', name: 'Alex' });
    const codes = passport.pages.map((p) => p.countryCode);
    expect(codes).toEqual(expect.arrayContaining(['IE', 'IT', 'ES', 'FR', 'AT']));
    // Lisbon was Charlie's weekend alone
    expect(codes).not.toContain('PT');
    expect(stampIds(passport)).toContain('lm-colosseum');
    expect(stampIds(passport)).not.toContain('lm-tower-of-belem');
    // …and Vienna Alex's
    expect(buildPassport(map(HOME_MAP), 'OWNER', { travellerId: 'trav-test' }).pages.map((p) => p.countryCode)).not.toContain('AT');
    expect(buildPassport(map(HOME_MAP), 'OWNER', { travellerId: 'trav-sam' })).toBeNull();
  });

  it('puts a UK landmark on its nation’s page on a map that splits the UK', () => {
    map(HOME_MAP).splitUk = true;
    const passport = buildPassport(map(HOME_MAP), 'OWNER');
    const page = (code) => passport.pages.find((p) => p.countryCode === code);
    expect(page('XE').stamps.map((s) => s.landmarkId)).toEqual(['lm-tower-of-london']);
    expect(page('XC').stamps.map((s) => s.landmarkId)).toEqual(['lm-old-and-new-towns-of-edinburgh']);
  });
});
