// Mock mode only: friends challenges (docs/API.md, "Friends challenges"), as the server's
// controllers/challenges.js: the challenges you're in, one's leaderboard (names and counts
// only), starting one, joining by its link, the map that counts, leaving, and the starter's
// changes. The rules are ../challenges.js.
import { fail, ok, raw, route } from '../mockAdapter';
import { formatShareCode, getDb, me, newId, newShareCode, normaliseShareCode, session } from '../store';
import {
  CHALLENGE_LIMITS,
  canCountMap,
  challengeStatus,
  challengeWindow,
  countedDates,
  parseChallengeInput,
  rankMembers,
  standing,
} from '../challenges';

// The server's words (utils/responses/responses.js)
const MESSAGES = {
  notFound: "That challenge doesn't exist, or you're not in it.",
  invalid: 'Check the challenge: a title of 1 to 80 characters, what it counts, a first and last day (YYYY-MM-DD) and a target of 1 to 500, or none.',
  dates: 'The last day must be on or after the first, and a challenge can last up to two years.',
  measureFixed: "What a challenge counts can't change once it's made.",
  mapInvalid: 'Choose one of your maps to count: one you own or edit.',
  linkNotFound: "That challenge link doesn't work. Ask for a new one.",
  full: 'This challenge has 50 people, the most it can have.',
  tooMany: "You're in 30 challenges, the most at once. Leave one to join another.",
  ended: 'This challenge has ended.',
  starterLeaves: 'You started this challenge, so delete it instead of leaving.',
  forbidden: 'You do not have permission to do that.',
  signIn: 'No valid session. Please sign in.',
};

const challenges = () => getDb().challenges || [];
const entries = () => getDb().challengeEntries || [];
const entryOf = (challengeId, userId) => entries().find((e) => e.challengeId === challengeId && e.userId === userId) || null;
const nameOf = (userId) => getDb().users.find((u) => u.id === userId)?.name || 'Someone';
const signedOut = () => (session.signedIn ? null : fail(401, MESSAGES.signIn));

const fields = (challenge) => ({
  id: challenge.id,
  title: challenge.title,
  measure: challenge.measure,
  startsOn: challenge.startsOn,
  endsOn: challenge.endsOn,
  target: challenge.target ?? null,
  status: challengeStatus(challenge),
});

// Someone's standing: from the map that counts for them, while they own or edit it
function standingOf(db, challenge, entry) {
  const counting = Boolean(entry.mapId) && canCountMap(db, entry.userId, entry.mapId);
  if (!counting) return { count: 0, reachedAt: null, counting };
  return { ...standing(countedDates(db, challenge.measure, entry.mapId, challengeWindow(challenge)), challenge.target), counting };
}

function detail(challenge, userId) {
  const db = getDb();
  const people = entries()
    .filter((e) => e.challengeId === challenge.id)
    .sort((a, b) => (a.joinedAt < b.joinedAt ? -1 : 1));
  const rows = people.map((e) => ({ userId: e.userId, name: nameOf(e.userId), ...standingOf(db, challenge, e) }));
  const mine = entryOf(challenge.id, userId);
  const myMap = mine?.mapId ? db.maps.find((m) => m.id === mine.mapId) : null;
  return {
    ...fields(challenge),
    joinCode: formatShareCode(challenge.joinCode),
    youStartedIt: challenge.createdById === userId,
    myMap: mine?.mapId ? { id: mine.mapId, name: myMap?.name ?? null } : null,
    members: rankMembers(rows).map((row) => ({
      name: row.name,
      count: row.count,
      rank: row.rank,
      reachedTarget: Boolean(row.reachedAt),
      counting: row.counting,
      isYou: row.userId === userId,
      startedIt: row.userId === challenge.createdById,
    })),
    memberLimit: CHALLENGE_LIMITS.members,
  };
}

// The challenge and the caller's place in it, or the reply (404 for anyone not in it)
function ownChallenge(params) {
  const out = signedOut();
  if (out) return { reply: out };
  const challenge = challenges().find((c) => c.id === params.challengeId);
  if (!challenge || !entryOf(challenge.id, me().id)) return { reply: fail(404, MESSAGES.notFound) };
  return { challenge };
}

const byCode = (code) => {
  const normal = normaliseShareCode(code);
  return normal ? challenges().find((c) => c.joinCode === normal) || null : null;
};

