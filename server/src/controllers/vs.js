// Vs mode (26 Nov 2026, the user's wish: "connect to another account and have all your stats and
// badges compared. Able to add multiple people. Gold silver bronze ratings for top people";
// docs/API.md "Vs mode"): starting a comparison, the ones someone's in, one compared, joining by
// its link, picking the map that counts, leaving, and the starter's changes. Friends agree by
// joining; at most 8 people (the user's decision). Rules in utils/vs.js.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse, sendMessageResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createVsEvent } from '../event/travelUtils.js';
import { isUuid } from '../utils/travelValidation.js';
import { formatShareCode, normaliseShareCode } from '../utils/shareCodes.js';
import { VS_CATEGORIES, VS_LIMITS, compareAll, parseVsMapId, parseVsTitle } from '../utils/vs.js';
import { findMapName, mapsStillTheirs } from '../domain/challenges.js';
import {
  countVsMembers,
  createVsGroupInDB,
  deleteVsGroupInDB,
  deleteVsMember,
  findUserVsGroups,
  findVsGroupById,
  findVsGroupByJoinCode,
  findVsMember,
  findVsMembers,
  joinVsGroupInDB,
  resetVsJoinCodeInDB,
  setVsMemberMap,
  updateVsGroupInDB,
} from '../domain/vs.js';
import { vsNumbers } from '../services/travel/vs.js';
import { badRequest, conflict, forbidden, handler, notFound } from './helpers/travel.js';

const D = DOMAINS.vs;

/**
 * Everyone compared: each person's name, their numbers from the map that counts for them (if they
 * still own or edit it), their badges' names, their medal in each category and their place in
 * the medal table. Names and numbers only: never a map, a photo or a place. `isYou` marks the
 * caller; no one's id is sent.
 */
async function comparison(group, userId) {
  const members = await findVsMembers(group.id);
  const theirs = await mapsStillTheirs(members);
  const numbers = await Promise.all(
    members.map((member) => (member.mapId && theirs.has(`${member.userId}:${member.mapId}`) ? vsNumbers(member.mapId) : null)),
  );
  const compared = compareAll(numbers.map((n) => ({ values: n?.values ?? null })));
  return members.map((member, i) => ({
    name: member.name,
    isYou: member.userId === userId,
    startedIt: member.userId === group.createdById,
    counting: Boolean(numbers[i]),
    values: numbers[i]?.values ?? null,
    badges: numbers[i]?.badges ?? [],
    medals: compared[i].medals,
    gold: compared[i].gold,
    silver: compared[i].silver,
    bronze: compared[i].bronze,
    place: compared[i].place,
  }));
}

/** One comparison, for someone in it: its title, the link, everyone compared and their own map. */
async function groupDetail(group, userId, member) {
  const [people, myMapName] = await Promise.all([comparison(group, userId), member.mapId ? findMapName(member.mapId) : null]);
  return {
    id: group.id,
    title: group.title,
    joinCode: formatShareCode(group.joinCode),
    youStartedIt: group.createdById === userId,
    myMap: member.mapId ? { id: member.mapId, name: myMapName } : null,
    categories: VS_CATEGORIES,
    members: people,
    memberLimit: VS_LIMITS.members,
  };
}

/** The comparison and the caller's place in it, or null (a 404 for anyone not in it). */
async function loadOwnGroup(req) {
  if (!isUuid(req.params.groupId)) return null;
  const [group, member] = await Promise.all([findVsGroupById(req.params.groupId), findVsMember(req.params.groupId, req.user.id)]);
  return group && member ? { group, member } : null;
}

/** The map someone wants counted: theirs to count (owned or edited). -> mapId, or null with an answer sent */
async function checkMapChoice(req, res) {
  const parsed = parseVsMapId(req.body?.mapId);
  if (!parsed.ok || (await mapsStillTheirs([{ userId: req.user.id, mapId: parsed.mapId }])).size !== 1) {
    badRequest(req, res, D, EVENT_MESSAGES.vsMapInvalid);
    return null;
  }
  return parsed.mapId;
}

// Mine

/** GET /vs: every comparison the caller is in, newest joined first, with how many are in. */
export const getMyVsGroupsHandler = handler(D, 'Get vs groups', async (req, res) => {
  const rows = await findUserVsGroups(req.user.id);
  const counts = await countVsMembers(rows.map((row) => row.group.id));
  return sendDataResponse(res, 200, {
    groups: rows.map(({ group, mapId }) => ({
      id: group.id,
      title: group.title,
      memberCount: counts.get(group.id) ?? 1,
      youStartedIt: group.createdById === req.user.id,
      hasMap: Boolean(mapId),
    })),
    perUserLimit: VS_LIMITS.perUser,
    memberLimit: VS_LIMITS.members,
  });
});

/** POST /vs `{ title?, mapId }`: the starter is in it, counting mapId. */
export const createVsGroupHandler = handler(D, 'Create vs group', async (req, res) => {
  const mapId = await checkMapChoice(req, res);
  if (!mapId) return undefined;
  const { group, tooMany } = await createVsGroupInDB({ title: parseVsTitle(req.body?.title), userId: req.user.id, mapId, perUserCap: VS_LIMITS.perUser });
  if (tooMany) return conflict(req, res, D, EVENT_MESSAGES.vsPerUserFull);
  logEvent(createVsEvent({ user: req.user, action: 'Create Success', id: group.id, statusCode: 201 }));
  const member = await findVsMember(group.id, req.user.id);
  return sendDataResponse(res, 201, { group: await groupDetail(group, req.user.id, member) });
});

// One comparison (people in it only; anyone else gets a 404)

