// Mock mode only: Vs mode (docs/API.md "Vs mode"), as the server's controllers/vs.js: the
// comparisons you're in, one compared (names and numbers only), starting one, joining by its
// link (8 people at most), the map that counts, leaving, and the starter's changes. Numbers
// from ../vs.js, medals from the server's rules (utils/vs/vsRules.js).
import { fail, ok, raw, route } from '../mockAdapter';
import { formatShareCode, getDb, me, newId, newShareCode, normaliseShareCode, session } from '../store';
import { canCountMap } from '../challenges';
import { vsNumbers } from '../vs';
import { VS_CATEGORIES, VS_DEFAULT_TITLE, VS_LIMITS, compareAll } from '@/utils/vs/vsRules';
import { serverText } from '@/utils/regex/regex';

// The server's words (utils/responses/responses.js)
const MESSAGES = {
  notFound: "That comparison doesn't exist, or you're not in it.",
  linkNotFound: "That link doesn't work. Ask for a new one.",
  mapInvalid: 'Choose one of your maps: one you own or edit.',
  full: 'That comparison already has 8 people, the most it can have.',
  tooMany: "You're in 30 comparisons, the most at once. Leave one to join another.",
  starterLeaves: "You started this comparison, so you can't leave it: delete it instead.",
  malformed: "Some details weren't in the right format. Please check them and try again.",
  forbidden: 'You do not have permission to do that.',
  signIn: 'No valid session. Please sign in.',
};

const groups = () => getDb().vsGroups || [];
const members = () => getDb().vsMembers || [];
const memberOf = (groupId, userId) => members().find((m) => m.groupId === groupId && m.userId === userId) || null;
const nameOf = (userId) => getDb().users.find((u) => u.id === userId)?.name || 'Someone';
const signedOut = () => (session.signedIn ? null : fail(401, MESSAGES.signIn));
// The server's parseVsTitle: cleaned as sanitizeText cleans, cut to 80, the usual one when empty
const titleFrom = (value) => (typeof value === 'string' ? serverText(value).slice(0, VS_LIMITS.title) : '') || VS_DEFAULT_TITLE;

function comparison(group, userId) {
  const db = getDb();
  const people = members()
    .filter((m) => m.groupId === group.id)
    .sort((a, b) => (a.joinedAt < b.joinedAt ? -1 : 1));
  const numbers = people.map((m) => (m.mapId && canCountMap(db, m.userId, m.mapId) ? vsNumbers(m.mapId) : null));
  const compared = compareAll(numbers.map((n) => ({ values: n?.values ?? null })));
  return people.map((m, i) => ({
    name: nameOf(m.userId),
    isYou: m.userId === userId,
    startedIt: m.userId === group.createdById,
    counting: Boolean(numbers[i]),
    values: numbers[i]?.values ?? null,
    badges: numbers[i]?.badges ?? [],
    ...compared[i],
  }));
}

function detail(group, userId) {
  const mine = memberOf(group.id, userId);
  const myMap = mine?.mapId ? getDb().maps.find((m) => m.id === mine.mapId) : null;
  return {
    id: group.id,
    title: group.title,
    joinCode: formatShareCode(group.joinCode),
    youStartedIt: group.createdById === userId,
    myMap: mine?.mapId ? { id: mine.mapId, name: myMap?.name ?? null } : null,
    categories: VS_CATEGORIES,
    members: comparison(group, userId),
    memberLimit: VS_LIMITS.members,
  };
}

// The comparison and the caller's place in it, or the reply (404 for anyone not in it)
function ownGroup(params) {
  const out = signedOut();
  if (out) return { reply: out };
  const group = groups().find((g) => g.id === params.groupId);
  if (!group || !memberOf(group.id, me().id)) return { reply: fail(404, MESSAGES.notFound) };
  return { group };
}

const byCode = (code) => {
  const normal = normaliseShareCode(code);
  return normal ? groups().find((g) => g.joinCode === normal) || null : null;
};

const mineCount = () => members().filter((m) => m.userId === me().id).length;

