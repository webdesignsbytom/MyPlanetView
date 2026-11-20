// Mock mode only: country maps (docs/API.md "Country maps"), as the server's
// controllers/countryMaps.js, utils/subdivisions.js and utils/pins.js: one country's states
// visited, and its pins with a visit for every time. The states list is the server's
// (data/subdivisions.js, made by images/src/tools/country-maps.mjs).
import SUBDIVISIONS from './data/subdivisions';
import { getDb, me, newId } from './store';
import { atLeast, canSeePhoto, countryExists, photoThumbUrl } from './views';
import { spotFitsPlace } from './momentSpots';
import { serverText } from '@/utils/regex/regex';
import { parseMomentDate } from '@/utils/moments/momentDates';
import { isSpecialPlace, withParentPlaces } from '@/utils/map/specialPlaces';
import { UK, isUkNation, placeOnMap } from '@/utils/map/ukNations';
import { ukNationAt } from './ukNationLookup';

export const MESSAGES = {
  mapNotFound: "That map doesn't exist, or it hasn't been shared with you.",
  countryMapNotFound: 'Only a country has a map of its own.',
  subdivisionNotFound: "That state or province isn't on any country's map.",
  invalidStatus: 'Choose visited, lived there or want to go.',
  pinNotFound: "That pin doesn't exist, or it hasn't been shared with you.",
  pinVisitNotFound: "That visit isn't on this pin.",
  name: 'A pin needs a name, up to 80 characters.',
  notes: 'A note is text, up to 2,000 characters.',
  position: 'A pin needs a place on the map: a latitude and a longitude.',
  hidden: 'hidden must be true or false.',
  wrongCountry: "That spot isn't in this country. Put the pin inside it.",
  pinsFull: 'A map can have up to 1,000 pins.',
  visitsFull: 'A pin can have up to 100 visits.',
  date: "A visit's date is a year (2019), a month (2019-06) or a day (2019-06-14), from 1800 to 2200, with DAY, MONTH or YEAR saying how much of it is known. Leave it empty if you're not sure.",
  photos: 'Choose up to 50 photos, each from this map.',
};

const PIN_NAME_MAX = 80;
const PIN_NOTES_MAX = 2000;
const PINS_PER_MAP = 1000;
const VISITS_PER_PIN = 100;
const VISIT_PHOTOS_MAX = 50;
const STATUSES = ['VISITED', 'LIVED', 'WANT_TO_GO'];
const COUNTED = ['VISITED', 'LIVED'];

const clean = (text, max) => (serverText(text) || '').trim().slice(0, max);
const state = (code) => (typeof code === 'string' && Object.hasOwn(SUBDIVISIONS, code) ? SUBDIVISIONS[code] : null);

/** The country a country map is asked for: a country, a nation on a split map; a region's is its country's. */
export function countryMapOf(code, splitUk) {
  if (typeof code !== 'string' || !countryExists(code)) return null;
  const place = isUkNation(code) ? (splitUk ? code : UK) : placeOnMap(code, false);
  return isSpecialPlace(place) ? null : place;
}

const onCountryMap = (code, country) => {
  const s = state(code);
  if (!s) return false;
  return isUkNation(country) ? s.m === UK && s.n === country : s.m === country;
};

// ── States ────────────────────────────────────────────────────────────────────────────

export function subdivisionStatuses(mapId, country) {
  const db = getDb();
  const own = (db.subdivisionVisits || [])
    .filter((v) => v.mapId === mapId && onCountryMap(v.code, country))
    .map((v) => ({ code: v.code, status: v.status }));
  const regions = Object.entries(SUBDIVISIONS)
    .filter(([code, s]) => s.same && onCountryMap(code, country))
    .map(([code, s]) => [code, db.visits.find((v) => v.mapId === mapId && v.countryCode === s.r)])
    .filter(([, visit]) => visit)
    .map(([code, visit]) => ({ code, status: visit.status }));
  return [...own, ...regions];
}

// Missing places added as VISITED, wanted ones turned VISITED (createMissingVisits)
function markPlaces(mapId, places) {
  const db = getDb();
  const changed = [];
  for (const code of withParentPlaces(places)) {
    const visit = db.visits.find((v) => v.mapId === mapId && v.countryCode === code);
    if (!visit) {
      const added = { mapId, countryCode: code, status: 'VISITED', source: 'MANUAL', firstVisitedOn: null, notes: null };
      db.visits.push(added);
      changed.push(added);
    } else if (visit.status === 'WANT_TO_GO') {
      Object.assign(visit, { status: 'VISITED', source: 'MANUAL' });
      changed.push(visit);
    }
  }
  return changed;
}

const visitView = ({ countryCode, status, source, firstVisitedOn, notes }) => ({ countryCode, status, source, firstVisitedOn, notes });