export const getVsGroupHandler = handler(D, 'Get vs group', async (req, res) => {
  const own = await loadOwnGroup(req);
  if (!own) return notFound(req, res, D, EVENT_MESSAGES.vsNotFound);
  return sendDataResponse(res, 200, { group: await groupDetail(own.group, req.user.id, own.member) });
});

/** PATCH /vs/:groupId `{ title }`: the starter only. */
export const updateVsGroupHandler = handler(D, 'Update vs group', async (req, res) => {
  const own = await loadOwnGroup(req);
  if (!own) return notFound(req, res, D, EVENT_MESSAGES.vsNotFound);
  if (own.group.createdById !== req.user.id) return forbidden(req, res, D);
  if (typeof req.body?.title !== 'string') return badRequest(req, res, D, EVENT_MESSAGES.malformedData);
  const group = await updateVsGroupInDB(own.group.id, { title: parseVsTitle(req.body.title) });
  logEvent(createVsEvent({ user: req.user, action: 'Update Success', id: group.id }));
  return sendDataResponse(res, 200, { group: await groupDetail(group, req.user.id, own.member) });
});

/** DELETE /vs/:groupId: the starter only; everyone leaves with it. */
export const deleteVsGroupHandler = handler(D, 'Delete vs group', async (req, res) => {
  const own = await loadOwnGroup(req);
  if (!own) return notFound(req, res, D, EVENT_MESSAGES.vsNotFound);
  if (own.group.createdById !== req.user.id) return forbidden(req, res, D);
  await deleteVsGroupInDB(own.group.id);
  logEvent(createVsEvent({ user: req.user, action: 'Delete Success', id: own.group.id }));
  return sendMessageResponse(res, 200, 'Comparison deleted.');
});

/** POST /vs/:groupId/reset-link: a new join link; the old one stops working. The starter only. */
export const resetVsLinkHandler = handler(D, 'Reset vs link', async (req, res) => {
  const own = await loadOwnGroup(req);
  if (!own) return notFound(req, res, D, EVENT_MESSAGES.vsNotFound);
  if (own.group.createdById !== req.user.id) return forbidden(req, res, D);
  const group = await resetVsJoinCodeInDB(own.group.id);
  logEvent(createVsEvent({ user: req.user, action: 'Link Reset Success', id: group.id }));
  return sendDataResponse(res, 200, { group: await groupDetail(group, req.user.id, own.member) });
});

/** PATCH /vs/:groupId/me `{ mapId }`: which of the caller's maps counts. */
export const setMyVsMapHandler = handler(D, 'Set vs map', async (req, res) => {
  const own = await loadOwnGroup(req);
  if (!own) return notFound(req, res, D, EVENT_MESSAGES.vsNotFound);
  const mapId = await checkMapChoice(req, res);
  if (!mapId) return undefined;
  await setVsMemberMap(own.group.id, req.user.id, mapId);
  return sendDataResponse(res, 200, { group: await groupDetail(own.group, req.user.id, { ...own.member, mapId }) });
});

/** DELETE /vs/:groupId/me: leave (the starter deletes it instead). */
export const leaveVsGroupHandler = handler(D, 'Leave vs group', async (req, res) => {
  const own = await loadOwnGroup(req);
  if (!own) return notFound(req, res, D, EVENT_MESSAGES.vsNotFound);
  if (own.group.createdById === req.user.id) return conflict(req, res, D, EVENT_MESSAGES.vsStarterLeaves);
  await deleteVsMember(own.group.id, req.user.id);
  logEvent(createVsEvent({ user: req.user, action: 'Leave Success', id: own.group.id }));
  return sendMessageResponse(res, 200, 'You’ve left the comparison.');
});

// By its link

const groupForCode = (req) => {
  const code = normaliseShareCode(req.params.code);
  return code ? findVsGroupByJoinCode(code) : null;
};

/**
 * GET /vs/join/:code (anyone): enough to decide whether to join: its title, who started it (their
 * name), how many are in and whether it's full. Never the others' names or numbers.
 */
export const previewVsGroupHandler = handler(D, 'Preview vs group', async (req, res) => {
  const group = await groupForCode(req);
  if (!group) return notFound(req, res, D, EVENT_MESSAGES.vsLinkNotFound);
  const [members, member] = await Promise.all([findVsMembers(group.id), req.user ? findVsMember(group.id, req.user.id) : null]);
  const starter = members.find((m) => m.userId === group.createdById);
  return sendDataResponse(res, 200, {
    group: {
      id: group.id,
      title: group.title,
      startedBy: starter?.name ?? null,
      memberCount: members.length,
      memberLimit: VS_LIMITS.members,
      full: members.length >= VS_LIMITS.members,
      youAreIn: Boolean(member),
    },
  });
});

/** POST /vs/join/:code `{ mapId }` (signed in, verified): join, counting mapId. */
export const joinVsGroupHandler = handler(D, 'Join vs group', async (req, res) => {
  const group = await groupForCode(req);
  if (!group) return notFound(req, res, D, EVENT_MESSAGES.vsLinkNotFound);
  const mapId = await checkMapChoice(req, res);
  if (!mapId) return undefined;
  const result = await joinVsGroupInDB({ groupId: group.id, userId: req.user.id, mapId, memberCap: VS_LIMITS.members, perUserCap: VS_LIMITS.perUser });
  if (result.full) return conflict(req, res, D, EVENT_MESSAGES.vsFull);
  if (result.tooMany) return conflict(req, res, D, EVENT_MESSAGES.vsPerUserFull);
  if (result.joined) logEvent(createVsEvent({ user: req.user, action: 'Join Success', id: group.id, statusCode: 201 }));
  const member = await findVsMember(group.id, req.user.id);
  return sendDataResponse(res, result.joined ? 201 : 200, { group: await groupDetail(group, req.user.id, member) });
});
