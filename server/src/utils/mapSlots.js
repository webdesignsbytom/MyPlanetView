// Which of an owner's maps are active (docs/API.md, "Map limits"). Pure, like access.js.
//
// Every account has INCLUDED_MAPS map slot (its default map) plus one per extra map
// paid for. An owner's maps are active when they are:
// - the default map (`isDefault`), always;
// - in a transfer's grace period (`graceUntil` after now), whatever the slots;
// - one of the first `extraMapsPaid` other maps, oldest first (`createdAt`). Maps that
//   came by transfer (`graceUntil` set, now past) queue after the owner's own, so once
//   its grace ends a handed-over map is the one that needs paying for.
// Every other map is locked: viewable, shareable and editable, but it takes no new
// photos. Nothing is ever deleted for lack of payment.
import { INCLUDED_MAPS } from './constants/plans.js';

const time = (value) => (value instanceof Date ? value.getTime() : new Date(value).getTime());

export const inGrace = (map, now = new Date()) => Boolean(map?.graceUntil) && time(map.graceUntil) > time(now);

/**
 * `maps`: the owner's maps, `[{ id, isDefault, createdAt, graceUntil }]`.
 * -> `{ activeIds, lockedIds, slots, used, canCreate }`: `slots` is INCLUDED_MAPS plus
 * the paid extra maps; `used` counts the active maps (grace ones too); a new map fits
 * while `used < slots`.
 */
export function mapSlots({ maps = [], extraMapsPaid = 0, now = new Date() } = {}) {
  const paid = Math.max(0, Math.floor(Number(extraMapsPaid) || 0));
  const active = new Set();
  for (const map of maps) if (map.isDefault || inGrace(map, now)) active.add(map.id);

  // With no default map (briefly, after handing it over) the included slot goes to the
  // oldest map, as an extra map would
  const includedLeft = Math.max(0, INCLUDED_MAPS - maps.filter((m) => m.isDefault).length);
  const queue = maps
    .filter((m) => !active.has(m.id))
    .sort(
      (a, b) =>
        Number(Boolean(a.graceUntil)) - Number(Boolean(b.graceUntil)) ||
        time(a.createdAt) - time(b.createdAt) ||
        String(a.id).localeCompare(String(b.id))
    );
  for (const map of queue.slice(0, includedLeft + paid)) active.add(map.id);

  const slots = INCLUDED_MAPS + paid;
  return {
    activeIds: maps.filter((m) => active.has(m.id)).map((m) => m.id),
    lockedIds: maps.filter((m) => !active.has(m.id)).map((m) => m.id),
    slots,
    used: active.size,
    canCreate: active.size < slots,
  };
}

/** Is this map locked among its owner's maps? */
export const isMapLocked = (mapId, slots) => slots.lockedIds.includes(mapId);
