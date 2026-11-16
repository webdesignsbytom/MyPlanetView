// Maps, their travellers and countries visited
import { isPole } from '../utils/specialPlaces.js';
import { isUkNation, placeOnMap } from '../utils/ukNations.js';
import { setMapSplitUk } from '../services/travel/ukNations.js';
import { adsFor } from '../services/offers.js';
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
  findMapMember,
  findMemberMaps,
  findOwnedMaps,
  findTraveller,
  makeDefaultMapInDB,
  updateMapInDB,
  updateTravellerInDB,
  upsertVisitInDB,
} from '../domain/maps.js';
import { findSubscription } from '../domain/billing.js';
import { countPhotosByCountry } from '../domain/photos.js';
import { countMomentsByCountry, findMomentSpots } from '../domain/moments.js';
import { findUserForTransfer } from '../domain/users.js';
import { deleteMapWithFiles, ensureDefaultMap, newUniqueShareCode, transferMap } from '../services/travel/maps.js';
import { loadMapPlan, loadUserPlan, uploadRulesFrom } from '../services/travel/plans.js';
import { extraMapsPaid } from '../utils/plans.js';
import { mapSlots } from '../utils/mapSlots.js';
import { extraMapPriceText, planView } from '../utils/constants/plans.js';
import { OtherErrorEvent } from '../event/errorUtils.js';
import { badRequest, conflict, denyUnless, handler, loadMap, notFound, reply } from './helpers/travel.js';
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
    // Antarctica can be a birth or favourite place; a pole can't
    if (isPole(parsed.value)) return { error: EVENT_MESSAGES.poleNotATravellerCountry };
    // A traveller's places are countries: a UK nation (a birth moment in Scotland) is the UK
    if (parsed.value !== undefined) out[field] = parsed.value ? placeOnMap(parsed.value, false) : parsed.value;
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

// `slots` (utils/mapSlots.js) is given for the maps the caller owns: only the owner sees
// whether a map is locked and its grace period
const summaryView = (map, role, slots = null) => ({
  id: map.id,
  name: map.name,
  groupType: map.groupType,
  isDefault: map.isDefault,
  role,
  ownerName: map.owner?.name ?? null,
  // { countries, photos, trips }, from findOwnedMaps/findMemberMaps (photos per the caller's role)
  counts: map.counts,
  ...(slots ? { locked: slots.lockedIds.includes(map.id), graceUntil: map.graceUntil ?? null } : {}),
});

/**
 * What the owner and editors see of a map's plan (never viewers or share links): the
 * owner's plan and its limits, whether the map is locked, its grace period, its photos
 * per country (hidden ones included: they count towards the cap), and `uploadRules`
 * (the shape GET /trips/:tripId also has).
 */
async function mapPlanView(mapId) {
  const [mapPlan, photoCounts, videoCounts] = await Promise.all([
    loadMapPlan(mapId),
    countPhotosByCountry(mapId),
    countPhotosByCountry(mapId, { kind: 'VIDEO' }),
  ]);
  if (!mapPlan) return {};
  return {
    plan: planView(mapPlan.plan),
    locked: mapPlan.locked,
    graceUntil: mapPlan.graceUntil,
    photoCounts,
    videoCounts,
    uploadRules: uploadRulesFrom(mapPlan),
  };
}

// The map routes' own answers carry the plan fields; GET /shared/:code reuses
// mapDetailView without them (a share link never shows them, whoever opens it)
const WITH_PLAN = { withPlan: true };

/**
 * The full map for someone with `role` on it. The detail and the stats' counts are
 * read side by side; the stats reuse the detail's visits and travellers. With
 * `withPlan`, the owner and editors also get the plan fields (mapPlanView).
 */
export async function mapDetailView(mapId, role, { withPlan = false } = {}) {
  const editor = canEdit(role);
  const [detail, counts, planFields, momentCountsByCountry, momentSpots] = await Promise.all([
    findMapDetail(mapId),
    loadStatsCounts(mapId, role),
    editor && withPlan ? mapPlanView(mapId) : {},
    // Which countries have moments, to mark them on the map (hidden ones for editors)
    countMomentsByCountry(mapId, { includeHidden: editor }),
    // The moments pinned to a spot: every pin for editors, the shared ones for anyone else
    findMomentSpots(mapId, { includeHidden: editor }),
  ]);
  if (!detail) return null;
  const stats = statsFrom(detail, counts);
  return {
    id: detail.id,
    name: detail.name,
    groupType: detail.groupType,
    isDefault: detail.isDefault,
    // The UK as its four nations (docs/API.md "The UK's nations")
    splitUk: detail.splitUk,
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
    momentCountsByCountry,
    momentSpots,
    // The landmarks stamped in the passport, to mark their pins (hidden photos' for editors)
    stampedLandmarkIds: counts.stampedLandmarkIds,
    ...planFields,
  };
}

