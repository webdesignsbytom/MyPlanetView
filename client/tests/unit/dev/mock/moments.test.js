import { beforeEach, describe, expect, it } from 'vitest';
import {
  MOMENT_MESSAGES,
  canSeeMoment,
  canSeeMomentPhoto,
  momentPage,
  momentPhotoScope,
  momentView,
  parseMoment,
  parseMomentSpotFor,
  sanitizeText,
} from '@/dev/mock/moments';
import { HOME_MAP, SAM_MAP, db, freshStore } from './mockApi';

beforeEach(() => freshStore());

const owner = { role: 'OWNER', photoAccess: { mapRole: 'OWNER' } };
const viewer = { role: 'VIEWER', photoAccess: { mapRole: 'VIEWER' } };
const page = (query, as = owner, mapId = HOME_MAP) => momentPage({ query, mapId, ...as });
const ids = (result) => result.moments.map((m) => m.id);
const good = { kind: 'SAW_OR_DID', title: 'Tapas crawl', countryCode: 'ES' };

describe('the messages', () => {
  it('says a malformed request in the server’s words', () => {
    expect(MOMENT_MESSAGES.malformed).toBe("Some details weren't in the right format. Please check them and try again.");
  });
});

describe('sanitizeText', () => {
  it('cleans text as the server does, null when nothing is left', () => {
    expect(sanitizeText(null, 10)).toBeNull();
    expect(sanitizeText(undefined, 10)).toBeNull();
    expect(sanitizeText('  ', 10)).toBeNull();
    expect(sanitizeText('<b>Hello</b> there', 50)).toBe('Hello there');
    expect(sanitizeText('abcdefgh', 3)).toBe('abc');
  });
});

describe('who sees what', () => {
  it('shows hidden moments to editors only', () => {
    const hidden = { hidden: true };
    expect(canSeeMoment('VIEWER', { hidden: false })).toBe(true);
    expect(canSeeMoment('VIEWER', hidden)).toBe(false);
    expect(canSeeMoment('EDITOR', hidden)).toBe(true);
    expect(canSeeMoment(null, { hidden: false })).toBe(false);
  });

  it('shows a moment’s photos by the photo rules, a trip’s own to its people', () => {
    const open = { tripId: 't1', hidden: false };
    const hidden = { tripId: 't1', hidden: true };
    expect(canSeeMomentPhoto(null, { mapRole: 'OWNER' })).toBe(false);
    expect(canSeeMomentPhoto(open, { mapRole: 'VIEWER' })).toBe(true);
    expect(canSeeMomentPhoto(hidden, { mapRole: 'VIEWER' })).toBe(false);
    expect(canSeeMomentPhoto(hidden, { mapRole: 'EDITOR' })).toBe(true);
    expect(canSeeMomentPhoto(open, { trip: { id: 't1', role: 'VIEWER' } })).toBe(true);
    expect(canSeeMomentPhoto({ tripId: 't2' }, { trip: { id: 't1', role: 'EDITOR' } })).toBe(false);
    expect(canSeeMomentPhoto(hidden, { trip: { id: 't1', role: 'EDITOR' } })).toBe(true);
    expect(canSeeMomentPhoto(open, {})).toBe(false);
  });

  it('lets a map editor attach any photo, anyone else only the trip’s', () => {
    expect(momentPhotoScope('EDITOR', 'trip-1')).toBeNull();
    expect(momentPhotoScope('VIEWER', 'trip-1')).toBe('trip-1');
    expect(momentPhotoScope(null, undefined)).toBeNull();
  });
});