/** -> `{ subdivision, implied }` or `{ status, error }` */
export function setSubdivision(map, code, status) {
  const s = state(code);
  if (!s) return { status: 404, error: MESSAGES.subdivisionNotFound };
  if (!STATUSES.includes(status)) return { status: 400, error: MESSAGES.invalidStatus };
  const db = getDb();
  // Hawaii's state is the Hawaii region's own visit
  if (s.same) {
    let visit = db.visits.find((v) => v.mapId === map.id && v.countryCode === s.r);
    if (!visit) {
      visit = { mapId: map.id, countryCode: s.r, status, source: 'MANUAL', firstVisitedOn: null, notes: null };
      db.visits.push(visit);
    } else if (visit.status !== status) Object.assign(visit, { status, source: 'MANUAL' });
    const implied = COUNTED.includes(status) ? markPlaces(map.id, [s.m]) : [];
    return { subdivision: { code, status }, implied: [visit, ...implied].map(visitView) };
  }
  db.subdivisionVisits ||= [];
  const row = db.subdivisionVisits.find((v) => v.mapId === map.id && v.code === code);
  if (row) row.status = status;
  else db.subdivisionVisits.push({ mapId: map.id, code, countryCode: s.m, status });
  const country = s.m === UK && map.splitUk && s.n ? s.n : s.m;
  const implied = COUNTED.includes(status) ? markPlaces(map.id, [...(s.r ? [s.r] : []), country]) : [];
  return { subdivision: { code, status }, implied: implied.map(visitView) };
}

export function clearSubdivision(map, code) {
  const s = state(code);
  if (!s) return { status: 404, error: MESSAGES.subdivisionNotFound };
  const db = getDb();
  if (s.same) db.visits = db.visits.filter((v) => !(v.mapId === map.id && v.countryCode === s.r));
  else db.subdivisionVisits = (db.subdivisionVisits || []).filter((v) => !(v.mapId === map.id && v.code === code));
  return { message: 'State cleared.' };
}

// ── Pins ──────────────────────────────────────────────────────────────────────────────

const canSeePin = (pin, role) => atLeast(role, 'VIEWER') && (!pin.hidden || atLeast(role, 'EDITOR'));
const visitsOf = (pinId) => (getDb().pinVisits || []).filter((v) => v.pinId === pinId);
// Newest first, undated last (the server's order)
const byNewest = (a, b) => (b.visitedOn ?? '').localeCompare(a.visitedOn ?? '') || (a.visitedOn ? 0 : 1) - (b.visitedOn ? 0 : 1) || b.createdAt.localeCompare(a.createdAt);

export function pinList(mapId, country, role) {
  const nation = isUkNation(country) ? country : null;
  return (getDb().pins || [])
    .filter((p) => p.mapId === mapId && p.countryCode === (nation ? UK : country) && canSeePin(p, role))
    .filter((p) => !nation || ukNationAt(p.latitude, p.longitude) === nation)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => {
      const visits = visitsOf(p.id);
      const latest = visits.filter((v) => v.visitedOn).sort(byNewest)[0];
      return {
        id: p.id,
        name: p.name,
        countryCode: p.countryCode,
        latitude: p.latitude,
        longitude: p.longitude,
        visitCount: visits.length,
        latestVisit: latest ? { visitedOn: latest.visitedOn, datePrecision: latest.datePrecision } : null,
        ...(atLeast(role, 'EDITOR') ? { hidden: p.hidden } : {}),
      };
    });
}

/** A pin as `role` sees it, or null. */
export function pinDetail(pinId, role, { mapId } = {}) {
  const db = getDb();
  const pin = (db.pins || []).find((p) => p.id === pinId);
  if (!pin || (mapId && pin.mapId !== mapId) || !canSeePin(pin, role)) return null;
  return {
    id: pin.id,
    name: pin.name,
    notes: pin.notes,
    countryCode: pin.countryCode,
    latitude: pin.latitude,
    longitude: pin.longitude,
    ...(atLeast(role, 'EDITOR') ? { hidden: pin.hidden } : {}),
    createdAt: pin.createdAt,
    visits: visitsOf(pin.id)
      .sort(byNewest)
      .map((v) => ({
        id: v.id,
        visitedOn: v.visitedOn,
        datePrecision: v.datePrecision,
        notes: v.notes,
        photos: v.photoIds
          .map((id) => db.photos.find((p) => p.id === id))
          .filter((photo) => photo && canSeePhoto(photo, role))
          .map((photo) => ({ id: photo.id, countryCode: photo.countryCode, thumbUrl: photoThumbUrl(photo) })),
      })),
  };
}

const rounded = (n) => Math.round(n * 1e6) / 1e6;
const isLatLng = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

