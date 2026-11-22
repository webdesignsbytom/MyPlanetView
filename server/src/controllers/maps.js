// Maps, their travellers and countries visited
import { isPole } from '../utils/specialPlaces.js';
import { isUkNation, placeOnMap } from '../utils/ukNations.js';
import { setMapSplitUk } from '../services/travel/ukNations.js';
import { adsFor } from '../services/offers.js';
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createMapEvent } from '../event/travelUtils.js';
import { sanitizeText } from '../utils/sanitize.js';
import { MAP_STYLES, mapStyleOf } from '../utils/mapSettings.js';
import { canEdit, canManage, canView, isOwner } from '../utils/access.js';
import {
  GROUP_TYPES,
  MAX_TRAVELLERS,
  maxTravellersFor,
  NAME_MAX,
  NOTES_MAX,
  VISIT_STATUSES,
  isOneOf,
  parseDateOnly,
} from '../utils/travelValidation.js';
import {
  countTravellers,
  createMapInDB,
  createMissingVisits,
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
  setMapUpgradedInDB,
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
import { mapDesignView } from './mapDesigns.js';
import { findTickedLandmarkIds } from '../domain/landmarkVisits.js';

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
  // `tier`: on the owner's plan, on Economy (a free map), or locked (19 Nov 2026)
  ...(slots ? { locked: slots.lockedIds.includes(map.id), tier: slots.tiers[map.id], graceUntil: map.graceUntil ?? null } : {}),
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
    // The map's own plan (Economy for a free extra map), the owner's, and which it is
    plan: planView(mapPlan.plan),
    accountPlan: planView(mapPlan.accountPlan),
    tier: mapPlan.tier,
    upgraded: Boolean(mapPlan.upgradedAt),
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
  const [detail, counts, planFields, momentCountsByCountry, momentSpots, design, tickedLandmarkIds] = await Promise.all([
    findMapDetail(mapId),
    loadStatsCounts(mapId, role),
    editor && withPlan ? mapPlanView(mapId) : {},
    // Which countries have moments, to mark them on the map (hidden ones for editors)
    countMomentsByCountry(mapId, { includeHidden: editor }),
    // The moments pinned to a spot: every pin for editors, the shared ones for anyone else
    findMomentSpots(mapId, { includeHidden: editor }),
    // Its own design, for everyone who opens it (docs/API.md "Map designs")
    mapDesignView(mapId),
    // The landmarks ticked "been here" (docs/API.md "Collecting")
    findTickedLandmarkIds(mapId),
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
    // Its home as set (null: from a traveller's birth country; the stats carry the one in use)
    homeCountryCode: detail.homeCountryCode ?? null,
    // The style everyone sees it in: its own, else the owner's (null: each viewer's own)
    style: mapStyleOf(detail.style, detail.ownerSettings),
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
    tickedLandmarkIds,
    design,
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

// A new map needs room: one of the 3 free maps, or an extra map paid for (402)
export const createMapHandler = handler(D, 'Create map', async (req, res) => {
  const body = req.body || {};
  const name = cleanName(body.name);
  if (!name) return badRequest(req, res, D, EVENT_MESSAGES.invalidName);
  if (!isOneOf(body.groupType, GROUP_TYPES)) return badRequest(req, res, D, EVENT_MESSAGES.invalidGroupType);

  const rawTravellers = Array.isArray(body.travellers) ? body.travellers : [];
  if (!rawTravellers.length) return badRequest(req, res, D, EVENT_MESSAGES.lastTraveller);
  if (rawTravellers.length > MAX_TRAVELLERS) return badRequest(req, res, D, EVENT_MESSAGES.tooManyTravellers);
  if (rawTravellers.length > maxTravellersFor(body.groupType)) return badRequest(req, res, D, tooManyForGroup(body.groupType));

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
  await markBirthplaces(created, travellers.map((t) => t.birthCountryCode));
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
    if (body.groupType !== map.groupType && (await countTravellers(map.id)) > maxTravellersFor(body.groupType)) {
      return conflict(req, res, D, tooManyForGroup(body.groupType));
    }
    data.groupType = body.groupType;
  }
  // Where the map's people live, for the stats' distances (docs/API.md "Stats"): a country or
  // Antarctica, as a traveller's places are (a UK nation is the UK, a region its country)
  if (body.homeCountryCode !== undefined) {
    const parsed = await parseOptionalCountry(body.homeCountryCode);
    if (!parsed.ok) return badRequest(req, res, D, EVENT_MESSAGES.countryNotFound);
    if (isPole(parsed.value)) return badRequest(req, res, D, EVENT_MESSAGES.poleNotATravellerCountry);
    data.homeCountryCode = parsed.value ? placeOnMap(parsed.value, false) : null;
  }
  // The style everyone who opens the map sees it in, share links too (docs/API.md "Map styles")
  if (body.style !== undefined) {
    if (!MAP_STYLES.includes(body.style)) return badRequest(req, res, D, EVENT_MESSAGES.invalidMapStyle);
    data.style = body.style;
  }
  // The UK as its four nations: changing it moves the map's UK data (services/travel/ukNations.js)
  if (body.splitUk !== undefined && typeof body.splitUk !== 'boolean') {
    return badRequest(req, res, D, EVENT_MESSAGES.invalidSplitUk);
  }
  const splitChange = body.splitUk !== undefined && body.splitUk !== map.splitUk;
  if (Object.keys(data).length) {
    // The new kind is checked again with the map locked (a traveller added meanwhile)
    if ((await updateMapInDB(map.id, data)).tooMany) return conflict(req, res, D, tooManyForGroup(data.groupType));
    logEvent(createMapEvent({ user: req.user, action: 'Update Success', id: map.id, detail: Object.keys(data).join(',') }));
  }
  if (splitChange) {
    await setMapSplitUk(map.id, body.splitUk);
    logEvent(createMapEvent({ user: req.user, action: 'Update Success', id: map.id, detail: `splitUk=${body.splitUk}` }));
  }
  return sendDataResponse(res, 200, { map: await mapDetailView(map.id, role, WITH_PLAN) });
});

// Deleting, choosing the main map and handing a map over are the owner's alone, never a
// co-owner's (they're about the owner's account and what it pays for)
export const deleteMapHandler = handler(D, 'Delete map', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, isOwner, EVENT_MESSAGES.mapNotFound)) return undefined;
  if (map.isDefault) return conflict(req, res, D, EVENT_MESSAGES.defaultMapDelete);

  await deleteMapWithFiles(map.id);
  logEvent(createMapEvent({ user: req.user, action: 'Delete Success', id: map.id }));
  return sendDataResponse(res, 200, { message: 'Map deleted.' });
});

