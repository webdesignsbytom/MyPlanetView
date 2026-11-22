import { beforeEach, describe, expect, it } from 'vitest';
import {
  MESSAGES,
  addVisit,
  clearSubdivision,
  countryMapOf,
  createPin,
  deletePin,
  deleteVisit,
  pinDetail,
  pinList,
  setSubdivision,
  subdivisionStatuses,
  updatePin,
  updateVisit,
} from '@/dev/mock/countryMaps';
import { HOME_MAP, db, freshStore } from './mockApi';

beforeEach(() => freshStore());

const home = () => db().maps.find((m) => m.id === HOME_MAP);
const visit = (code) => db().visits.find((v) => v.mapId === HOME_MAP && v.countryCode === code);
const pin = () => db().pins.find((p) => p.id === 'pin-paris');
const paris = { countryCode: 'FR', name: 'Le Marais', latitude: 48.8575, longitude: 2.3592 };

describe('countryMapOf', () => {
  it('opens a country, a nation only on a split map, and a region as its country', () => {
    expect(countryMapOf('FR', false)).toBe('FR');
    expect(countryMapOf('XC', true)).toBe('XC');
    expect(countryMapOf('XC', false)).toBe('GB');
    expect(countryMapOf('XH', false)).toBe('US');
    expect(countryMapOf('AQ', false)).toBeNull();
    expect(countryMapOf('ZZ', false)).toBeNull();
    expect(countryMapOf(5, false)).toBeNull();
  });
});

describe('states', () => {
  it('lists the seed’s New York and Massachusetts on the US map', () => {
    expect(subdivisionStatuses(HOME_MAP, 'US')).toEqual([
      { code: 'US-NY', status: 'VISITED' },
      { code: 'US-MA', status: 'VISITED' },
    ]);
    expect(subdivisionStatuses(HOME_MAP, 'FR')).toEqual([]);
  });

  it('marks a state, bringing its country with it', () => {
    const result = setSubdivision(home(), 'FR-59', 'VISITED');
    expect(result.subdivision).toEqual({ code: 'FR-59', status: 'VISITED' });
    expect(result.implied).toEqual([]);
    db().visits = db().visits.filter((v) => !(v.mapId === HOME_MAP && v.countryCode === 'FR'));
    expect(setSubdivision(home(), 'FR-08', 'LIVED').implied.map((v) => v.countryCode)).toEqual(['FR']);
    expect(subdivisionStatuses(HOME_MAP, 'FR').map((s) => s.code)).toEqual(['FR-59', 'FR-08']);
  });

  it('brings nothing for a state only wanted, and changes a status in place', () => {
    expect(setSubdivision(home(), 'FR-02', 'WANT_TO_GO').implied).toEqual([]);
    setSubdivision(home(), 'FR-02', 'VISITED');
    expect(db().subdivisionVisits.filter((v) => v.code === 'FR-02')).toHaveLength(1);
  });

  it('keeps Hawaii’s state as the Hawaii region’s own visit', () => {
    const result = setSubdivision(home(), 'US-HI', 'VISITED');
    expect(result.implied.map((v) => v.countryCode)).toEqual(['XH']);
    expect(visit('XH')).toMatchObject({ status: 'VISITED', source: 'MANUAL' });
    expect(db().subdivisionVisits.some((v) => v.code === 'US-HI')).toBe(false);
    expect(subdivisionStatuses(HOME_MAP, 'US')).toContainEqual({ code: 'US-HI', status: 'VISITED' });
    clearSubdivision(home(), 'US-HI');
    expect(visit('XH')).toBeUndefined();
  });

  it('marks a Scottish state’s nation on a split map, and the UK on one that isn’t', () => {
    db().visits = db().visits.filter((v) => !(v.mapId === HOME_MAP && v.countryCode === 'GB'));
    expect(setSubdivision(home(), 'GB-SCB', 'VISITED').implied.map((v) => v.countryCode)).toEqual(['GB']);
    home().splitUk = true;
    expect(setSubdivision(home(), 'GB-DGY', 'VISITED').implied.map((v) => v.countryCode)).toEqual(['XC']);
    expect(subdivisionStatuses(HOME_MAP, 'XC').map((s) => s.code)).toEqual(['GB-SCB', 'GB-DGY']);
  });

  it('refuses a state that isn’t one, or a status that isn’t', () => {
    expect(setSubdivision(home(), 'XX-99', 'VISITED')).toEqual({ status: 404, error: MESSAGES.subdivisionNotFound });
    expect(setSubdivision(home(), 'FR-59', 'MAYBE')).toEqual({ status: 400, error: MESSAGES.invalidStatus });
    expect(clearSubdivision(home(), 'toString').status).toBe(404);
  });

  it('clears a state', () => {
    expect(clearSubdivision(home(), 'US-NY')).toEqual({ message: 'State cleared.' });
    expect(subdivisionStatuses(HOME_MAP, 'US').map((s) => s.code)).toEqual(['US-MA']);
  });
});

