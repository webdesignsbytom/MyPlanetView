// The passport, badges and goals (docs/API.md, "Passport", "Badges and goals"). Reads are
// for anyone who can view the map; the owner and editors also award badges and goals as
// they load. Choosing a stamp's photo and changing goals needs editor on the map.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createMapEvent } from '../event/travelUtils.js';
import { canEdit, canView } from '../utils/access.js';
import { isUuid } from '../utils/travelValidation.js';
import { GOALS_PER_MAP, changesWhatsAsked, parseGoalInput } from '../utils/goals.js';
import { buildPassport, passportTravellerView, travellingSinceByTraveller } from '../services/travel/passport.js';
import { mapBadges, mapGoals, oneGoalView } from '../services/travel/achievements.js';
import {
  deleteLandmarkCover,
  findConfirmedMatch,
  findPassportTraveller,
  findPortraitCandidate,
  updateTravellerPassportInDB,
  upsertLandmarkCover,
} from '../domain/passport.js';
import { parsePortrait, parseSignature } from '../utils/travellerPassport.js';
import { createGoalInDB, deleteGoalInDB, findGoal, updateGoalInDB } from '../domain/achievements.js';
import { continentsByCode } from './helpers/countries.js';
import { badRequest, conflict, forbidden, handler, loadMap, notFound } from './helpers/travel.js';

const D = DOMAINS.maps;

/** `{ map, role }` for a map the caller can open, else a 404 is sent and null returned. */
async function viewableMap(req, res) {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (!canView(role)) {
    notFound(req, res, D, EVENT_MESSAGES.mapNotFound);
    return null;
  }
  return { map, role };
}

/** The same for an editor: 404 without a role, 403 below editor. */
async function editableMap(req, res) {
  const loaded = await viewableMap(req, res);
  if (!loaded) return null;
  if (!canEdit(loaded.role)) {
    forbidden(req, res, D);
    return null;
  }
  return loaded;
}

// Passport

/** `?traveller=<id>` for one traveller's own passport; anything that can't be an id finds no one. */
export const travellerOption = (req) => {
  const id = req.query?.traveller;
  if (id === undefined || id === '') return {};
  return { travellerId: typeof id === 'string' && isUuid(id) ? id : '00000000-0000-4000-8000-000000000000' };
};

export const getPassportHandler = handler(D, 'Get passport', async (req, res) => {
  const loaded = await viewableMap(req, res);
  if (!loaded) return undefined;
  // ?traveller=<id>: that traveller's own passport (docs/API.md "Passport")
  const passport = await buildPassport(loaded.map.id, loaded.role, travellerOption(req));
  if (!passport) return notFound(req, res, D, EVENT_MESSAGES.mapNotFound);
  if (passport.travellerNotFound) return notFound(req, res, D, EVENT_MESSAGES.travellerNotFound);
  return sendDataResponse(res, 200, { passport });
});

// `{ photoId }`: the photo a stamp shows (one of the landmark's confirmed photos on this map)
export const setStampPhotoHandler = handler(D, 'Set stamp photo', async (req, res) => {
  const loaded = await editableMap(req, res);
  if (!loaded) return undefined;
  const { landmarkId } = req.params;
  const { photoId } = req.body || {};
  if (!isUuid(landmarkId) || !isUuid(photoId) || !(await findConfirmedMatch(loaded.map.id, photoId, landmarkId))) {
    return badRequest(req, res, D, EVENT_MESSAGES.stampPhotoInvalid);
  }
  const cover = await upsertLandmarkCover(loaded.map.id, landmarkId, photoId);
  logEvent(createMapEvent({ user: req.user, action: 'Stamp Photo Success', id: loaded.map.id, detail: `landmark=${landmarkId}` }));
  return sendDataResponse(res, 200, { cover });
});

// Back to the landmark's earliest photo
export const clearStampPhotoHandler = handler(D, 'Clear stamp photo', async (req, res) => {
  const loaded = await editableMap(req, res);
  if (!loaded) return undefined;
  const { landmarkId } = req.params;
  if (!isUuid(landmarkId)) return notFound(req, res, D, EVENT_MESSAGES.landmarkNotFound);
  await deleteLandmarkCover(loaded.map.id, landmarkId);
  logEvent(createMapEvent({ user: req.user, action: 'Stamp Photo Clear Success', id: loaded.map.id, detail: `landmark=${landmarkId}` }));
  return sendDataResponse(res, 200, { message: 'The stamp shows its first photo again.' });
});

// Badges

