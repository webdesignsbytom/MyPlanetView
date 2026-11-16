// The passport, badges and goals (docs/API.md, "Passport", "Badges and goals"). Reads are
// for anyone who can view the map; the owner and editors also award badges and goals as
// they load. Choosing a stamp's photo and changing goals needs editor on the map.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createMapEvent } from '../event/travelUtils.js';
import { canEdit, canView } from '../utils/access.js';
import { isUuid } from '../utils/travelValidation.js';
import { GOALS_PER_MAP, changesWhatsAsked, parseGoalInput } from '../utils/goals.js';
import { buildPassport } from '../services/travel/passport.js';
import { mapBadges, mapGoals, oneGoalView } from '../services/travel/achievements.js';
import { deleteLandmarkCover, findConfirmedMatch, upsertLandmarkCover } from '../domain/passport.js';
import { countGoals, createGoalInDB, deleteGoalInDB, findGoal, updateGoalInDB } from '../domain/achievements.js';
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

export const getPassportHandler = handler(D, 'Get passport', async (req, res) => {
  const loaded = await viewableMap(req, res);
  if (!loaded) return undefined;
  const passport = await buildPassport(loaded.map.id, loaded.role);
  if (!passport) return notFound(req, res, D, EVENT_MESSAGES.mapNotFound);
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
  if ((await countGoals(loaded.map.id)) >= GOALS_PER_MAP) return conflict(req, res, D, EVENT_MESSAGES.goalsFull);
  const goal = await createGoalInDB({ ...parsed.data, mapId: loaded.map.id, createdById: req.user.id });
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