describe('pins', () => {
  it('lists the Paris pin with its two visits, the newest first', () => {
    const [listed] = pinList(HOME_MAP, 'FR', 'OWNER');
    expect(listed).toMatchObject({ id: 'pin-paris', visitCount: 2, latestVisit: { visitedOn: '2025-05-01', datePrecision: 'MONTH' }, hidden: false });
    expect('hidden' in pinList(HOME_MAP, 'FR', 'VIEWER')[0]).toBe(false);
    expect(pinDetail('pin-paris', 'OWNER').visits.map((v) => v.id)).toEqual(['pin-visit-paris-2025', 'pin-visit-paris-2019']);
  });

  it('shows a hidden pin to editors only, and leaves hidden photos off its visits below editor', () => {
    pin().hidden = true;
    expect(pinList(HOME_MAP, 'FR', 'VIEWER')).toEqual([]);
    expect(pinDetail('pin-paris', 'VIEWER')).toBeNull();
    expect(pinDetail('pin-paris', 'EDITOR')).not.toBeNull();
    pin().hidden = false;
    db().photos.find((p) => p.id === 'photo-louvre').hidden = true;
    expect(pinDetail('pin-paris', 'VIEWER').visits[0].photos).toEqual([]);
    expect(pinDetail('pin-paris', 'OWNER', { mapId: 'other-map' })).toBeNull();
  });

  it('lists a UK pin on its nation’s map by where it is', () => {
    db().pins.push({ id: 'pin-ed', mapId: HOME_MAP, countryCode: 'GB', name: 'Edinburgh', notes: null, latitude: 55.95, longitude: -3.19, hidden: false, createdAt: 'x' });
    expect(pinList(HOME_MAP, 'XC', 'OWNER').map((p) => p.id)).toEqual(['pin-ed']);
    expect(pinList(HOME_MAP, 'XE', 'OWNER')).toEqual([]);
    expect(pinList(HOME_MAP, 'GB', 'OWNER').map((p) => p.id)).toEqual(['pin-ed']);
  });

  it('makes a pin in its country, kept to the editors until shared, with a first visit', { timeout: 20000 }, async () => {
    const { pin: made } = await createPin(home(), { ...paris, notes: ' <b>Falafel</b> ', visit: { visitedOn: '2024', datePrecision: 'YEAR', photoIds: ['photo-louvre'] } });
    expect(made).toMatchObject({ name: 'Le Marais', notes: 'Falafel', countryCode: 'FR', hidden: true });
    expect(made.visits).toEqual([expect.objectContaining({ visitedOn: '2024-01-01', datePrecision: 'YEAR' })]);
    expect(made.visits[0].photos.map((p) => p.id)).toEqual(['photo-louvre']);
    const shared = await createPin(home(), { ...paris, hidden: false });
    expect(shared.pin.hidden).toBe(false);
  });

  it('refuses a pin outside its country, or with a bad field', { timeout: 20000 }, async () => {
    expect(await createPin(home(), { ...paris, countryCode: 'IT' })).toEqual({ status: 400, error: MESSAGES.wrongCountry });
    expect(await createPin(home(), { ...paris, countryCode: 'AQ' })).toEqual({ status: 400, error: MESSAGES.countryMapNotFound });
    expect((await createPin(home(), { ...paris, name: '' })).error).toBe(MESSAGES.name);
    expect((await createPin(home(), { ...paris, latitude: 95 })).error).toBe(MESSAGES.position);
    expect((await createPin(home(), { ...paris, hidden: 'no' })).error).toBe(MESSAGES.hidden);
    expect((await createPin(home(), { ...paris, notes: 5 })).error).toBe(MESSAGES.notes);
    expect((await createPin(home(), { ...paris, visit: { photoIds: ['photo-bangkok'] } })).error).toBe(MESSAGES.photos);
    expect((await createPin(home(), { ...paris, visit: { visitedOn: '2024-13', datePrecision: 'MONTH' } })).error).toBe(MESSAGES.date);
  });

  it('holds 1,000 pins a map', { timeout: 20000 }, async () => {
    db().pins.push(...Array.from({ length: 999 }, (_, i) => ({ ...pin(), id: `p${i}` })));
    expect(await createPin(home(), paris)).toEqual({ status: 409, error: MESSAGES.pinsFull });
  });

  it('changes a pin, keeping it inside its country', { timeout: 20000 }, async () => {
    expect(await updatePin(pin(), { name: 'Paris again' })).toEqual({});
    expect(pin().name).toBe('Paris again');
    expect(await updatePin(pin(), { latitude: 41.9, longitude: 12.5 })).toEqual({ status: 400, error: MESSAGES.wrongCountry });
    deletePin(pin());
    expect(db().pins).toEqual([]);
    expect(db().pinVisits).toEqual([]);
  });

  it('adds, changes and deletes visits, 100 a pin', () => {
    expect(addVisit(pin(), { visitedOn: '2026-06-14', datePrecision: 'DAY', notes: 'Again' })).toEqual({});
    expect(db().pinVisits.filter((v) => v.pinId === 'pin-paris')).toHaveLength(3);
    const first = db().pinVisits[0];
    expect(updateVisit(pin(), first, { notes: null })).toEqual({});
    expect(first.notes).toBeNull();
    expect(first.visitedOn).toBe('2019-04-01');
    expect(updateVisit(pin(), first, { photoIds: 'x' }).error).toBe(MESSAGES.photos);
    deleteVisit(first);
    expect(db().pinVisits.some((v) => v.id === first.id)).toBe(false);
    db().pinVisits.push(...Array.from({ length: 98 }, (_, i) => ({ id: `v${i}`, pinId: 'pin-paris', photoIds: [], createdAt: 'x' })));
    expect(addVisit(pin(), {})).toEqual({ status: 409, error: MESSAGES.visitsFull });
  });
});