// The owner picks which map is their main (included) one: the old default becomes an
// ordinary map, which needs a paid slot to stay active
export const makeMainMapHandler = handler(D, 'Make main map', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, isOwner, EVENT_MESSAGES.mapNotFound)) return undefined;
  if (!map.isDefault) {
    await makeDefaultMapInDB(map.id, req.user.id);
    logEvent(createMapEvent({ user: req.user, action: 'Main Map Success', id: map.id }));
  }
  return sendDataResponse(res, 200, { map: await mapDetailView(map.id, role, WITH_PLAN) });
});

/**
 * The owner chooses to put a map on their plan (19 Nov 2026, docs/API.md "Map limits"): the
 * maps chosen take the paid extra-map slots first, in the order chosen, before the rest
 * oldest first (utils/mapSlots.js). With a slot to spare (one an unchosen map was using) the
 * map moves onto the plan at once; with none it waits for another extra map paid for: the
 * reply's `tier` says which, and the app then offers to buy one. The main map is always on
 * the plan. Choosing again keeps the first choice's place.
 */
export const upgradeMapHandler = handler(D, 'Upgrade map', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, isOwner, EVENT_MESSAGES.mapNotFound)) return undefined;
  const mapPlan = await loadMapPlan(map.id);
  if (!map.isDefault && !mapPlan?.upgradedAt) {
    await setMapUpgradedInDB(map.id, new Date());
    logEvent(createMapEvent({ user: req.user, action: 'Upgrade Success', id: map.id }));
  }
  return sendDataResponse(res, 200, { map: await mapDetailView(map.id, role, WITH_PLAN) });
});

/** Taking that choice back: the map queues with the rest again (it may stay on the plan if a slot is spare). */
export const downgradeMapHandler = handler(D, 'Downgrade map', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, isOwner, EVENT_MESSAGES.mapNotFound)) return undefined;
  await setMapUpgradedInDB(map.id, null);
  logEvent(createMapEvent({ user: req.user, action: 'Downgrade Success', id: map.id }));
  return sendDataResponse(res, 200, { map: await mapDetailView(map.id, role, WITH_PLAN) });
});

