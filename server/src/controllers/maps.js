// Maps, their travellers and countries visited
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createMapEvent } from '../event/travelUtils.js';
import { sanitizeText } from '../utils/sanitize.js';
import { canEdit, canManage, canView } from '../utils/access.js';
import {
  GROUP_TYPES,
  MAX_TRAVELLERS,
  NAME_MAX,
  NOTES_MAX,
  VISIT_STATUSES,
  isOneOf,
  parseDateOnly,
} from '../utils/travelValidation.js';
import {
  countTravellers,
  createMapInDB,
  createTravellerInDB,
  deleteTravellerInDB,
  deleteVisitInDB,
  findMapDetail,
  findMemberMaps,
  findOwnedMaps,
  findTraveller,
  updateMapInDB,
  updateTravellerInDB,
  upsertVisitInDB,
} from '../domain/maps.js';
import { deleteMapWithFiles, ensureDefaultMap, newUniqueShareCode } from '../services/travel/maps.js';
import { badRequest, conflict, denyUnless, handler, loadMap, notFound } from './helpers/travel.js';
import { isKnownCountry, parseOptionalCountry } from './helpers/countries.js';
import { loadMapStats, loadStatsCounts, statsFrom, visitView } from './helpers/views.js';

const D = DOMAINS.maps;

// Input

const cleanName = (value) => sanitizeText(value, { maxLength: NAME_MAX });

/** A traveller from a request body. `partial` for PATCH (missing fields stay as they are). */
async function parseTraveller(body, { partial = false } = {}) {
  const out = {};
  if (!partial || body.name !== undefined) {
    const name = cleanName(body.name);
    if (!name) return { error: EVENT_MESSAGES.invalidName };
    out.name = name;
  }
  for (const field of ['birthCountryCode', 'favouriteCountryCode']) {
    const parsed = await parseOptionalCountry(body[field]);
    if (!parsed.ok) return { error: EVENT_MESSAGES.countryNotFound };
    if (parsed.value !== undefined) out[field] = parsed.value;
  }
  if (body.position !== undefined) {
    if (!Number.isInteger(body.position) || body.position < 0 || body.position > 1000) {
      return { error: EVENT_MESSAGES.malformedData };
    }
    out.position = body.position;
  }
  return { value: out };
}

// Views

const summaryView = (map, role) => ({
  id: map.id,
  name: map.name,
  groupType: map.groupType,
  isDefault: map.isDefault,
  role,
  ownerName: map.owner?.name ?? null,
  // { countries, photos, trips }, from findOwnedMaps/findMemberMaps (photos per the caller's role)
  counts: map.counts,
});

/**
 * The full map for someone with `role` on it. The detail and the stats' counts are
 * read side by side; the stats reuse the detail's visits and travellers.
 */
export async function mapDetailView(mapId, role) {
  const [detail, counts] = await Promise.all([findMapDetail(mapId), loadStatsCounts(mapId, role)]);
  if (!detail) return null;
  const stats = statsFrom(detail, counts);
  const editor = canEdit(role);
  return {
    id: detail.id,
    name: detail.name,
    groupType: detail.groupType,
    isDefault: detail.isDefault,
    role,
    ownerName: detail.owner?.name ?? null,
    travellers: detail.travellers.map((t) => ({
      id: t.id,
      name: t.name,
      position: t.position,
      birthCountryCode: t.birthCountryCode,
      favouriteCountryCode: t.favouriteCountryCode,
      ...(editor ? { userId: t.userId } : {}),
    })),
    visits: detail.visits.map(visitView),
    stats,
  };
}

// Maps

export const getMyMapsHandler = handler(D, 'Get my maps', async (req, res) => {
  const [ownedMaps, memberships] = await Promise.all([findOwnedMaps(req.user.id), findMemberMaps(req.user.id)]);
  // The sign-up hook makes the default map; it's made here only if that ever failed
  let owned = ownedMaps;
  if (!owned.some((map) => map.isDefault)) {
    await ensureDefaultMap(req.user);
    owned = await findOwnedMaps(req.user.id);
  }
  const maps = [
    ...owned.map((map) => summaryView(map, 'OWNER')),
    ...memberships.map((m) => summaryView(m.map, m.role)),
  ];
  return sendDataResponse(res, 200, { maps });
});

export const createMapHandler = handler(D, 'Create map', async (req, res) => {
  const body = req.body || {};
  const name = cleanName(body.name);
  if (!name) return badRequest(req, res, D, EVENT_MESSAGES.invalidName);
  if (!isOneOf(body.groupType, GROUP_TYPES)) return badRequest(req, res, D, EVENT_MESSAGES.invalidGroupType);

  const rawTravellers = Array.isArray(body.travellers) ? body.travellers : [];
  if (!rawTravellers.length) return badRequest(req, res, D, EVENT_MESSAGES.lastTraveller);
  if (rawTravellers.length > MAX_TRAVELLERS) return badRequest(req, res, D, EVENT_MESSAGES.tooManyTravellers);

  const travellers = [];
  for (const raw of rawTravellers) {
    const parsed = await parseTraveller(raw || {});
    if (parsed.error) return badRequest(req, res, D, parsed.error);
    travellers.push(parsed.value);
  }

  const created = await createMapInDB({
    ownerId: req.user.id,
    name,
    groupType: body.groupType,
    shareCode: await newUniqueShareCode(),
    travellers,
  });
  logEvent(createMapEvent({ user: req.user, action: 'Create Success', id: created.id, statusCode: 201 }));
  return sendDataResponse(res, 201, { map: await mapDetailView(created.id, 'OWNER') });
});

