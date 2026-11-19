// Friends challenges (docs/API.md, "Friends challenges"): starting one, the challenges
// someone's in, a challenge's leaderboard, joining by its link, picking the map that counts,
// leaving, and the starter's changes. Rules in utils/challenges.js.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse, sendMessageResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createChallengeEvent } from '../event/travelUtils.js';
import { isUuid } from '../utils/travelValidation.js';
import { formatShareCode, normaliseShareCode } from '../utils/shareCodes.js';
import {
  CHALLENGE_LIMITS,
  challengeStatus,
  challengeWindow,
  dayKey,
  parseChallengeInput,
  parseChallengeMapId,
  rankMembers,
  standing,
} from '../utils/challenges.js';
import {
  canCountMap,
  countMembers,
  countedDates,
  createChallengeInDB,
  deleteChallengeEntry,
  deleteChallengeInDB,
  findChallengeById,
  findChallengeByJoinCode,
  findChallengeEntry,
  findChallengeMembers,
  findMapName,
  findUserChallenges,
  joinChallengeInDB,
  mapsStillTheirs,
  resetJoinCodeInDB,
  setEntryMap,
  updateChallengeInDB,
} from '../domain/challenges.js';
import { badRequest, conflict, forbidden, handler, notFound } from './helpers/travel.js';

const D = DOMAINS.challenges;

/** A challenge's own fields as the API sends them (never who started it by id). */
const challengeFields = (challenge, now = new Date()) => ({
  id: challenge.id,
  title: challenge.title,
  measure: challenge.measure,
  startsOn: dayKey(challenge.startsOn),
  endsOn: dayKey(challenge.endsOn),
  target: challenge.target ?? null,
  status: challengeStatus(challenge, now),
});

/**
 * The leaderboard: everyone in the challenge with their count (from the map that counts
 * for them, if they still own or edit it), ranked. Names and counts only: never a map,
 * a photo or a place. `isYou` marks the caller.
 */
async function leaderboard(challenge, userId) {
  const members = await findChallengeMembers(challenge.id);
  const theirs = await mapsStillTheirs(members);
  const window = challengeWindow(challenge);
  const rows = await Promise.all(
    members.map(async (member) => {
      const counting = Boolean(member.mapId) && theirs.has(`${member.userId}:${member.mapId}`);
      const { count, reachedAt } = counting ? standing(await countedDates(challenge.measure, member.mapId, window), challenge.target) : { count: 0, reachedAt: null };
      return { userId: member.userId, name: member.name, count, reachedAt, counting };
    }),
  );
  return rankMembers(rows).map((row) => ({
    name: row.name,
    count: row.count,
    rank: row.rank,
    reachedTarget: Boolean(row.reachedAt),
    counting: row.counting,
    isYou: row.userId === userId,
    startedIt: row.userId === challenge.createdById,
  }));
}

/** One challenge, for someone in it: its fields, the link, the leaderboard and their map. */
async function challengeDetail(challenge, userId, entry) {
  const [board, myMapName] = await Promise.all([leaderboard(challenge, userId), entry.mapId ? findMapName(entry.mapId) : null]);
  return {
    ...challengeFields(challenge),
    joinCode: formatShareCode(challenge.joinCode),
    youStartedIt: challenge.createdById === userId,
    myMap: entry.mapId ? { id: entry.mapId, name: myMapName } : null,
    members: board,
    memberLimit: CHALLENGE_LIMITS.members,
  };
}

/** The challenge and the caller's place in it, or null (a 404 for anyone not in it). */
async function loadOwnChallenge(req) {
  if (!isUuid(req.params.challengeId)) return null;
  const [challenge, entry] = await Promise.all([
    findChallengeById(req.params.challengeId),
    findChallengeEntry(req.params.challengeId, req.user.id),
  ]);
  return challenge && entry ? { challenge, entry } : null;
}

/** Check the map someone wants counted: theirs to count (owned or edited). -> mapId or an answer sent */
async function checkMapChoice(req, res) {
  const parsed = parseChallengeMapId(req.body?.mapId);
  if (!parsed.ok || !(await canCountMap(req.user.id, parsed.mapId))) {
    badRequest(req, res, D, EVENT_MESSAGES.challengeMapInvalid);
    return null;
  }
  return parsed.mapId;
}

// Mine

/**
 * GET /challenges: every challenge the caller is in, newest joined first, with their own
 * count (from the map that counts for them) and how many are in. The ranks are on each
 * challenge's page: ranking every challenge here would count everyone in all of them.
 */