/**
 * Make someone already on the map its owner (`{ userId, stayAsEditor = true }`). They
 * need an active account with a verified address. The map takes the new owner's plan,
 * with grace when they have no free map slot (services/travel/maps.js, transferMap).
 */
export const transferMapHandler = handler(D, 'Transfer map', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, isOwner, EVENT_MESSAGES.mapNotFound)) return undefined;

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
  // Staying on: an editor, or a co-owner when it went to a co-owner (transferMapInDB)
  const stayedAs = stayAsEditor ? (await findMapMember(map.id, req.user.id))?.role ?? 'EDITOR' : null;
  const view = stayedAs ? await mapDetailView(map.id, stayedAs, WITH_PLAN) : { id: map.id, name: map.name, role: null };
  return sendDataResponse(res, 200, { map: view });
});

export const getMapStatsHandler = handler(D, 'Get map stats', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (!canView(role)) return notFound(req, res, D, EVENT_MESSAGES.mapNotFound);
  return sendDataResponse(res, 200, { stats: await loadMapStats(map.id, role) });
});

// Travellers

// Born there is been there (17 Nov 2026, the user's wish: a new map starts with at least the
// country chosen as a birthplace at sign-up): a traveller's new or changed birth country is
// marked VISITED on the map, as a photo or a trip marks one (createMissingVisits: a visit
// already there stays as it is, "want to go" becomes visited). In the map's own places (a UK
// birthplace stays the UK's mark on a split map). Never taken back when the birthplace changes.
const markBirthplaces = (map, codes) =>
  createMissingVisits(map.id, [...new Set(codes.filter(Boolean).map((code) => placeOnMap(code, Boolean(map.splitUk))))], 'MANUAL');

// A map's kind decides how many travellers it has (maxTravellersFor): a couple's is two
const groupFull = (groupType) => (groupType === 'SOLO' ? EVENT_MESSAGES.soloMapFull : EVENT_MESSAGES.coupleMapFull);
const tooManyForGroup = (groupType) =>
  groupType === 'SOLO' ? EVENT_MESSAGES.soloTooManyTravellers : EVENT_MESSAGES.coupleTooManyTravellers;

export const createTravellerHandler = handler(D, 'Create traveller', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return undefined;

  const parsed = await parseTraveller(req.body || {});
  if (parsed.error) return badRequest(req, res, D, parsed.error);
  const { traveller, full } = await createTravellerInDB(map.id, parsed.value);
  if (full === 'total') return badRequest(req, res, D, EVENT_MESSAGES.tooManyTravellers);
  if (full) return conflict(req, res, D, groupFull(full));

  await markBirthplaces(map, [traveller.birthCountryCode]);
  logEvent(createMapEvent({ user: req.user, action: 'Traveller Create Success', id: map.id, detail: `traveller=${traveller.id}`, statusCode: 201 }));
  return sendDataResponse(res, 201, { traveller });
});

export const updateTravellerHandler = handler(D, 'Update traveller', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return undefined;
  const before = await findTraveller(map.id, req.params.travellerId);
  if (!before) return notFound(req, res, D, EVENT_MESSAGES.travellerNotFound);

  const parsed = await parseTraveller(req.body || {}, { partial: true });
  if (parsed.error) return badRequest(req, res, D, parsed.error);

  const traveller = await updateTravellerInDB(req.params.travellerId, parsed.value);
  if (traveller.birthCountryCode !== before.birthCountryCode) await markBirthplaces(map, [traveller.birthCountryCode]);
  logEvent(createMapEvent({ user: req.user, action: 'Traveller Update Success', id: map.id, detail: `traveller=${traveller.id}` }));
  return sendDataResponse(res, 200, { traveller });
});

export const deleteTravellerHandler = handler(D, 'Delete traveller', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return undefined;
  if (!(await findTraveller(map.id, req.params.travellerId))) {
    return notFound(req, res, D, EVENT_MESSAGES.travellerNotFound);
  }
  const removed = await deleteTravellerInDB(map.id, req.params.travellerId);
  if (removed.last) return conflict(req, res, D, EVENT_MESSAGES.lastTraveller);
  if (removed.coOwner) return conflict(req, res, D, EVENT_MESSAGES.travellerIsCoOwner);
  if (removed.coOwnerRoom) return conflict(req, res, D, EVENT_MESSAGES.coOwnersNeedTravellers);
  if (!removed.deleted) return notFound(req, res, D, EVENT_MESSAGES.travellerNotFound);
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
