import { beforeEach, describe, expect, it } from 'vitest';
import {
  COPY_MESSAGES,
  copiesOn,
  copyChoices,
  copyContents,
  copyRoom,
  copyView,
  countTravellerMoments,
  countTravellerTrips,
  findPhotosToCopy,
  isCopyable,
  isId,
  listedRequests,
  parseCopyChoice,
  placeCopy,
  pruneCopyRequests,
  runTravelCopy,
  travellersOf,
} from '@/dev/mock/travelCopies';
import * as server from '../../../../../server/src/utils/travelCopies.js';
import { HOME_MAP, MORGANS_MAP, USER, db, freshStore } from './mockApi';

beforeEach(() => freshStore());

const CHARLIE = 'trav-morgan-charlie';
const request = (fields = {}) => ({
  id: 'copy-1',
  status: 'APPROVED',
  fromMapId: MORGANS_MAP,
  toMapId: HOME_MAP,
  travellerId: CHARLIE,
  requestedById: USER,
  tripIds: ['trip-morgans-spain'],
  momentIds: ['moment-morgans-churros'],
  photoIds: findPhotosToCopy(db(), MORGANS_MAP, { tripIds: ['trip-morgans-spain'], momentIds: ['moment-morgans-churros'] }).map((p) => p.id),
  countryCodes: [],
  photoCursor: 0,
  copiedPhotos: 0,
  skippedPhotos: 0,
  createdAt: new Date().toISOString(),
  decidedAt: null,
  finishedAt: null,
  ...fields,
});

describe('the rules the server shares', () => {
  it('places a copy as the server does', () => {
    const rows = [
      { countryCode: null },
      { countryCode: 'FR' },
      { countryCode: 'XH' },
      { countryCode: 'XC' },
      { countryCode: 'GB', ukNation: 'XW' },
      { countryCode: 'GB', latitude: 55.95, longitude: -3.19 },
      { countryCode: 'GB' },
    ];
    for (const row of rows) for (const splitUk of [true, false]) expect(placeCopy(row, splitUk)).toEqual(server.placeCopy(row, splitUk));
    expect(placeCopy({ countryCode: 'XC' }, false)).toEqual({ countryCode: 'GB', ukNation: 'XC' });
  });

  it('works out the room for a copy as the server does', () => {
    const args = { places: ['FR', 'FR', 'IT', null, 'FR'], counts: { FR: 29, IT: 0, '': 30 }, planId: 'FREE' };
    expect(copyRoom(args)).toEqual(server.copyRoom(args));
    expect(copyRoom(args)).toMatchObject({ photos: 5, fits: 2 });
  });
});

describe('parseCopyChoice', () => {
  const good = { toMapId: HOME_MAP, travellerId: CHARLIE, tripIds: ['trip-morgans-spain', 'trip-morgans-spain'] };

  it('reads a choice, each id once', () => {
    expect(parseCopyChoice(good).value).toEqual({ toMapId: HOME_MAP, travellerId: CHARLIE, tripIds: ['trip-morgans-spain'], momentIds: [], photoIds: [], countryCodes: [] });
    expect(parseCopyChoice({ ...good, tripIds: [], countryCodes: ['ES', 'ES'] }).value.countryCodes).toEqual(['ES']);
  });

  it('refuses a choice it can’t copy, saying why', () => {
    expect(parseCopyChoice(null).error).toBe(COPY_MESSAGES.invalidCopyChoice);
    expect(parseCopyChoice({ ...good, toMapId: '' }).error).toBe(COPY_MESSAGES.invalidCopyTarget);
    expect(parseCopyChoice({ ...good, travellerId: 'a b' }).error).toBe(COPY_MESSAGES.invalidCopyTraveller);
    expect(parseCopyChoice({ ...good, tripIds: 'trip' }).error).toBe(COPY_MESSAGES.invalidCopyChoice);
    expect(parseCopyChoice({ ...good, countryCodes: ['es'] }).error).toBe(COPY_MESSAGES.invalidCopyChoice);
    expect(parseCopyChoice({ ...good, tripIds: [] }).error).toBe(COPY_MESSAGES.emptyCopyChoice);
    expect(isId('x'.repeat(101))).toBe(false);
  });
});