export const getMyChallengesHandler = handler(D, 'Get challenges', async (req, res) => {
  const entries = await findUserChallenges(req.user.id);
  const [counts, theirs] = await Promise.all([
    countMembers(entries.map((e) => e.challenge.id)),
    mapsStillTheirs(entries.map((e) => ({ userId: req.user.id, mapId: e.mapId }))),
  ]);
  const challenges = await Promise.all(
    entries.map(async ({ challenge, mapId }) => {
      const counting = Boolean(mapId) && theirs.has(`${req.user.id}:${mapId}`);
      const mine = counting ? standing(await countedDates(challenge.measure, mapId, challengeWindow(challenge)), challenge.target) : null;
      return {
        ...challengeFields(challenge),
        memberCount: counts.get(challenge.id) ?? 1,
        myCount: mine?.count ?? 0,
        reachedTarget: Boolean(mine?.reachedAt),
        counting,
        youStartedIt: challenge.createdById === req.user.id,
      };
    }),
  );
  return sendDataResponse(res, 200, { challenges, perUserLimit: CHALLENGE_LIMITS.perUser });
});

/** POST /challenges `{ title, measure, startsOn, endsOn, target?, mapId }`: the starter is in it, counting mapId. */
export const createChallengeHandler = handler(D, 'Create challenge', async (req, res) => {
  const parsed = parseChallengeInput(req.body);
  if (!parsed.ok) return badRequest(req, res, D, EVENT_MESSAGES[parsed.message]);
  const mapId = await checkMapChoice(req, res);
  if (!mapId) return undefined;
  const { challenge, tooMany } = await createChallengeInDB({ data: parsed.data, userId: req.user.id, mapId, perUserCap: CHALLENGE_LIMITS.perUser });
  if (tooMany) return conflict(req, res, D, EVENT_MESSAGES.challengesPerUserFull);
  logEvent(createChallengeEvent({ user: req.user, action: 'Create Success', id: challenge.id, detail: `measure=${challenge.measure}`, statusCode: 201 }));
  const entry = await findChallengeEntry(challenge.id, req.user.id);
  return sendDataResponse(res, 201, { challenge: await challengeDetail(challenge, req.user.id, entry) });
});

// One challenge (people in it only; anyone else gets a 404)

export const getChallengeHandler = handler(D, 'Get challenge', async (req, res) => {
  const own = await loadOwnChallenge(req);
  if (!own) return notFound(req, res, D, EVENT_MESSAGES.challengeNotFound);
  return sendDataResponse(res, 200, { challenge: await challengeDetail(own.challenge, req.user.id, own.entry) });
});

/** PATCH /challenges/:challengeId `{ title?, startsOn?, endsOn?, target? }`: the starter only. */
export const updateChallengeHandler = handler(D, 'Update challenge', async (req, res) => {
  const own = await loadOwnChallenge(req);
  if (!own) return notFound(req, res, D, EVENT_MESSAGES.challengeNotFound);
  if (own.challenge.createdById !== req.user.id) return forbidden(req, res, D);
  const parsed = parseChallengeInput(req.body, { existing: own.challenge });
  if (!parsed.ok) return badRequest(req, res, D, EVENT_MESSAGES[parsed.message]);
  const challenge = Object.keys(parsed.data).length ? await updateChallengeInDB(own.challenge.id, parsed.data) : own.challenge;
  logEvent(createChallengeEvent({ user: req.user, action: 'Update Success', id: challenge.id, detail: Object.keys(parsed.data).join(',') }));
  return sendDataResponse(res, 200, { challenge: await challengeDetail(challenge, req.user.id, own.entry) });
});

/** DELETE /challenges/:challengeId: the starter only; everyone leaves with it. */
export const deleteChallengeHandler = handler(D, 'Delete challenge', async (req, res) => {
  const own = await loadOwnChallenge(req);
  if (!own) return notFound(req, res, D, EVENT_MESSAGES.challengeNotFound);
  if (own.challenge.createdById !== req.user.id) return forbidden(req, res, D);
  await deleteChallengeInDB(own.challenge.id);
  logEvent(createChallengeEvent({ user: req.user, action: 'Delete Success', id: own.challenge.id }));
  return sendMessageResponse(res, 200, 'Challenge deleted.');
});