/** As the server's parsePin. -> `{ value }` or `{ error }` */
function parsePin(body, { partial = false } = {}) {
  const value = {};
  if (!partial || body.name !== undefined) {
    const name = typeof body.name === 'string' ? clean(body.name, PIN_NAME_MAX) : '';
    if (!name) return { error: MESSAGES.name };
    value.name = name;
  }
  if (body.notes !== undefined) {
    if (body.notes !== null && typeof body.notes !== 'string') return { error: MESSAGES.notes };
    value.notes = body.notes ? clean(body.notes, PIN_NOTES_MAX) || null : null;
  }
  if (!partial || body.latitude !== undefined || body.longitude !== undefined) {
    if (!isLatLng(body.latitude, body.longitude)) return { error: MESSAGES.position };
    value.latitude = rounded(body.latitude);
    value.longitude = rounded(body.longitude);
  }
  if (body.hidden !== undefined) {
    if (typeof body.hidden !== 'boolean') return { error: MESSAGES.hidden };
    value.hidden = body.hidden;
  }
  return { value };
}

/** As the server's parsePinVisit, with the photos checked against the map. */
function parseVisit(mapId, body = {}, { partial = false } = {}) {
  const data = {};
  const date = parseMomentDate(body.visitedOn, body.datePrecision);
  if (!date.ok) return { error: MESSAGES.date };
  if (date.value) Object.assign(data, { visitedOn: date.value.happenedOn, datePrecision: date.value.datePrecision });
  else if (!partial) Object.assign(data, { visitedOn: null, datePrecision: null });
  if (body.notes !== undefined) {
    if (body.notes !== null && typeof body.notes !== 'string') return { error: MESSAGES.notes };
    data.notes = body.notes ? clean(body.notes, PIN_NOTES_MAX) || null : null;
  }
  if (body.photoIds !== undefined) {
    const ids = body.photoIds;
    const onMap = new Set(getDb().photos.filter((p) => p.mapId === mapId).map((p) => p.id));
    if (!Array.isArray(ids) || ids.length > VISIT_PHOTOS_MAX || new Set(ids).size !== ids.length || !ids.every((id) => onMap.has(id))) {
      return { error: MESSAGES.photos };
    }
    data.photoIds = ids;
  }
  return { value: data };
}

/** -> `{ pin }` or `{ status, error }` */
export async function createPin(map, body = {}) {
  const country = countryMapOf(body.countryCode, false);
  if (!country) return { status: 400, error: MESSAGES.countryMapNotFound };
  const parsed = parsePin(body);
  if (parsed.error) return { status: 400, error: parsed.error };
  if (!(await spotFitsPlace(parsed.value, country))) return { status: 400, error: MESSAGES.wrongCountry };
  let visit = null;
  if (body.visit !== undefined && body.visit !== null) {
    const result = parseVisit(map.id, body.visit);
    if (result.error) return { status: 400, error: result.error };
    visit = result.value;
  }
  const db = getDb();
  db.pins ||= [];
  db.pinVisits ||= [];
  if (db.pins.filter((p) => p.mapId === map.id).length >= PINS_PER_MAP) return { status: 409, error: MESSAGES.pinsFull };
  const now = new Date().toISOString();
  // A new pin is the editors' own unless shared (`hidden: false`), as the server (a pin is an exact spot)
  const pin = { id: newId(), mapId: map.id, countryCode: country, notes: null, hidden: true, createdById: me().id, createdAt: now, ...parsed.value };
  db.pins.push(pin);
  if (visit) db.pinVisits.push({ id: newId(), pinId: pin.id, notes: null, photoIds: [], createdAt: now, ...visit });
  return { pin: pinDetail(pin.id, 'OWNER') };
}

export async function updatePin(pin, body = {}) {
  const parsed = parsePin(body, { partial: true });
  if (parsed.error) return { status: 400, error: parsed.error };
  if (parsed.value.latitude !== undefined && !(await spotFitsPlace(parsed.value, pin.countryCode))) return { status: 400, error: MESSAGES.wrongCountry };
  Object.assign(pin, parsed.value);
  return {};
}

export function deletePin(pin) {
  const db = getDb();
  db.pins = db.pins.filter((p) => p.id !== pin.id);
  db.pinVisits = (db.pinVisits || []).filter((v) => v.pinId !== pin.id);
}

export function addVisit(pin, body = {}) {
  const parsed = parseVisit(pin.mapId, body);
  if (parsed.error) return { status: 400, error: parsed.error };
  const db = getDb();
  db.pinVisits ||= [];
  if (visitsOf(pin.id).length >= VISITS_PER_PIN) return { status: 409, error: MESSAGES.visitsFull };
  db.pinVisits.push({ id: newId(), pinId: pin.id, notes: null, photoIds: [], createdAt: new Date().toISOString(), ...parsed.value });
  return {};
}

export function updateVisit(pin, visit, body = {}) {
  const parsed = parseVisit(pin.mapId, body, { partial: true });
  if (parsed.error) return { status: 400, error: parsed.error };
  Object.assign(visit, parsed.value);
  return {};
}

export function deleteVisit(visit) {
  const db = getDb();
  db.pinVisits = db.pinVisits.filter((v) => v.id !== visit.id);
}