describe('choosing', () => {
  it('offers Charlie the Easter trip, the churros and Spain and Ireland’s photos, never the hidden one', () => {
    const choices = copyChoices(db(), MORGANS_MAP, CHARLIE);
    expect(choices.trips).toEqual([expect.objectContaining({ id: 'trip-morgans-spain', countries: ['ES'], photos: 2, startDate: '2010-04-01' })]);
    expect(choices.moments).toEqual([expect.objectContaining({ id: 'moment-morgans-churros', photoIds: ['photo-morgans-sagrada'] })]);
    expect(choices.countries).toEqual([
      { countryCode: 'ES', photos: 2 },
      { countryCode: 'IE', photos: 1 },
    ]);
    expect(copyChoices(db(), MORGANS_MAP, 'trav-morgan-nora').moments).toEqual([]);
  });

  it('finds every copyable photo a choice takes, oldest taken first', () => {
    const ids = findPhotosToCopy(db(), MORGANS_MAP, { countryCodes: ['ES', 'IE'] }).map((p) => p.id);
    expect(ids).toEqual(['photo-morgans-sagrada', 'photo-morgans-alhambra', 'photo-morgans-moher']);
    expect(findPhotosToCopy(db(), MORGANS_MAP, {})).toEqual([]);
    expect(findPhotosToCopy(db(), MORGANS_MAP, { photoIds: ['photo-morgans-hidden'] })).toEqual([]);
    expect(isCopyable({ kind: 'VIDEO' })).toBe(false);
  });

  it('counts only the traveller’s own trips and shown moments', () => {
    expect(countTravellerTrips(db(), MORGANS_MAP, CHARLIE, ['trip-morgans-spain', 'trip-italy'])).toBe(1);
    expect(countTravellerMoments(db(), MORGANS_MAP, CHARLIE, ['moment-morgans-churros', 'moment-born'])).toBe(1);
    expect(travellersOf(db(), MORGANS_MAP).map((t) => t.name)).toEqual(['Alex', 'Charlie', 'Nora']);
  });
});

describe('requests', () => {
  it('shows a request to the person asking, who may withdraw it while it waits', () => {
    const view = copyView(request({ status: 'PENDING' }), { canDecide: true });
    expect(view).toMatchObject({
      status: 'PENDING',
      fromMap: { id: MORGANS_MAP, name: 'The Morgans' },
      toMap: { id: HOME_MAP },
      traveller: { id: CHARLIE, name: 'Charlie' },
      requestedBy: { id: USER, name: 'Charlie Reid' },
      trips: 1,
      moments: 1,
      photos: 2,
      mine: true,
      canDecide: true,
      canCancel: true,
    });
    expect(copyView(request({ status: 'DONE' }), { canDecide: true })).toMatchObject({ canDecide: false, canCancel: false });
  });

  it('lists the open requests first, then the last 20 finished', () => {
    const at = (n) => new Date(Date.UTC(2026, 0, 1 + n)).toISOString();
    const rows = [
      ...Array.from({ length: 25 }, (_, i) => ({ id: `d${i}`, status: i % 2 ? 'DONE' : 'DECLINED', createdAt: at(i) })),
      { id: 'p', status: 'PENDING', createdAt: at(0) },
      { id: 'a', status: 'APPROVED', createdAt: at(1) },
    ];
    const listed = listedRequests(rows);
    expect(listed.slice(0, 2).map((r) => r.id)).toEqual(['a', 'p']);
    expect(listed).toHaveLength(22);
    expect(listed[2].id).toBe('d24');
  });

  it('says what a request holds, for deciding', () => {
    const contents = copyContents(db(), request());
    expect(contents.tripList).toEqual([{ id: 'trip-morgans-spain', title: 'Spain at Easter', startDate: '2010-04-01' }]);
    expect(contents.momentList.map((m) => m.title)).toEqual(['Charlie’s first churros']);
    expect(contents.countries).toEqual([{ countryCode: 'ES', photos: 2 }]);
  });

  it('drops requests whose map, traveller or asker has gone', () => {
    db().travelCopyRequests = [request(), request({ id: 'gone', toMapId: 'no-such-map' })];
    pruneCopyRequests(db());
    expect(db().travelCopyRequests.map((r) => r.id)).toEqual(['copy-1']);
  });
});

describe('runTravelCopy', () => {
  it('copies the trip, its photos and the moment onto the new map, once, and moves first visits earlier', () => {
    const done = runTravelCopy(request());
    expect(done).toMatchObject({ status: 'DONE', photoCursor: 2, copiedPhotos: 2, skippedPhotos: 0 });
    const trip = db().trips.find((t) => t.mapId === HOME_MAP && t.copiedFromId === 'trip-morgans-spain');
    expect(trip).toMatchObject({ title: 'Spain at Easter', status: 'COMPLETED' });
    expect(db().stops.filter((s) => s.tripId === trip.id)).toHaveLength(2);
    const photos = copiesOn(db().photos, HOME_MAP, ['photo-morgans-sagrada', 'photo-morgans-alhambra', 'photo-morgans-hidden']);
    expect([...photos.keys()].sort()).toEqual(['photo-morgans-alhambra', 'photo-morgans-sagrada']);
    expect(trip.coverPhotoId).toBe(photos.get('photo-morgans-sagrada'));
    expect(db().moments.filter((m) => m.mapId === HOME_MAP && m.copiedFromId === 'moment-morgans-churros')).toHaveLength(1);
    expect(db().visits.find((v) => v.mapId === HOME_MAP && v.countryCode === 'ES').firstVisitedOn).toBe('2010-04-01');

    const before = [db().trips.length, db().photos.length, db().moments.length];
    runTravelCopy(request({ id: 'copy-2' }));
    expect([db().trips.length, db().photos.length, db().moments.length]).toEqual(before);
  });

  it('leaves a request that isn’t approved, or whose map has gone, as it is', () => {
    const pending = request({ status: 'PENDING' });
    expect(runTravelCopy(pending)).toBe(pending);
    expect(pending.status).toBe('PENDING');
    expect(runTravelCopy(request({ toMapId: 'gone' })).status).toBe('APPROVED');
  });
});
