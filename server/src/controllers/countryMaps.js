// Country maps (docs/API.md "Country maps"; 18 Nov 2026, the user's wish): a country opened
// on its own, with the states or provinces a map has been to, and its pins, each a place
// someone keeps going back to, with a visit for every time (a date, a note, photos)
import { DOMAINS, EVENT_MESSAGES, sendDataResponse, sendMessageResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createCountryMapEvent } from '../event/travelUtils.js';
import { canEdit, canSeeMoment, canView, mapRoleFor } from '../utils/access.js';
import { COUNTED_VISIT_STATUSES, VISIT_STATUSES, isOneOf, isUuid } from '../utils/travelValidation.js';
import { isSpecialPlace } from '../utils/specialPlaces.js';
import { UK, isUkNation, placeOnMap, ukNationAt } from '../utils/ukNations.js';
import { isOnCountryMap, placesOfSubdivision, regionStatesOn, sameAsRegion, subdivisionCountry } from '../utils/subdivisions.js';
import { PINS_PER_MAP, VISITS_PER_PIN, parsePin, parsePinVisit } from '../utils/pins.js';
import { spotFitsPlace } from '../utils/momentSpots.js';
import { deleteVisitInDB, upsertVisitInDB } from '../domain/maps.js';
import { findMapPhotosByIds } from '../domain/moments.js';
import {
  createPinInDB,
  createPinVisitInDB,
  deletePinInDB,
  deletePinVisitInDB,
  deleteSubdivisionVisitInDB,
  findPinAccess,
  findPinDetail,
  findPinVisit,
  findPins,
  findPlaceVisits,
  findSubdivisionVisits,
  markSubdivisionInDB,
  updatePinInDB,
  updatePinVisitInDB,
} from '../domain/countryMaps.js';
import { badRequest, denyUnless, forbidden, handler, loadMap, notFound } from './helpers/travel.js';
import { isKnownCountry } from './helpers/countries.js';
import { pinSummaryView, pinView, visitView } from './helpers/views.js';

const D = DOMAINS.countryMaps;

/**
 * The country a country map is asked for (`?country=`): a country, or on a map that splits
 * the UK a nation; a region's is its country's. -> the code, or null (unknown, a special place).
 */
async function countryMapOf(code, splitUk) {
  if (!(await isKnownCountry(code))) return null;
  const place = isUkNation(code) ? (splitUk ? code : UK) : placeOnMap(code, false);
  return isSpecialPlace(place) ? null : place;
}

// ── States ────────────────────────────────────────────────────────────────────────────

/**
 * The states marked on one country's map: `[{ code, status }]`. A state that is a region on
 * its own (Hawaii) has the region's own visit.
 */
export async function subdivisionStatuses(mapId, country) {
  const kept = isUkNation(country) ? UK : country;
  const regionStates = regionStatesOn(country);
  const [rows, regionVisits] = await Promise.all([
    findSubdivisionVisits(mapId, kept),
    findPlaceVisits(mapId, regionStates.map(([, region]) => region)),
  ]);
  const statusOfRegion = new Map(regionVisits.map((v) => [v.countryCode, v.status]));
  return [
    ...rows.filter((row) => isOnCountryMap(row.subdivisionCode, country)).map((row) => ({ code: row.subdivisionCode, status: row.status })),
    ...regionStates.filter(([, region]) => statusOfRegion.has(region)).map(([code, region]) => ({ code, status: statusOfRegion.get(region) })),
  ];
}

export const getSubdivisionsHandler = handler(D, 'Get states', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (!canView(role)) return notFound(req, res, D, EVENT_MESSAGES.mapNotFound);
  const country = await countryMapOf(req.query?.country, map.splitUk);
  if (!country) return badRequest(req, res, D, EVENT_MESSAGES.countryMapNotFound);
  return sendDataResponse(res, 200, { subdivisions: await subdivisionStatuses(map.id, country) });
});

