// Mock mode only: importing from Polarsteps (docs/API.md "Importing from Polarsteps"), as the
// server's controllers/imports.js: what a map has imported already, and the trips with their
// stops (a completed one marks its countries visited and gives first visits when earlier).
// Editors only; places follow the map (a UK stop goes to its nation on a split map, by position).
import { deny, fail, ok, route } from '../mockAdapter';
import { getDb, me, newId, newShareCode } from '../store';
import { mapRole, markVisited } from '../views';
import { COUNTRY_BY_CODE } from '@/utils/map/countries';
import { UK, placeOnMap } from '@/utils/map/ukNations';
import { ukNationAt } from '../ukNationLookup';

const NOT_FOUND = 'This map could not be found.';
const INVALID = 'That import can’t be read. Choose the download from Polarsteps again.';
const TRIP_KEY = /^polarsteps:trip:[A-Za-z0-9._/-]{1,200}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES = ['PLANNED', 'ACTIVE', 'COMPLETED'];

const findMap = (id) => getDb().maps.find((m) => m.id === id) || null;
const day = (value) => (typeof value === 'string' && DAY.test(value) ? value : null);
const ordered = (from, to) => (from && to && to < from ? [from, null] : [from, to]);
const clean = (text, max) => (typeof text === 'string' ? text.replace(/<[^>]*>/g, '').trim().slice(0, max) || null : null);

function importedKeys(mapId) {
  const db = getDb();
  const mine = (row) => row.mapId === mapId && typeof row.importedFrom === 'string';
  return {
    trips: db.trips.filter(mine).map((trip) => ({ key: trip.importedFrom, tripId: trip.id })),
    photos: db.photos.filter(mine).map((photo) => photo.importedFrom),
    moments: db.moments.filter(mine).map((moment) => moment.importedFrom),
  };
}

export function registerImportRoutes() {
  route('GET', '/api/maps/:mapId/imports/polarsteps', ({ params }) => {
    const map = findMap(params.mapId);
    return deny(mapRole(map), 'EDITOR', NOT_FOUND) || ok(importedKeys(map.id));
  });

  route('POST', '/api/maps/:mapId/imports/polarsteps', ({ params, body }) => {
    const db = getDb();
    const map = findMap(params.mapId);
    const denied = deny(mapRole(map), 'EDITOR', NOT_FOUND);
    if (denied) return denied;
    const list = Array.isArray(body?.trips) ? body.trips : null;
    if (!list || !list.length || list.length > 100) return fail(400, INVALID);
    if (list.some((t) => !t || !TRIP_KEY.test(t.key ?? '') || !STATUSES.includes(t.status) || !Array.isArray(t.stops ?? []))) return fail(400, INVALID);

    const known = new Map(importedKeys(map.id).trips.map((t) => [t.key, t.tripId]));
    const traveller = db.travellers.find((t) => t.mapId === map.id && t.userId === me().id);
    const results = [];
    let created = 0;
    for (const raw of list) {
      if (known.has(raw.key)) {
        results.push({ key: raw.key, tripId: known.get(raw.key), created: false });
        continue;
      }
      const [startDate, endDate] = ordered(day(raw.startDate), day(raw.endDate));
      const trip = {
        id: newId(),
        mapId: map.id,
        createdById: me().id,
        title: clean(raw.title, 120) || 'A trip',
        description: null,
        status: raw.status,
        startDate,
        endDate,
        coverPhotoId: null,
        linkAccess: 'RESTRICTED',
        shareCode: newShareCode(),
        travellerIds: traveller ? [traveller.id] : [],
        importedFrom: raw.key,
        createdAt: new Date().toISOString(),
      };
      db.trips.push(trip);
      const firsts = new Map();
      (raw.stops ?? []).forEach((stop) => {
        const code = typeof stop?.countryCode === 'string' ? stop.countryCode.toUpperCase() : '';
        if (!COUNTRY_BY_CODE[code]) return;
        const nation = code === UK && map.splitUk && Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude) ? ukNationAt(stop.latitude, stop.longitude) : null;
        const countryCode = nation ?? placeOnMap(code, map.splitUk);
        const [arriveOn, leaveOn] = ordered(day(stop.arriveOn), day(stop.leaveOn));
        const position = db.stops.filter((s) => s.tripId === trip.id).length;
        db.stops.push({ id: newId(), tripId: trip.id, position, countryCode, landmarkId: null, placeName: clean(stop.placeName, 120), arriveOn, leaveOn, notes: null });
        const date = arriveOn ?? startDate;
        if (date && (!firsts.has(countryCode) || date < firsts.get(countryCode))) firsts.set(countryCode, date);
      });
      if (trip.status === 'COMPLETED') {
        for (const [code, date] of firsts) {
          markVisited(map.id, code, 'TRIP');
          const visit = db.visits.find((v) => v.mapId === map.id && v.countryCode === code);
          if (visit && (!visit.firstVisitedOn || date < visit.firstVisitedOn)) visit.firstVisitedOn = date;
        }
      }
      created += 1;
      results.push({ key: raw.key, tripId: trip.id, created: true });
    }
    return ok({ trips: results }, created ? 201 : 200);
  });
}