export const getMapHandler = handler(D, 'Get map', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (!canView(role)) return notFound(req, res, D, EVENT_MESSAGES.mapNotFound);
  return sendDataResponse(res, 200, { map: await mapDetailView(map.id, role) });
});

export const updateMapHandler = handler(D, 'Update map', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canManage, EVENT_MESSAGES.mapNotFound)) return undefined;

  const body = req.body || {};
  const data = {};
  if (body.name !== undefined) {
    const name = cleanName(body.name);
    if (!name) return badRequest(req, res, D, EVENT_MESSAGES.invalidName);
    data.name = name;
  }
  if (body.groupType !== undefined) {
    if (!isOneOf(body.groupType, GROUP_TYPES)) return badRequest(req, res, D, EVENT_MESSAGES.invalidGroupType);
    data.groupType = body.groupType;
  }
  if (Object.keys(data).length) {
    await updateMapInDB(map.id, data);
    logEvent(createMapEvent({ user: req.user, action: 'Update Success', id: map.id, detail: Object.keys(data).join(',') }));
  }
  return sendDataResponse(res, 200, { map: await mapDetailView(map.id, role) });
});

export const deleteMapHandler = handler(D, 'Delete map', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canManage, EVENT_MESSAGES.mapNotFound)) return undefined;
  if (map.isDefault) return conflict(req, res, D, EVENT_MESSAGES.defaultMapDelete);

  await deleteMapWithFiles(map.id);
  logEvent(createMapEvent({ user: req.user, action: 'Delete Success', id: map.id }));
  return sendDataResponse(res, 200, { message: 'Map deleted.' });
});

export const getMapStatsHandler = handler(D, 'Get map stats', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (!canView(role)) return notFound(req, res, D, EVENT_MESSAGES.mapNotFound);
  return sendDataResponse(res, 200, { stats: await loadMapStats(map.id, role) });
});

// Travellers

export const createTravellerHandler = handler(D, 'Create traveller', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return undefined;

  const parsed = await parseTraveller(req.body || {});
  if (parsed.error) return badRequest(req, res, D, parsed.error);
  const count = await countTravellers(map.id);
  if (count >= MAX_TRAVELLERS) return badRequest(req, res, D, EVENT_MESSAGES.tooManyTravellers);

  const traveller = await createTravellerInDB({ mapId: map.id, position: count, ...parsed.value });
  logEvent(createMapEvent({ user: req.user, action: 'Traveller Create Success', id: map.id, detail: `traveller=${traveller.id}`, statusCode: 201 }));
  return sendDataResponse(res, 201, { traveller });
});

export const updateTravellerHandler = handler(D, 'Update traveller', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return undefined;
  if (!(await findTraveller(map.id, req.params.travellerId))) {
    return notFound(req, res, D, EVENT_MESSAGES.travellerNotFound);
  }

  const parsed = await parseTraveller(req.body || {}, { partial: true });
  if (parsed.error) return badRequest(req, res, D, parsed.error);

  const traveller = await updateTravellerInDB(req.params.travellerId, parsed.value);
  logEvent(createMapEvent({ user: req.user, action: 'Traveller Update Success', id: map.id, detail: `traveller=${traveller.id}` }));
  return sendDataResponse(res, 200, { traveller });
});

export const deleteTravellerHandler = handler(D, 'Delete traveller', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return undefined;
  if (!(await findTraveller(map.id, req.params.travellerId))) {
    return notFound(req, res, D, EVENT_MESSAGES.travellerNotFound);
  }
  if ((await countTravellers(map.id)) <= 1) return conflict(req, res, D, EVENT_MESSAGES.lastTraveller);

  await deleteTravellerInDB(req.params.travellerId);
  logEvent(createMapEvent({ user: req.user, action: 'Traveller Delete Success', id: map.id, detail: `traveller=${req.params.travellerId}` }));
  return sendDataResponse(res, 200, { message: 'Traveller removed.' });
});

// Countries visited

export const putVisitHandler = handler(D, 'Save visit', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return undefined;

  const { countryCode } = req.params;
  if (!(await isKnownCountry(countryCode))) return notFound(req, res, D, EVENT_MESSAGES.countryNotFound);

  const body = req.body || {};
  if (!isOneOf(body.status, VISIT_STATUSES)) return badRequest(req, res, D, EVENT_MESSAGES.invalidVisitStatus);
  const firstVisitedOn = parseDateOnly(body.firstVisitedOn);
  if (!firstVisitedOn.ok) return badRequest(req, res, D, EVENT_MESSAGES.invalidDate);
  const notes = body.notes === undefined ? undefined : sanitizeText(body.notes, { maxLength: NOTES_MAX });

  const visit = await upsertVisitInDB({
    mapId: map.id,
    countryCode,
    status: body.status,
    firstVisitedOn: firstVisitedOn.value,
    notes,
  });
  logEvent(createMapEvent({ user: req.user, action: 'Visit Save Success', id: map.id, detail: `${countryCode}=${body.status}` }));
  return sendDataResponse(res, 200, { visit: visitView(visit) });
});

export const deleteVisitHandler = handler(D, 'Delete visit', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return undefined;

  const result = await deleteVisitInDB(map.id, req.params.countryCode);
  if (!result.count) return notFound(req, res, D, EVENT_MESSAGES.visitNotFound);
  logEvent(createMapEvent({ user: req.user, action: 'Visit Delete Success', id: map.id, detail: req.params.countryCode }));
  return sendDataResponse(res, 200, { message: 'Country removed from the map.' });
});