// Maps

export const getMyMapsHandler = handler(D, 'Get my maps', async (req, res) => {
  const [ownedMaps, memberships, subscription] = await Promise.all([
    findOwnedMaps(req.user.id),
    findMemberMaps(req.user.id),
    findSubscription(req.user.id),
  ]);
  // The sign-up hook makes the default map; it's made here only if that ever failed
  // (or the default was handed to someone else)
  let owned = ownedMaps;
  if (!owned.some((map) => map.isDefault)) {
    await ensureDefaultMap(req.user);
    owned = await findOwnedMaps(req.user.id);
  }
  const slots = mapSlots({ maps: owned, extraMapsPaid: extraMapsPaid(subscription) });
  const maps = [
    ...owned.map((map) => summaryView(map, 'OWNER', slots)),
    ...memberships.map((m) => summaryView(m.map, m.role)),
  ];
  return sendDataResponse(res, 200, { maps });
});

// A new map needs a free map slot: the included one, or an extra map paid for (402)
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

  const owner = await loadUserPlan(req.user.id);
  if (!owner.slots.canCreate) {
    const message = `${EVENT_MESSAGES.mapSlotsUsed} ${extraMapPriceText(owner.plan)}`;
    return reply(res, new OtherErrorEvent(req.user, D, 402, message, 'payment-required'));
  }

  const created = await createMapInDB({
    ownerId: req.user.id,
    name,
    groupType: body.groupType,
    shareCode: await newUniqueShareCode(),
    travellers,
  });
  logEvent(createMapEvent({ user: req.user, action: 'Create Success', id: created.id, statusCode: 201 }));
  return sendDataResponse(res, 201, { map: await mapDetailView(created.id, 'OWNER', WITH_PLAN) });
});

export const getMapHandler = handler(D, 'Get map', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (!canView(role)) return notFound(req, res, D, EVENT_MESSAGES.mapNotFound);
  const [view, ads] = await Promise.all([mapDetailView(map.id, role, WITH_PLAN), adsFor({ mapId: map.id, viewerId: req.user.id })]);
  return sendDataResponse(res, 200, { map: { ...view, ads } });
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
  // The UK as its four nations: changing it moves the map's UK data (services/travel/ukNations.js)
  if (body.splitUk !== undefined && typeof body.splitUk !== 'boolean') {
    return badRequest(req, res, D, EVENT_MESSAGES.invalidSplitUk);
  }
  const splitChange = body.splitUk !== undefined && body.splitUk !== map.splitUk;
  if (Object.keys(data).length) {
    await updateMapInDB(map.id, data);
    logEvent(createMapEvent({ user: req.user, action: 'Update Success', id: map.id, detail: Object.keys(data).join(',') }));
  }
  if (splitChange) {
    await setMapSplitUk(map.id, body.splitUk);
    logEvent(createMapEvent({ user: req.user, action: 'Update Success', id: map.id, detail: `splitUk=${body.splitUk}` }));
  }
  return sendDataResponse(res, 200, { map: await mapDetailView(map.id, role, WITH_PLAN) });
});

export const deleteMapHandler = handler(D, 'Delete map', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canManage, EVENT_MESSAGES.mapNotFound)) return undefined;
  if (map.isDefault) return conflict(req, res, D, EVENT_MESSAGES.defaultMapDelete);

  await deleteMapWithFiles(map.id);
  logEvent(createMapEvent({ user: req.user, action: 'Delete Success', id: map.id }));
  return sendDataResponse(res, 200, { message: 'Map deleted.' });
});