export const putSubdivisionHandler = handler(D, 'Save state', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return undefined;
  const { code } = req.params;
  const country = subdivisionCountry(code);
  if (!country) return notFound(req, res, D, EVENT_MESSAGES.subdivisionNotFound);
  const status = req.body?.status;
  if (!isOneOf(status, VISIT_STATUSES)) return badRequest(req, res, D, EVENT_MESSAGES.invalidVisitStatus);

  // A state that is a region on its own (Hawaii, XH): its visit is the region's
  const region = sameAsRegion(code);
  if (region) {
    const { visit, implied } = await upsertVisitInDB({ mapId: map.id, countryCode: region, status, firstVisitedOn: undefined, notes: undefined });
    logEvent(createCountryMapEvent({ user: req.user, action: 'State Save Success', id: map.id, detail: `${code}=${status}` }));
    return sendDataResponse(res, 200, { subdivision: { code, status: visit.status }, implied: [visit, ...implied].map(visitView) });
  }

  // Marked visited or lived: the region it's in and its country come with it, missing ones
  // added as VISITED (as the South Pole brings Antarctica), in the same transaction
  const places = COUNTED_VISIT_STATUSES.includes(status) ? placesOfSubdivision(code, map.splitUk) : [];
  const { row, implied } = await markSubdivisionInDB({ mapId: map.id, subdivisionCode: code, countryCode: country, status, places });
  logEvent(createCountryMapEvent({ user: req.user, action: 'State Save Success', id: map.id, detail: `${code}=${status}` }));
  return sendDataResponse(res, 200, { subdivision: { code: row.subdivisionCode, status: row.status }, implied: implied.map(visitView) });
});

export const deleteSubdivisionHandler = handler(D, 'Delete state', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return undefined;
  const { code } = req.params;
  if (!subdivisionCountry(code)) return notFound(req, res, D, EVENT_MESSAGES.subdivisionNotFound);
  const region = sameAsRegion(code);
  await (region ? deleteVisitInDB(map.id, region) : deleteSubdivisionVisitInDB(map.id, code));
  logEvent(createCountryMapEvent({ user: req.user, action: 'State Delete Success', id: map.id, detail: code }));
  return sendDataResponse(res, 200, { message: 'State cleared.' });
});

// ── Pins ──────────────────────────────────────────────────────────────────────────────

/**
 * One country's pins on a map, as `role` may see them (hidden ones for editors only). A UK
 * nation's map has the UK's pins inside that nation.
 */
export async function pinList(mapId, country, role) {
  const nation = isUkNation(country) ? country : null;
  const pins = await findPins(mapId, { countryCode: nation ? UK : country, includeHidden: canEdit(role) });
  return pins.filter((pin) => !nation || ukNationAt(pin.latitude, pin.longitude) === nation).map((pin) => pinSummaryView(pin, { role }));
}

export const getPinsHandler = handler(D, 'Get pins', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (!canView(role)) return notFound(req, res, D, EVENT_MESSAGES.mapNotFound);
  const country = await countryMapOf(req.query?.country, map.splitUk);
  if (!country) return badRequest(req, res, D, EVENT_MESSAGES.countryMapNotFound);
  return sendDataResponse(res, 200, { pins: await pinList(map.id, country, role) });
});

/** A pin and the caller's role on its map: `{ pin, role }`. */
async function loadPin(req, pinId) {
  if (!isUuid(pinId)) return { pin: null, role: null };
  const userId = req.user?.id;
  const pin = await findPinAccess(pinId, userId);
  return { pin, role: pin ? mapRoleFor(pin.map, userId, pin.map.members?.[0]) : null };
}

/** One pin as `role` sees it, or null when it can't (no role, or hidden below editor). */
export async function pinDetail(pinId, role, { mapId } = {}) {
  const pin = await findPinDetail(pinId);
  if (!pin || (mapId && pin.mapId !== mapId) || !canView(role) || !canSeeMoment(role, pin)) return null;
  return pinView(pin, { role });
}

