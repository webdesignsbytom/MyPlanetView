// Mock mode only: badges and goals (docs/API.md, "Badges and goals"), as the server's
// controllers/passport.js and controllers/shared.js answer them. Reads are for anyone who
// can view the map; the owner and editors award badges and goals as they load (and so
// change the store on a GET). Changing goals needs editor on the map, and a verified
// email address (mockAdapter.js NEEDS_VERIFIED_EMAIL), checked first.
import { deny, fail, ok, route } from '../mockAdapter';
import { getDb, me, newId, normaliseShareCode, saveStore } from '../store';
import { atLeast, higherRole, mapRole } from '../views';
import { GOALS_PER_MAP } from '@/utils/achievements/goals';
import { GOAL_MESSAGES, changesWhatsAsked, mapBadges, mapGoals, oneGoalView, parseGoalInput } from '../achievements';
import { MOMENT_MESSAGES } from '../moments';
import { mapBadgeStory } from '../badgeStories';

const SHARE_NOT_FOUND = 'This link has expired or was never shared with you.';

const findMap = (id) => getDb().maps.find((m) => m.id === id) || null;

/** A share link's map and role (the caller's own, else VIEWER with link access on); a trip's link has none. */
function sharedMap(code) {
  const normal = normaliseShareCode(code);
  const map = normal ? getDb().maps.find((m) => m.shareCode === normal) : null;
  const role = map ? higherRole(mapRole(map), map.linkAccess === 'ANYONE_WITH_LINK' ? 'VIEWER' : null) : null;
  return role ? { map, role } : null;
}

// Awarding writes to the store, which the adapter only saves after a write
const answer = (result, changed) => {
  if (changed) saveStore();
  return ok(result);
};
const badgesFor = (map, role) => {
  const result = mapBadges(map.id, { award: atLeast(role, 'EDITOR') });
  return answer(result, result.newlyEarned.length > 0);
};
// What earned a badge (the server's sendBadgeStory): never awards; `?traveller=` one person's
const storyFor = (map, role, key, query = {}) => {
  const traveller = query.traveller;
  const result = mapBadgeStory(map.id, String(key), {
    includeHidden: atLeast(role, 'EDITOR'),
    ...(traveller ? { travellerId: String(traveller) } : {}),
  });
  if (result.badgeNotFound) return fail(404, "That badge doesn't exist.");
  if (result.travellerNotFound) return fail(404, "That traveller isn't on this map.");
  return ok({ story: result.story });
};
const goalsFor = (map, role) => {
  const result = mapGoals(map.id, { award: atLeast(role, 'EDITOR') });
  return answer(result, result.newlyAchieved.length > 0);
};

/** `{ goal }` on a map the caller can edit; else `{ reply }` (404 without a role, 403 below editor). */
function editableGoal(goalId) {
  const goal = getDb().goals.find((g) => g.id === goalId) || null;
  const role = goal ? mapRole(findMap(goal.mapId)) : null;
  const denied = deny(role, 'EDITOR', GOAL_MESSAGES.notFound);
  return denied ? { reply: denied } : { goal };
}

export function registerAchievementRoutes() {
  route('GET', '/api/maps/:mapId/badges', ({ params }) => {
    const map = findMap(params.mapId);
    const role = mapRole(map);
    return deny(role, 'VIEWER', MOMENT_MESSAGES.mapNotFound) || badgesFor(map, role);
  });

  route('GET', '/api/maps/:mapId/badges/:badgeKey', ({ params, query }) => {
    const map = findMap(params.mapId);
    const role = mapRole(map);
    return deny(role, 'VIEWER', MOMENT_MESSAGES.mapNotFound) || storyFor(map, role, params.badgeKey, query);
  });

  route('GET', '/api/maps/:mapId/goals', ({ params }) => {
    const map = findMap(params.mapId);
    const role = mapRole(map);
    return deny(role, 'VIEWER', MOMENT_MESSAGES.mapNotFound) || goalsFor(map, role);
  });

  route('POST', '/api/maps/:mapId/goals', ({ params, body }) => {
    const db = getDb();
    const map = findMap(params.mapId);
    const denied = deny(mapRole(map), 'EDITOR', MOMENT_MESSAGES.mapNotFound);
    if (denied) return denied;
    const parsed = parseGoalInput(body);
    if (!parsed.ok) return fail(400, GOAL_MESSAGES.invalid);
    if (db.goals.filter((g) => g.mapId === map.id).length >= GOALS_PER_MAP) return fail(409, GOAL_MESSAGES.full);
    const now = new Date().toISOString();
    const goal = {
      id: newId(),
      mapId: map.id,
      title: null,
      target: null,
      countryCodes: [],
      region: null,
      deadline: null,
      achievedAt: null,
      ...parsed.data,
      createdById: me().id,
      createdAt: now,
      updatedAt: now,
    };
    db.goals.push(goal);
    return ok({ goal: oneGoalView(goal) }, 201);
  });

  // A change to what's asked (target, countries, region, deadline) clears achievedAt: the
  // goal has to be met again
  route('PATCH', '/api/goals/:goalId', ({ params, body }) => {
    const { goal, reply } = editableGoal(params.goalId);
    if (reply) return reply;
    const parsed = parseGoalInput(body, { existing: goal });
    if (!parsed.ok) return fail(400, GOAL_MESSAGES.invalid);
    const data = { ...parsed.data, ...(changesWhatsAsked(parsed.data) ? { achievedAt: null } : {}) };
    if (Object.keys(data).length) Object.assign(goal, data, { updatedAt: new Date().toISOString() });
    return ok({ goal: oneGoalView(goal) });
  });

  route('DELETE', '/api/goals/:goalId', ({ params }) => {
    const db = getDb();
    const { goal, reply } = editableGoal(params.goalId);
    if (reply) return reply;
    db.goals = db.goals.filter((g) => g.id !== goal.id);
    return ok({ message: 'Goal deleted.' });
  });

  // Through a map's share link (a trip's link has none: 404). A member who edits the map
  // still awards, as on the map's own routes.
  route('GET', '/api/shared/:code/badges', ({ params }) => {
    const shared = sharedMap(params.code);
    return shared ? badgesFor(shared.map, shared.role) : fail(404, SHARE_NOT_FOUND);
  });

  route('GET', '/api/shared/:code/badges/:badgeKey', ({ params, query }) => {
    const shared = sharedMap(params.code);
    return shared ? storyFor(shared.map, shared.role, params.badgeKey, query) : fail(404, SHARE_NOT_FOUND);
  });

  route('GET', '/api/shared/:code/goals', ({ params }) => {
    const shared = sharedMap(params.code);
    return shared ? goalsFor(shared.map, shared.role) : fail(404, SHARE_NOT_FOUND);
  });
}
