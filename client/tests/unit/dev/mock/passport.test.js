import { beforeEach, describe, expect, it } from 'vitest';
import { buildPassport, mapStamps } from '@/dev/mock/passport';
import { HOME_MAP, SAM_MAP, db, freshStore } from './mockApi';

beforeEach(() => freshStore());

const map = (id) => db().maps.find((m) => m.id === id);
const stampIds = (passport) => passport.pages.flatMap((p) => p.stamps.map((s) => s.landmarkId));

describe('mapStamps', () => {
  it('stamps each landmark with a confirmed photo once, with its earliest photo and count', () => {
    const stamps = mapStamps(HOME_MAP, { includeHidden: true });
    expect(stamps).toHaveLength(13);
    const seine = stamps.find((s) => s.landmark.id === 'lm-paris-banks-of-the-seine');
    expect(seine.photoCount).toBe(2);
    expect(seine.photo.id).toBe('photo-eiffel');
    expect(stamps.some((s) => s.landmark.id === 'lm-alhambra')).toBe(false);
  });

  it('leaves out stamps only a hidden photo makes, below editor', () => {
    const stamps = mapStamps(HOME_MAP, { includeHidden: false });
    expect(stamps).toHaveLength(12);
    expect(stamps.some((s) => s.landmark.id === 'lm-tower-of-belem')).toBe(false);
  });
});

describe('buildPassport', () => {
  it('gives an editor the test user’s 13 stamps over the 8 countries visited', () => {
    const passport = buildPassport(map(HOME_MAP), 'OWNER');
    expect(passport.totals).toMatchObject({ countries: 8, landmarks: 13, specialPlaces: 0, regions: 0 });
    expect(passport.totals.unesco).toBeGreaterThan(0);
    expect(new Set(stampIds(passport)).size).toBe(13);
    expect(passport.map).toMatchObject({ id: HOME_MAP, ownerName: 'Charlie Reid', plan: { id: 'REGULAR' }, traveller: null });
    expect(passport.travellers.map((t) => t.name)).toEqual(['Charlie', 'Alex']);
  });

  it('orders the pages by when each country was first reached, with their status', () => {
    const passport = buildPassport(map(HOME_MAP), 'OWNER');
    expect(passport.pages.find((p) => p.countryCode === 'GB').status).toBe('LIVED');
    // A country's earliest photo first, else its "first went" day: Portugal's only photo is hidden
    expect(passport.pages.find((p) => p.countryCode === 'PT').enteredOn).toBe('2021-10-21');
    expect(buildPassport(map(HOME_MAP), 'VIEWER').pages.find((p) => p.countryCode === 'PT').enteredOn).toBe('2021-10-20');
    const dates = passport.pages.map((p) => p.enteredOn).filter(Boolean);
    expect(dates).toEqual([...dates].sort());
    // No page for a country only wanted
    expect(passport.pages.some((p) => p.countryCode === 'JP')).toBe(false);
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
    expect(codes).toEqual(expect.arrayContaining(['IE', 'IT', 'ES', 'FR']));
    expect(codes).not.toContain('NL');
    expect(stampIds(passport)).toContain('lm-colosseum');
    expect(stampIds(passport)).not.toContain('lm-amsterdam-canal-ring');
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
