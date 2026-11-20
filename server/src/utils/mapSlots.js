// Which of an owner's maps run on their plan, which on Economy, and which are locked
// (docs/API.md, "Map limits"). Pure, like access.js.
//
// Every account owns FREE_MAPS maps without paying (19 Nov 2026, the user's wish; it was 1):
// its main map on its plan (INCLUDED_MAPS), and FREE_ECONOMY_MAPS more on Economy's limits.
// Each extra map paid for is one more map on the plan. An owner's maps are:
// - on the plan (`PLAN`): the default map, always; any in a transfer's grace period
//   (`graceUntil` after now), whatever the slots; then the first `extraMapsPaid` others. The
//   maps the owner chose to upgrade (`upgradedAt`, POST /maps/:mapId/upgrade) come first, in
//   the order they were chosen; then the rest oldest first (`createdAt`), maps that came by
//   transfer (`graceUntil` set, now past) after the owner's own;
// - on Economy (`ECONOMY`): the next FREE_ECONOMY_MAPS, in the same order;
// - locked (`LOCKED`): any more (after a payment stops, or a map handed over to someone who
//   already has their maps): viewable, shareable and editable, but no new photos. Nothing is
//   ever deleted for lack of payment.
import { FREE_ECONOMY_MAPS, INCLUDED_MAPS } from './constants/plans.js';

const time = (value) => (value instanceof Date ? value.getTime() : new Date(value).getTime());

export const inGrace = (map, now = new Date()) => Boolean(map?.graceUntil) && time(map.graceUntil) > time(now);

export const MAP_TIERS = Object.freeze({ PLAN: 'PLAN', ECONOMY: 'ECONOMY', LOCKED: 'LOCKED' });

// Chosen upgrades first (oldest choice first), then own maps before transferred ones, oldest first
const byQueue = (a, b) =>
  Number(!a.upgradedAt) - Number(!b.upgradedAt) ||
  (a.upgradedAt && b.upgradedAt ? time(a.upgradedAt) - time(b.upgradedAt) : 0) ||
  Number(Boolean(a.graceUntil)) - Number(Boolean(b.graceUntil)) ||
  time(a.createdAt) - time(b.createdAt) ||
  String(a.id).localeCompare(String(b.id));

/**
 * `maps`: the owner's maps, `[{ id, isDefault, createdAt, graceUntil, upgradedAt? }]`.
 * -> `{ planIds, economyIds, lockedIds, activeIds, tiers, slots, used, canCreate }`:
 * `tiers` maps each id to PLAN, ECONOMY or LOCKED; `activeIds` are the ones not locked;
 * `slots` is INCLUDED_MAPS plus the paid extra maps (the maps on the plan); `used` counts the
 * maps on the plan (grace ones too); a new map fits (`canCreate`) while fewer than
 * `slots + FREE_ECONOMY_MAPS` maps are active.
 */
export function mapSlots({ maps = [], extraMapsPaid = 0, now = new Date() } = {}) {
  const paid = Math.max(0, Math.floor(Number(extraMapsPaid) || 0));
  const onPlan = new Set();
  for (const map of maps) if (map.isDefault || inGrace(map, now)) onPlan.add(map.id);

  // With no default map (briefly, after handing it over) the included slot goes to the
  // first map in the queue, as an extra map would
  const includedLeft = Math.max(0, INCLUDED_MAPS - maps.filter((m) => m.isDefault).length);
  const queue = maps.filter((m) => !onPlan.has(m.id)).sort(byQueue);
  const planned = queue.slice(0, includedLeft + paid);
  for (const map of planned) onPlan.add(map.id);
  const rest = queue.slice(planned.length).sort((a, b) => byQueue({ ...a, upgradedAt: null }, { ...b, upgradedAt: null }));
  const onEconomy = new Set(rest.slice(0, FREE_ECONOMY_MAPS).map((m) => m.id));

  const tierOf = (id) => (onPlan.has(id) ? MAP_TIERS.PLAN : onEconomy.has(id) ? MAP_TIERS.ECONOMY : MAP_TIERS.LOCKED);
  const slots = INCLUDED_MAPS + paid;
  return {
    planIds: maps.filter((m) => onPlan.has(m.id)).map((m) => m.id),
    economyIds: maps.filter((m) => onEconomy.has(m.id)).map((m) => m.id),
    lockedIds: maps.filter((m) => tierOf(m.id) === MAP_TIERS.LOCKED).map((m) => m.id),
    activeIds: maps.filter((m) => tierOf(m.id) !== MAP_TIERS.LOCKED).map((m) => m.id),
    tiers: Object.fromEntries(maps.map((m) => [m.id, tierOf(m.id)])),
    slots,
    freeEconomyMaps: FREE_ECONOMY_MAPS,
    used: onPlan.size,
    canCreate: onPlan.size + onEconomy.size < slots + FREE_ECONOMY_MAPS,
  };
}

/** Is this map locked among its owner's maps? */
export const isMapLocked = (mapId, slots) => slots.lockedIds.includes(mapId);