/** POST /challenges/:challengeId/reset-link: a new join link; the old one stops working. */
export const resetChallengeLinkHandler = handler(D, 'Reset challenge link', async (req, res) => {
  const own = await loadOwnChallenge(req);
  if (!own) return notFound(req, res, D, EVENT_MESSAGES.challengeNotFound);
  if (own.challenge.createdById !== req.user.id) return forbidden(req, res, D);
  const challenge = await resetJoinCodeInDB(own.challenge.id);
  logEvent(createChallengeEvent({ user: req.user, action: 'Link Reset Success', id: challenge.id }));
  return sendDataResponse(res, 200, { challenge: await challengeDetail(challenge, req.user.id, own.entry) });
});

/** PATCH /challenges/:challengeId/me `{ mapId }`: which of the caller's maps counts. */
export const setMyChallengeMapHandler = handler(D, 'Set challenge map', async (req, res) => {
  const own = await loadOwnChallenge(req);
  if (!own) return notFound(req, res, D, EVENT_MESSAGES.challengeNotFound);
  const mapId = await checkMapChoice(req, res);
  if (!mapId) return undefined;
  await setEntryMap(own.challenge.id, req.user.id, mapId);
  return sendDataResponse(res, 200, { challenge: await challengeDetail(own.challenge, req.user.id, { ...own.entry, mapId }) });
});

/** DELETE /challenges/:challengeId/me: leave (the starter deletes it instead). */
export const leaveChallengeHandler = handler(D, 'Leave challenge', async (req, res) => {
  const own = await loadOwnChallenge(req);
  if (!own) return notFound(req, res, D, EVENT_MESSAGES.challengeNotFound);
  if (own.challenge.createdById === req.user.id) return conflict(req, res, D, EVENT_MESSAGES.challengeCreatorLeaves);
  await deleteChallengeEntry(own.challenge.id, req.user.id);
  logEvent(createChallengeEvent({ user: req.user, action: 'Leave Success', id: own.challenge.id }));
  return sendMessageResponse(res, 200, 'You’ve left the challenge.');
});

// By its link

/** The challenge a link opens, or null: an answer is sent for a code that can't be one. */
async function challengeForCode(req) {
  const code = normaliseShareCode(req.params.code);
  return code ? findChallengeByJoinCode(code) : null;
}

/**
 * GET /challenges/join/:code (anyone): enough to decide whether to join: what it counts,
 * the dates, who started it (their name) and how many are in. Never the others' names.
 */
export const previewChallengeHandler = handler(D, 'Preview challenge', async (req, res) => {
  const challenge = await challengeForCode(req);
  if (!challenge) return notFound(req, res, D, EVENT_MESSAGES.challengeLinkNotFound);
  const [members, entry] = await Promise.all([
    findChallengeMembers(challenge.id),
    req.user ? findChallengeEntry(challenge.id, req.user.id) : null,
  ]);
  const starter = members.find((m) => m.userId === challenge.createdById);
  return sendDataResponse(res, 200, {
    challenge: {
      ...challengeFields(challenge),
      startedBy: starter?.name ?? null,
      memberCount: members.length,
      full: members.length >= CHALLENGE_LIMITS.members,
      youAreIn: Boolean(entry),
    },
  });
});

/** POST /challenges/join/:code `{ mapId }` (signed in, verified): join, counting mapId. */
export const joinChallengeHandler = handler(D, 'Join challenge', async (req, res) => {
  const challenge = await challengeForCode(req);
  if (!challenge) return notFound(req, res, D, EVENT_MESSAGES.challengeLinkNotFound);
  if (challengeStatus(challenge) === 'ENDED') return conflict(req, res, D, EVENT_MESSAGES.challengeEnded);
  const mapId = await checkMapChoice(req, res);
  if (!mapId) return undefined;
  const result = await joinChallengeInDB({
    challengeId: challenge.id,
    userId: req.user.id,
    mapId,
    memberCap: CHALLENGE_LIMITS.members,
    perUserCap: CHALLENGE_LIMITS.perUser,
  });
  if (result.full) return conflict(req, res, D, EVENT_MESSAGES.challengeFull);
  if (result.tooMany) return conflict(req, res, D, EVENT_MESSAGES.challengesPerUserFull);
  if (result.joined) logEvent(createChallengeEvent({ user: req.user, action: 'Join Success', id: challenge.id, statusCode: 201 }));
  const entry = await findChallengeEntry(challenge.id, req.user.id);
  return sendDataResponse(res, result.joined ? 201 : 200, { challenge: await challengeDetail(challenge, req.user.id, entry) });
});