const PIN_ERRORS = { name: 'invalidPinName', notes: 'invalidPinNotes', position: 'invalidPinPosition', hidden: 'invalidPinHidden' };
const VISIT_ERRORS = { date: 'invalidPinVisitDate', notes: 'invalidPinNotes', photos: 'pinVisitPhotosInvalid' };

/** A visit from a body, its photos checked against the map. -> `{ value }` or `{ error }` */
async function parseVisitFor(mapId, body, options) {
  const parsed = parsePinVisit(body || {}, options);
  if (parsed.error) return { error: EVENT_MESSAGES[VISIT_ERRORS[parsed.error]] };
  const ids = parsed.value.photoIds;
  if (ids?.length && (await findMapPhotosByIds(mapId, ids)).length !== ids.length) return { error: EVENT_MESSAGES.pinVisitPhotosInvalid };
  return { value: parsed.value };
}

export const createPinHandler = handler(D, 'Create pin', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return undefined;
  const body = req.body || {};
  // Kept as the map keeps places for good: the UK for a nation, a region's country
  const country = await countryMapOf(body.countryCode, false);
  if (!country) return badRequest(req, res, D, EVENT_MESSAGES.countryMapNotFound);
  const parsed = parsePin(body);
  if (parsed.error) return badRequest(req, res, D, EVENT_MESSAGES[PIN_ERRORS[parsed.error]]);
  if (!spotFitsPlace(parsed.value, country)) return badRequest(req, res, D, EVENT_MESSAGES.pinWrongCountry);
  let visit = null;
  if (body.visit !== undefined && body.visit !== null) {
    const result = await parseVisitFor(map.id, body.visit);
    if (result.error) return badRequest(req, res, D, result.error);
    visit = result.value;
  }
  // A pin is an exact spot: a new one is seen by the map's editors only unless it's shared
  // (`hidden: false`), as a moment's spot (19 Nov 2026, the user's decision, the audit's D1)
  const created = await createPinInDB({
    hidden: true,
    ...parsed.value,
    mapId: map.id,
    countryCode: country,
    createdById: req.user.id,
    visit,
    cap: PINS_PER_MAP,
  });
  if (!created) return sendMessageResponse(res, 409, EVENT_MESSAGES.pinsFull);
  // Ids only: never the pin's name, notes or position
  logEvent(createCountryMapEvent({ user: req.user, action: 'Pin Create Success', id: created.id, detail: `map=${map.id}`, statusCode: 201 }));
  return sendDataResponse(res, 201, { pin: await pinDetail(created.id, role) });
});

export const getPinHandler = handler(D, 'Get pin', async (req, res) => {
  const { pin, role } = await loadPin(req, req.params.pinId);
  const view = pin ? await pinDetail(pin.id, role) : null;
  if (!view) return notFound(req, res, D, EVENT_MESSAGES.pinNotFound);
  return sendDataResponse(res, 200, { pin: view });
});

/** Loads a pin for a change: `{ pin, role }`, or answers 404/403 and returns null. */
async function pinForChange(req, res) {
  const { pin, role } = await loadPin(req, req.params.pinId);
  if (!pin || !canView(role) || !canSeeMoment(role, pin)) {
    notFound(req, res, D, EVENT_MESSAGES.pinNotFound);
    return null;
  }
  if (!canEdit(role)) {
    forbidden(req, res, D);
    return null;
  }
  return { pin, role };
}