export function registerChallengeRoutes() {
  route('GET', '/api/challenges', () => {
    const out = signedOut();
    if (out) return out;
    const db = getDb();
    const mine = entries()
      .filter((e) => e.userId === me().id)
      .sort((a, b) => (a.joinedAt < b.joinedAt ? 1 : -1));
    const list = mine
      .map((entry) => {
        const challenge = challenges().find((c) => c.id === entry.challengeId);
        if (!challenge) return null;
        const own = standingOf(db, challenge, entry);
        return {
          ...fields(challenge),
          memberCount: entries().filter((e) => e.challengeId === challenge.id).length,
          myCount: own.count,
          reachedTarget: Boolean(own.reachedAt),
          counting: own.counting,
          youStartedIt: challenge.createdById === me().id,
        };
      })
      .filter(Boolean);
    return ok({ challenges: list, perUserLimit: CHALLENGE_LIMITS.perUser });
  });

  route('POST', '/api/challenges', ({ body }) => {
    const out = signedOut();
    if (out) return out;
    const parsed = parseChallengeInput(body);
    if (!parsed.ok) return fail(400, MESSAGES[parsed.message]);
    const db = getDb();
    if (!canCountMap(db, me().id, body?.mapId)) return fail(400, MESSAGES.mapInvalid);
    // Starting one counts towards the person's challenges too (the server's rule)
    if (entries().filter((e) => e.userId === me().id).length >= CHALLENGE_LIMITS.perUser) return fail(409, MESSAGES.tooMany);
    const now = new Date().toISOString();
    const challenge = { id: newId(), ...parsed.data, joinCode: newShareCode(), createdById: me().id, createdAt: now };
    db.challenges.push(challenge);
    db.challengeEntries.push({ challengeId: challenge.id, userId: me().id, mapId: body.mapId, joinedAt: now });
    return ok({ challenge: detail(challenge, me().id) }, 201);
  });

  // By the join link (before /:challengeId, as the server mounts them)
  route('GET', '/api/challenges/join/:code', ({ params }) => {
    const challenge = byCode(params.code);
    if (!challenge) return fail(404, MESSAGES.linkNotFound);
    const people = entries().filter((e) => e.challengeId === challenge.id);
    return ok({
      challenge: {
        ...fields(challenge),
        startedBy: people.some((e) => e.userId === challenge.createdById) ? nameOf(challenge.createdById) : null,
        memberCount: people.length,
        full: people.length >= CHALLENGE_LIMITS.members,
        youAreIn: session.signedIn ? people.some((e) => e.userId === me().id) : false,
      },
    });
  });

  route('POST', '/api/challenges/join/:code', ({ params, body }) => {
    const out = signedOut();
    if (out) return out;
    const challenge = byCode(params.code);
    if (!challenge) return fail(404, MESSAGES.linkNotFound);
    if (challengeStatus(challenge) === 'ENDED') return fail(409, MESSAGES.ended);
    const db = getDb();
    if (!canCountMap(db, me().id, body?.mapId)) return fail(400, MESSAGES.mapInvalid);
    if (entryOf(challenge.id, me().id)) return ok({ challenge: detail(challenge, me().id) });
    if (entries().filter((e) => e.challengeId === challenge.id).length >= CHALLENGE_LIMITS.members) return fail(409, MESSAGES.full);
    if (entries().filter((e) => e.userId === me().id).length >= CHALLENGE_LIMITS.perUser) return fail(409, MESSAGES.tooMany);
    db.challengeEntries.push({ challengeId: challenge.id, userId: me().id, mapId: body.mapId, joinedAt: new Date().toISOString() });
    return ok({ challenge: detail(challenge, me().id) }, 201);
  });

  route('GET', '/api/challenges/:challengeId', ({ params }) => {
    const { challenge, reply } = ownChallenge(params);
    return reply || ok({ challenge: detail(challenge, me().id) });
  });

  route('PATCH', '/api/challenges/:challengeId', ({ params, body }) => {
    const { challenge, reply } = ownChallenge(params);
    if (reply) return reply;
    if (challenge.createdById !== me().id) return fail(403, MESSAGES.forbidden);
    const parsed = parseChallengeInput(body, { existing: challenge });
    if (!parsed.ok) return fail(400, MESSAGES[parsed.message]);
    Object.assign(challenge, parsed.data);
    return ok({ challenge: detail(challenge, me().id) });
  });

  route('DELETE', '/api/challenges/:challengeId', ({ params }) => {
    const { challenge, reply } = ownChallenge(params);
    if (reply) return reply;
    if (challenge.createdById !== me().id) return fail(403, MESSAGES.forbidden);
    const db = getDb();
    db.challenges = db.challenges.filter((c) => c.id !== challenge.id);
    db.challengeEntries = db.challengeEntries.filter((e) => e.challengeId !== challenge.id);
    return raw({ status: 'success', message: 'Challenge deleted.' });
  });

  route('POST', '/api/challenges/:challengeId/reset-link', ({ params }) => {
    const { challenge, reply } = ownChallenge(params);
    if (reply) return reply;
    if (challenge.createdById !== me().id) return fail(403, MESSAGES.forbidden);
    challenge.joinCode = newShareCode();
    return ok({ challenge: detail(challenge, me().id) });
  });

  route('PATCH', '/api/challenges/:challengeId/me', ({ params, body }) => {
    const { challenge, reply } = ownChallenge(params);
    if (reply) return reply;
    if (!canCountMap(getDb(), me().id, body?.mapId)) return fail(400, MESSAGES.mapInvalid);
    entryOf(challenge.id, me().id).mapId = body.mapId;
    return ok({ challenge: detail(challenge, me().id) });
  });

  route('DELETE', '/api/challenges/:challengeId/me', ({ params }) => {
    const { challenge, reply } = ownChallenge(params);
    if (reply) return reply;
    if (challenge.createdById === me().id) return fail(409, MESSAGES.starterLeaves);
    const db = getDb();
    db.challengeEntries = db.challengeEntries.filter((e) => !(e.challengeId === challenge.id && e.userId === me().id));
    return raw({ status: 'success', message: 'You’ve left the challenge.' });
  });
}