// A traveller's passport page (25 Nov 2026, the user's wish; docs/API.md "Passport"): their
// photo, one of the map's own photos (not a video, not hidden) with its crop, and their drawn
// signature; null takes either off. The map's editors, verified (it's content).
// PATCH /maps/:mapId/travellers/:travellerId/passport { photo?, signature? } -> { traveller }
export const updateTravellerPassportHandler = handler(D, 'Update traveller passport', async (req, res) => {
  const loaded = await editableMap(req, res);
  if (!loaded) return undefined;
  const { map } = loaded;
  const { travellerId } = req.params;
  if (!isUuid(travellerId) || !(await findPassportTraveller(map.id, travellerId))) {
    return notFound(req, res, D, EVENT_MESSAGES.travellerNotFound);
  }
  const body = req.body || {};
  const data = {};
  if (body.photo !== undefined) {
    const portrait = parsePortrait(body.photo);
    if (portrait.error) return badRequest(req, res, D, EVENT_MESSAGES.passportPhotoInvalid);
    if (portrait.value) {
      const photo = await findPortraitCandidate(map.id, portrait.value.photoId);
      if (!photo || photo.kind !== 'PHOTO' || photo.hidden) return badRequest(req, res, D, EVENT_MESSAGES.passportPhotoInvalid);
      const { photoId, focusX, focusY, zoom } = portrait.value;
      Object.assign(data, { portraitPhotoId: photoId, portraitFocusX: focusX, portraitFocusY: focusY, portraitZoom: zoom });
    } else {
      Object.assign(data, { portraitPhotoId: null, portraitFocusX: null, portraitFocusY: null, portraitZoom: null });
    }
  }
  if (body.signature !== undefined) {
    const signature = parseSignature(body.signature);
    if (signature.error) return badRequest(req, res, D, EVENT_MESSAGES.signatureInvalid);
    data.signature = signature.value;
  }
  if (!Object.keys(data).length) return badRequest(req, res, D, EVENT_MESSAGES.malformedData);

  await updateTravellerPassportInDB(travellerId, data);
  const [row, since] = await Promise.all([findPassportTraveller(map.id, travellerId), travellingSinceByTraveller(map.id)]);
  logEvent(createMapEvent({ user: req.user, action: 'Traveller Passport Update Success', id: map.id, detail: `traveller=${travellerId}` }));
  return sendDataResponse(res, 200, { traveller: await passportTravellerView(row, { editor: true, since: since.get(travellerId) ?? null }) });
});

export const getBadgesHandler = handler(D, 'Get badges', async (req, res) => {
  const loaded = await viewableMap(req, res);
  if (!loaded) return undefined;
  return sendDataResponse(res, 200, await mapBadges(loaded.map.id, { award: canEdit(loaded.role) }));
});

// Goals

export const getGoalsHandler = handler(D, 'Get goals', async (req, res) => {
  const loaded = await viewableMap(req, res);
  if (!loaded) return undefined;
  return sendDataResponse(res, 200, await mapGoals(loaded.map.id, { award: canEdit(loaded.role) }));
});

const knownCodes = async () => {
  const codes = await continentsByCode();
  return (code) => codes.has(code);
};

export const createGoalHandler = handler(D, 'Create goal', async (req, res) => {
  const loaded = await editableMap(req, res);
  if (!loaded) return undefined;
  const parsed = parseGoalInput(req.body, { isKnownCode: await knownCodes() });
  if (!parsed.ok) return badRequest(req, res, D, EVENT_MESSAGES.goalInvalid);
  const goal = await createGoalInDB({ ...parsed.data, mapId: loaded.map.id, createdById: req.user.id, cap: GOALS_PER_MAP });
  if (!goal) return conflict(req, res, D, EVENT_MESSAGES.goalsFull);
  // Ids and the kind only: a goal's title is the person's own words
  logEvent(createMapEvent({ user: req.user, action: 'Goal Create Success', id: goal.id, detail: `map=${loaded.map.id} kind=${goal.kind}`, statusCode: 201 }));
  return sendDataResponse(res, 201, { goal: await oneGoalView(goal, { award: true }) });
});

/** `{ goal, role }` for a goal on a map the caller can edit; otherwise the reply is sent. */
async function editableGoal(req, res) {
  const goal = isUuid(req.params.goalId) ? await findGoal(req.params.goalId) : null;
  const { role } = goal ? await loadMap(req, goal.mapId) : { role: null };
  if (!goal || !canView(role)) {
    notFound(req, res, D, EVENT_MESSAGES.goalNotFound);
    return null;
  }
  if (!canEdit(role)) {
    forbidden(req, res, D);
    return null;
  }
  return { goal, role };
}

// A change to what's asked (target, countries, region, deadline) clears `achievedAt`: the
// goal has to be met again
export const updateGoalHandler = handler(D, 'Update goal', async (req, res) => {
  const loaded = await editableGoal(req, res);
  if (!loaded) return undefined;
  const parsed = parseGoalInput(req.body, { existing: loaded.goal, isKnownCode: await knownCodes() });
  if (!parsed.ok) return badRequest(req, res, D, EVENT_MESSAGES.goalInvalid);
  const data = { ...parsed.data, ...(changesWhatsAsked(parsed.data) ? { achievedAt: null } : {}) };
  const goal = Object.keys(data).length ? await updateGoalInDB(loaded.goal.id, data) : loaded.goal;
  if (Object.keys(data).length) {
    logEvent(createMapEvent({ user: req.user, action: 'Goal Update Success', id: goal.id, detail: Object.keys(parsed.data).join(',') }));
  }
  return sendDataResponse(res, 200, { goal: await oneGoalView(goal, { award: true }) });
});

export const deleteGoalHandler = handler(D, 'Delete goal', async (req, res) => {
  const loaded = await editableGoal(req, res);
  if (!loaded) return undefined;
  await deleteGoalInDB(loaded.goal.id);
  logEvent(createMapEvent({ user: req.user, action: 'Goal Delete Success', id: loaded.goal.id }));
  return sendDataResponse(res, 200, { message: 'Goal deleted.' });
});