export function registerVsRoutes() {
  route('GET', '/api/vs', () => {
    const out = signedOut();
    if (out) return out;
    const list = members()
      .filter((m) => m.userId === me().id)
      .sort((a, b) => (a.joinedAt < b.joinedAt ? 1 : -1))
      .map((mine) => {
        const group = groups().find((g) => g.id === mine.groupId);
        if (!group) return null;
        return {
          id: group.id,
          title: group.title,
          memberCount: members().filter((m) => m.groupId === group.id).length,
          youStartedIt: group.createdById === me().id,
          hasMap: Boolean(mine.mapId),
        };
      })
      .filter(Boolean);
    return ok({ groups: list, perUserLimit: VS_LIMITS.perUser, memberLimit: VS_LIMITS.members });
  });

  route('POST', '/api/vs', ({ body }) => {
    const out = signedOut();
    if (out) return out;
    const db = getDb();
    if (!canCountMap(db, me().id, body?.mapId)) return fail(400, MESSAGES.mapInvalid);
    if (mineCount() >= VS_LIMITS.perUser) return fail(409, MESSAGES.tooMany);
    const now = new Date().toISOString();
    const group = { id: newId(), title: titleFrom(body?.title), joinCode: newShareCode(), createdById: me().id, createdAt: now };
    db.vsGroups.push(group);
    db.vsMembers.push({ groupId: group.id, userId: me().id, mapId: body.mapId, joinedAt: now });
    return ok({ group: detail(group, me().id) }, 201);
  });

  // By the join link (before /:groupId, as the server mounts them)
  route('GET', '/api/vs/join/:code', ({ params }) => {
    const group = byCode(params.code);
    if (!group) return fail(404, MESSAGES.linkNotFound);
    const people = members().filter((m) => m.groupId === group.id);
    return ok({
      group: {
        id: group.id,
        title: group.title,
        startedBy: people.some((m) => m.userId === group.createdById) ? nameOf(group.createdById) : null,
        memberCount: people.length,
        memberLimit: VS_LIMITS.members,
        full: people.length >= VS_LIMITS.members,
        youAreIn: session.signedIn ? people.some((m) => m.userId === me().id) : false,
      },
    });
  });

  route('POST', '/api/vs/join/:code', ({ params, body }) => {
    const out = signedOut();
    if (out) return out;
    const group = byCode(params.code);
    if (!group) return fail(404, MESSAGES.linkNotFound);
    const db = getDb();
    if (!canCountMap(db, me().id, body?.mapId)) return fail(400, MESSAGES.mapInvalid);
    if (memberOf(group.id, me().id)) return ok({ group: detail(group, me().id) });
    if (members().filter((m) => m.groupId === group.id).length >= VS_LIMITS.members) return fail(409, MESSAGES.full);
    if (mineCount() >= VS_LIMITS.perUser) return fail(409, MESSAGES.tooMany);
    db.vsMembers.push({ groupId: group.id, userId: me().id, mapId: body.mapId, joinedAt: new Date().toISOString() });
    return ok({ group: detail(group, me().id) }, 201);
  });

  route('GET', '/api/vs/:groupId', ({ params }) => {
    const { group, reply } = ownGroup(params);
    return reply || ok({ group: detail(group, me().id) });
  });

  route('PATCH', '/api/vs/:groupId', ({ params, body }) => {
    const { group, reply } = ownGroup(params);
    if (reply) return reply;
    if (group.createdById !== me().id) return fail(403, MESSAGES.forbidden);
    if (typeof body?.title !== 'string') return fail(400, MESSAGES.malformed);
    group.title = titleFrom(body.title);
    return ok({ group: detail(group, me().id) });
  });

  route('DELETE', '/api/vs/:groupId', ({ params }) => {
    const { group, reply } = ownGroup(params);
    if (reply) return reply;
    if (group.createdById !== me().id) return fail(403, MESSAGES.forbidden);
    const db = getDb();
    db.vsGroups = db.vsGroups.filter((g) => g.id !== group.id);
    db.vsMembers = db.vsMembers.filter((m) => m.groupId !== group.id);
    return raw({ status: 'success', message: 'Comparison deleted.' });
  });

  route('POST', '/api/vs/:groupId/reset-link', ({ params }) => {
    const { group, reply } = ownGroup(params);
    if (reply) return reply;
    if (group.createdById !== me().id) return fail(403, MESSAGES.forbidden);
    group.joinCode = newShareCode();
    return ok({ group: detail(group, me().id) });
  });

  route('PATCH', '/api/vs/:groupId/me', ({ params, body }) => {
    const { group, reply } = ownGroup(params);
    if (reply) return reply;
    if (!canCountMap(getDb(), me().id, body?.mapId)) return fail(400, MESSAGES.mapInvalid);
    memberOf(group.id, me().id).mapId = body.mapId;
    return ok({ group: detail(group, me().id) });
  });

  route('DELETE', '/api/vs/:groupId/me', ({ params }) => {
    const { group, reply } = ownGroup(params);
    if (reply) return reply;
    if (group.createdById === me().id) return fail(409, MESSAGES.starterLeaves);
    const db = getDb();
    db.vsMembers = db.vsMembers.filter((m) => !(m.groupId === group.id && m.userId === me().id));
    return raw({ status: 'success', message: 'You’ve left the comparison.' });
  });
}