describe('momentPage', () => {
  it('lists the map’s moments oldest first, undated last, hidden ones for editors', () => {
    // The demo couple's timeline (data/demoTravels.js), the hidden note with no date last
    expect(ids(page({}))).toEqual([
      'moment-born',
      'moment-partner-born',
      'moment-dublin',
      'moment-first-trip',
      'moment-flamenco',
      'moment-engaged',
      'moment-wedding',
      'moment-acropolis',
      'moment-tagine',
      'moment-petra',
      'moment-safari',
      'moment-table-mountain',
      'moment-taj',
      'moment-dive',
      'moment-beach',
      'moment-milford',
      'moment-lucha',
      'moment-anniversary',
      'moment-gelato',
      'moment-carnival',
      'moment-schonbrunn',
      'moment-party',
    ]);
    expect(ids(page({}, viewer))).not.toContain('moment-party');
    expect(page({}).moments.find((m) => m.id === 'moment-party').hidden).toBe(true);
    expect('hidden' in page({}, viewer).moments[0]).toBe(false);
  });

  it('pages with an opaque cursor', () => {
    const first = page({ limit: '2' });
    expect(ids(first)).toEqual(['moment-born', 'moment-partner-born']);
    const second = page({ limit: '2', cursor: first.nextCursor });
    expect(ids(second)).toEqual(['moment-dublin', 'moment-first-trip']);
    const last = page({ limit: '60', cursor: second.nextCursor });
    expect(last.nextCursor).toBeNull();
    expect(page({ cursor: 'not-a-cursor' })).toEqual({ error: MOMENT_MESSAGES.malformed });
  });

  it('filters by country and trip, and refuses an unknown country', () => {
    expect(ids(page({ country: 'FR' }))).toEqual(['moment-engaged']);
    expect(ids(page({ tripId: 'trip-italy' }))).toEqual(['moment-gelato']);
    expect(ids(momentPage({ query: { tripId: 'nope' }, mapId: HOME_MAP, tripId: 'trip-italy', ...owner }))).toEqual(['moment-gelato']);
    expect(page({ country: 'ZZ' })).toEqual({ error: MOMENT_MESSAGES.countryNotFound });
    expect(page({ tripId: '' })).toEqual({ error: MOMENT_MESSAGES.tripNotFound });
  });

  it('shows a pin to editors always, to viewers only when shared', () => {
    const born = (as) => page({}, as).moments.find((m) => m.id === 'moment-born').spot;
    const engaged = (as) => page({}, as).moments.find((m) => m.id === 'moment-engaged').spot;
    expect(born(owner)).toEqual({ latitude: 53.4808, longitude: -2.2426, shared: false });
    expect(born(viewer)).toBeNull();
    expect(engaged(viewer)).toEqual({ latitude: 48.8584, longitude: 2.2945 });
  });

  it('lists the day’s anniversaries in earlier years, newest first', () => {
    expect(ids(page({ anniversary: '2026-04-12' }))).toEqual(['moment-engaged']);
    expect(ids(page({ anniversary: '2019-04-12' }))).toEqual([]);
    expect(page({ anniversary: '2026-02-30' })).toEqual({ error: MOMENT_MESSAGES.malformed });
    expect(page({ anniversary: 'today' })).toEqual({ error: MOMENT_MESSAGES.malformed });
  });

  it('finds a leap day’s moment on 28 February in other years', () => {
    db().moments.push({ ...db().moments[0], id: 'moment-leap', happenedOn: '2020-02-29', datePrecision: 'DAY' });
    expect(ids(page({ anniversary: '2027-02-28' }))).toContain('moment-leap');
    expect(ids(page({ anniversary: '2028-02-28' }))).not.toContain('moment-leap');
  });
});

describe('momentView', () => {
  it('names the landmark, orders the travellers and leaves out photos the caller can’t see', () => {
    const moment = db().moments.find((m) => m.id === 'moment-passport');
    const asEditor = momentView(moment, { role: 'OWNER', photoAccess: { mapRole: 'OWNER' } });
    expect(asEditor.photos.map((p) => p.id)).toEqual(['photo-bangkok']);
    const engaged = momentView(db().moments.find((m) => m.id === 'moment-engaged'), owner);
    expect(engaged.landmark).toEqual({ id: 'lm-eiffel-tower', name: expect.any(String) });
    expect(engaged.travellerIds).toEqual(['trav-test', 'trav-alex']);
    db().photos.find((p) => p.id === 'photo-eiffel').hidden = true;
    expect(momentView(db().moments.find((m) => m.id === 'moment-engaged'), viewer).photos).toEqual([]);
  });
});