export const updatePinHandler = handler(D, 'Update pin', async (req, res) => {
  const loaded = await pinForChange(req, res);
  if (!loaded) return undefined;
  const { pin, role } = loaded;
  const parsed = parsePin(req.body || {}, { partial: true });
  if (parsed.error) return badRequest(req, res, D, EVENT_MESSAGES[PIN_ERRORS[parsed.error]]);
  // Moved: still in its country (a pin never changes country)
  if (parsed.value.latitude !== undefined && !spotFitsPlace(parsed.value, pin.countryCode)) {
    return badRequest(req, res, D, EVENT_MESSAGES.pinWrongCountry);
  }
  const fields = Object.keys(parsed.value);
  if (fields.length) {
    await updatePinInDB(pin.id, parsed.value);
    logEvent(createCountryMapEvent({ user: req.user, action: 'Pin Update Success', id: pin.id, detail: fields.join(',') }));
  }
  return sendDataResponse(res, 200, { pin: await pinDetail(pin.id, role) });
});

export const deletePinHandler = handler(D, 'Delete pin', async (req, res) => {
  const loaded = await pinForChange(req, res);
  if (!loaded) return undefined;
  await deletePinInDB(loaded.pin.id);
  logEvent(createCountryMapEvent({ user: req.user, action: 'Pin Delete Success', id: loaded.pin.id, detail: `map=${loaded.pin.mapId}` }));
  return sendDataResponse(res, 200, { message: 'Pin deleted.' });
});

export const addPinVisitHandler = handler(D, 'Add pin visit', async (req, res) => {
  const loaded = await pinForChange(req, res);
  if (!loaded) return undefined;
  const { pin, role } = loaded;
  const parsed = await parseVisitFor(pin.mapId, req.body);
  if (parsed.error) return badRequest(req, res, D, parsed.error);
  const created = await createPinVisitInDB(pin.id, parsed.value, VISITS_PER_PIN);
  if (!created) return sendMessageResponse(res, 409, EVENT_MESSAGES.pinVisitsFull);
  logEvent(createCountryMapEvent({ user: req.user, action: 'Pin Visit Create Success', id: created.id, detail: `pin=${pin.id}`, statusCode: 201 }));
  return sendDataResponse(res, 201, { pin: await pinDetail(pin.id, role) });
});

/** The pin and one of its visits, for a change; or answers and returns null. */
async function visitForChange(req, res) {
  const loaded = await pinForChange(req, res);
  if (!loaded) return null;
  const visit = isUuid(req.params.visitId) ? await findPinVisit(req.params.visitId, loaded.pin.id) : null;
  if (!visit) {
    notFound(req, res, D, EVENT_MESSAGES.pinVisitNotFound);
    return null;
  }
  return { ...loaded, visit };
}

export const updatePinVisitHandler = handler(D, 'Update pin visit', async (req, res) => {
  const loaded = await visitForChange(req, res);
  if (!loaded) return undefined;
  const { pin, role, visit } = loaded;
  const parsed = await parseVisitFor(pin.mapId, req.body, { partial: true });
  if (parsed.error) return badRequest(req, res, D, parsed.error);
  const fields = [...Object.keys(parsed.value.data), ...(parsed.value.photoIds ? ['photoIds'] : [])];
  if (fields.length) {
    await updatePinVisitInDB(visit.id, parsed.value);
    logEvent(createCountryMapEvent({ user: req.user, action: 'Pin Visit Update Success', id: visit.id, detail: fields.join(',') }));
  }
  return sendDataResponse(res, 200, { pin: await pinDetail(pin.id, role) });
});

export const deletePinVisitHandler = handler(D, 'Delete pin visit', async (req, res) => {
  const loaded = await visitForChange(req, res);
  if (!loaded) return undefined;
  await deletePinVisitInDB(loaded.visit.id);
  logEvent(createCountryMapEvent({ user: req.user, action: 'Pin Visit Delete Success', id: loaded.visit.id, detail: `pin=${loaded.pin.id}` }));
  return sendDataResponse(res, 200, { pin: await pinDetail(loaded.pin.id, loaded.role) });
});

// Share links (controllers/shared.js): the map's states and pins, as a viewer sees them
export { countryMapOf };
