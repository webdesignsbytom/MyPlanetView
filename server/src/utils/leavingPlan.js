// What happens to an account's maps and photos when it's deleted (docs/API.md,
// "Leaving"). Pure: the routes and the deletion hook load the rows, these decide.
import { LEAVING_PLAN_TTL_MINUTES } from './constants/plans.js';

export const LEAVING_ACTIONS = Object.freeze(['TRANSFER', 'DELETE']);

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/**
 * Check a leaving plan against the maps the user owns now (`ownedMaps`:
 * `[{ id, memberIds }]`). Every owned map is listed exactly once, as TRANSFER (with
 * `toUserId`, someone on that map) or DELETE (no `toUserId`). `leavePhotos` is a
 * boolean, true when left out.
 * -> `{ value: { maps: [{ mapId, action, toUserId? }], leavePhotos } }` or `{ error: true }`
 */
export function parseLeavingPlan(body, ownedMaps) {
  if (!isPlainObject(body)) return { error: true };
  const { maps, leavePhotos = true } = body;
  if (!Array.isArray(maps) || typeof leavePhotos !== 'boolean') return { error: true };

  const owned = new Map(ownedMaps.map((m) => [m.id, new Set(m.memberIds)]));
  const seen = new Set();
  const out = [];
  for (const entry of maps) {
    if (!isPlainObject(entry) || typeof entry.mapId !== 'string') return { error: true };
    const members = owned.get(entry.mapId);
    if (!members || seen.has(entry.mapId) || !LEAVING_ACTIONS.includes(entry.action)) return { error: true };
    seen.add(entry.mapId);
    if (entry.action === 'TRANSFER') {
      if (typeof entry.toUserId !== 'string' || !members.has(entry.toUserId)) return { error: true };
      out.push({ mapId: entry.mapId, action: 'TRANSFER', toUserId: entry.toUserId });
    } else {
      if (entry.toUserId !== undefined && entry.toUserId !== null) return { error: true };
      out.push({ mapId: entry.mapId, action: 'DELETE' });
    }
  }
  if (seen.size !== owned.size) return { error: true };
  return { value: { maps: out, leavePhotos } };
}

/**
 * The stored plan, if it was saved within LEAVING_PLAN_TTL_MINUTES of `now`, else null
 * (the defaults apply). `profile` is `{ leavingPlan, leavingPlanAt }` or null.
 */
export function usableLeavingPlan(profile, now = new Date()) {
  const plan = profile?.leavingPlan;
  const savedAt = profile?.leavingPlanAt ? new Date(profile.leavingPlanAt).getTime() : NaN;
  if (!isPlainObject(plan) || !Array.isArray(plan.maps) || !Number.isFinite(savedAt)) return null;
  const age = new Date(now).getTime() - savedAt;
  if (age < 0 || age > LEAVING_PLAN_TTL_MINUTES * 60 * 1000) return null;
  return { maps: plan.maps, leavePhotos: plan.leavePhotos !== false };
}

/** The editor a map passes to by default: the longest-standing active one, else a deactivated one, else null. */
export const heirOf = (editors) => (editors.find((e) => e.user?.isActive !== false) ?? editors[0])?.userId ?? null;

/**
 * Who takes one map when its owner leaves: the plan's choice when there is one
 * (a TRANSFER to someone who is still on the map; DELETE), else the default (heirOf
 * its editors). `members` are the map's, longest-standing first, with `role`.
 * -> a user id, or null to delete the map
 */
export function heirFor(map, choice) {
  if (choice?.action === 'DELETE') return null;
  if (choice?.action === 'TRANSFER' && map.members.some((m) => m.userId === choice.toUserId)) return choice.toUserId;
  // A co-owner before an editor (19 Nov 2026): the map is theirs too
  return heirOf([...map.members.filter((m) => m.role === 'CO_OWNER'), ...map.members.filter((m) => m.role === 'EDITOR')]);
}