describe('parseMoment', () => {
  const parse = (body, options = {}) => parseMoment(body, { mapId: HOME_MAP, ...options });

  it('takes a whole moment', () => {
    const { value } = parse({ ...good, text: ' Six bars ', happenedOn: '2018-08', datePrecision: 'MONTH', travellerIds: ['trav-alex'], photoIds: ['photo-alhambra'] });
    expect(value.data).toMatchObject({ kind: 'SAW_OR_DID', title: 'Tapas crawl', text: 'Six bars', countryCode: 'ES', datePrecision: 'MONTH' });
    expect(value.travellerIds).toEqual(['trav-alex']);
    expect(value.photoIds).toEqual(['photo-alhambra']);
  });

  it('refuses each field that doesn’t fit, in the server’s words', () => {
    expect(parse({ ...good, kind: 'PARTY' }).error).toBe(MOMENT_MESSAGES.kind);
    expect(parse({ ...good, title: '  ' }).error).toBe(MOMENT_MESSAGES.title);
    expect(parse({ ...good, text: 5 }).error).toBe(MOMENT_MESSAGES.text);
    expect(parse({ ...good, happenedOn: '2018-13', datePrecision: 'MONTH' }).error).toBe(MOMENT_MESSAGES.date);
    expect(parse({ ...good, countryCode: 'ZZ' }).error).toBe(MOMENT_MESSAGES.countryNotFound);
    expect(parse({ ...good, landmarkId: 'lm-nope' }).error).toBe(MOMENT_MESSAGES.landmarkNotFound);
    expect(parse({ ...good, landmarkId: 'lm-colosseum' }).error).toBe(MOMENT_MESSAGES.landmarkWrongCountry);
    expect(parse({ ...good, hidden: 'yes' }).error).toBe(MOMENT_MESSAGES.malformed);
    expect(parse({ ...good, travellerIds: ['trav-sam'] }).error).toBe(MOMENT_MESSAGES.travellersNotOnMap);
    expect(parse({ ...good, travellerIds: ['trav-alex', 'trav-alex'] }).error).toBe(MOMENT_MESSAGES.travellersNotOnMap);
    expect(parse({ ...good, photoIds: ['photo-bangkok'] }).error).toBe(MOMENT_MESSAGES.photos);
    expect(parse({ ...good, photoIds: Array.from({ length: 21 }, (_, i) => `p${i}`) }).error).toBe(MOMENT_MESSAGES.photos);
    expect(parse({ ...good, photoIds: ['photo-alhambra'] }, { photoScope: 'trip-italy' }).error).toBe(MOMENT_MESSAGES.photosNotOnTrip);
  });

  it('keeps a UK nation as the UK on a map that doesn’t split it, and as itself on one that does', () => {
    expect(parse({ ...good, countryCode: 'XC' }).value.data.countryCode).toBe('GB');
    db().maps.find((m) => m.id === HOME_MAP).splitUk = true;
    expect(parse({ ...good, countryCode: 'XC' }).value.data.countryCode).toBe('XC');
  });

  it('changes only what a PATCH sends, and checks a kept landmark against a new country', () => {
    const current = db().moments.find((m) => m.id === 'moment-engaged');
    expect(parse({ title: 'Engaged!' }, { partial: true, current }).value.data).toEqual({ title: 'Engaged!' });
    expect(parse({ countryCode: 'BE' }, { partial: true, current }).error).toBe(MOMENT_MESSAGES.landmarkWrongCountry);
    expect(parse({ countryCode: 'BE', landmarkId: null }, { partial: true, current }).value.data).toMatchObject({ countryCode: 'BE', landmarkId: null, ukNation: null });
  });

  it('takes the map’s own photos for Sam’s map, not the test user’s', () => {
    expect(parseMoment({ ...good, countryCode: 'TH', photoIds: ['photo-bangkok'] }, { mapId: SAM_MAP }).value.photoIds).toEqual(['photo-bangkok']);
  });
});

describe('parseMomentSpotFor', () => {
  it('leaves the pin alone when none is sent', async () => {
    expect(await parseMomentSpotFor({}, { countryCode: 'FR' })).toEqual({ data: {} });
  });

  it('takes a pin in the moment’s country and refuses one outside it', { timeout: 20000 }, async () => {
    expect(await parseMomentSpotFor({ spot: { latitude: 48.8584, longitude: 2.2945, shared: true } }, { countryCode: 'FR' })).toEqual({
      data: { latitude: 48.8584, longitude: 2.2945, spotShared: true },
    });
    expect((await parseMomentSpotFor({ spot: { latitude: 48.8584, longitude: 2.2945 } }, { countryCode: 'IT' })).error).toBe(MOMENT_MESSAGES.spotWrongCountry);
    expect((await parseMomentSpotFor({ spot: { latitude: 120, longitude: 0 } }, { countryCode: 'FR' })).error).toBe(MOMENT_MESSAGES.spot);
  });

  it('takes a pin off, and wants a pinned moment’s pin moved with it to another country', { timeout: 20000 }, async () => {
    expect(await parseMomentSpotFor({ spot: null }, { countryCode: 'FR' })).toEqual({ data: { latitude: null, longitude: null, spotShared: false } });
    const current = { countryCode: 'FR', latitude: 48.8584, longitude: 2.2945 };
    expect((await parseMomentSpotFor({}, { countryCode: 'ES', current })).error).toBe(MOMENT_MESSAGES.spotWrongCountry);
    expect(await parseMomentSpotFor({}, { countryCode: 'FR', current })).toEqual({ data: {} });
  });
});