// The owner picks which map is their main (included) one: the old default becomes an
// ordinary map, which needs a paid slot to stay active
export const makeMainMapHandler = handler(D, 'Make main map', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canManage, EVENT_MESSAGES.mapNotFound)) return undefined;
  if (!map.isDefault) {
    await makeDefaultMapInDB(map.id, req.user.id);
    logEvent(createMapEvent({ user: req.user, action: 'Main Map Success', id: map.id }));
  }
  return sendDataResponse(res, 200, { map: await mapDetailView(map.id, role, WITH_PLAN) });
});

/**
 * Make someone already on the map its owner (`{ userId, stayAsEditor = true }`). They
 * need an active account with a verified address. The map takes the new owner's plan,
 * with grace when they have no free map slot (services/travel/maps.js, transferMap).
 */
export const transferMapHandler = handler(D, 'Transfer map', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canManage, EVENT_MESSAGES.mapNotFound)) return undefined;

  const body = req.body || {};
  const { userId } = body;
  const stayAsEditor = body.stayAsEditor ?? true;
  if (typeof userId !== 'string' || !userId || userId.length > 255) return badRequest(req, res, D, EVENT_MESSAGES.invalidUserId);
  if (typeof stayAsEditor !== 'boolean') return badRequest(req, res, D, EVENT_MESSAGES.malformedData);
  if (userId === req.user.id) return badRequest(req, res, D, EVENT_MESSAGES.transferToSelf);

  const [member, target] = await Promise.all([findMapMember(map.id, userId), findUserForTransfer({ id: userId })]);
  if (!member || !target) return badRequest(req, res, D, EVENT_MESSAGES.transferTargetNotMember);
  if (target.isActive === false || target.emailVerified !== true) {
    return badRequest(req, res, D, EVENT_MESSAGES.transferTargetNotReady);
  }

  const result = await transferMap({ mapId: map.id, toUserId: userId, keepOldOwnerAsEditor: stayAsEditor });
  if (!result) return notFound(req, res, D, EVENT_MESSAGES.mapNotFound);
  // The included map goes with it: the old owner gets a new default, as at sign-up
  if (result.wasDefault) await ensureDefaultMap(req.user);
  logEvent(createMapEvent({
    user: req.user,
    action: 'Transfer Success',
    id: map.id,
    targetId: userId,
    detail: `stayAsEditor=${stayAsEditor} grace=${Boolean(result.graceUntil)}`,
  }));
  const view = stayAsEditor ? await mapDetailView(map.id, 'EDITOR', WITH_PLAN) : { id: map.id, name: map.name, role: null };
  return sendDataResponse(res, 200, { map: view });
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
  // A UK nation is a place only on a map that splits the UK (utils/ukNations.js)
  if (isUkNation(countryCode) && !map.splitUk) return notFound(req, res, D, EVENT_MESSAGES.countryNotFound);

  const body = req.body || {};
  if (!isOneOf(body.status, VISIT_STATUSES)) return badRequest(req, res, D, EVENT_MESSAGES.invalidVisitStatus);
  const firstVisitedOn = parseDateOnly(body.firstVisitedOn);
  if (!firstVisitedOn.ok) return badRequest(req, res, D, EVENT_MESSAGES.invalidDate);
  // The country's one note ("I want to visit here"): text, cleaned and cut to NOTES_MAX;
  // missing keeps it, null or empty clears it
  if (body.notes !== undefined && body.notes !== null && typeof body.notes !== 'string') {
    return badRequest(req, res, D, EVENT_MESSAGES.notesInvalid);
  }
  const notes = body.notes === undefined ? undefined : sanitizeText(body.notes, { maxLength: NOTES_MAX });

  const { visit, implied } = await upsertVisitInDB({
    mapId: map.id,
    countryCode,
    status: body.status,
    firstVisitedOn: firstVisitedOn.value,
    notes,
  });
  logEvent(createMapEvent({ user: req.user, action: 'Visit Save Success', id: map.id, detail: `${countryCode}=${body.status}` }));
  return sendDataResponse(res, 200, { visit: visitView(visit), implied: implied.map(visitView) });
});

export const deleteVisitHandler = handler(D, 'Delete visit', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return undefined;

  const result = await deleteVisitInDB(map.id, req.params.countryCode);
  if (!result.count) return notFound(req, res, D, EVENT_MESSAGES.visitNotFound);
  logEvent(createMapEvent({ user: req.user, action: 'Visit Delete Success', id: map.id, detail: req.params.countryCode }));
  return sendDataResponse(res, 200, { message: 'Country removed from the map.' });
});
