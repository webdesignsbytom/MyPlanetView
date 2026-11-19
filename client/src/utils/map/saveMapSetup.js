// Saves a map's set-up (name, group type, the UK as its nations, travellers) by working out what changed:
// remove the travellers taken off, PATCH the map, then add and update travellers (so a
// family turning into a couple has two before it becomes one: the server refuses a kind
// with room for fewer travellers than the map has). Used by onboarding and by the map
// settings panel.
import { createTraveller, deleteTraveller, updateMap, updateTraveller } from '@/api/travelApi';
import { forgetMapLists } from './mapListCache';

// How many travellers each kind of map has (17 Nov 2026, the user's wish: a couple's map is
// two people). The most is the server's GROUP_MAX_TRAVELLERS (utils/travelValidation.js).
export const MAX_TRAVELLERS = 20;
export const GROUP_TYPES = [
  { value: 'SOLO', label: 'Just me', hint: 'A solo traveller with their own map', minTravellers: 1, maxTravellers: 1 },
  { value: 'COUPLE', label: 'A couple', hint: 'Two of you, travelling together', minTravellers: 2, maxTravellers: 2 },
  { value: 'FAMILY', label: 'A family', hint: 'Everyone who comes on holiday', minTravellers: 2, maxTravellers: MAX_TRAVELLERS },
];

export const minTravellersFor = (groupType) => GROUP_TYPES.find((g) => g.value === groupType)?.minTravellers || 1;
export const maxTravellersFor = (groupType) => GROUP_TYPES.find((g) => g.value === groupType)?.maxTravellers || MAX_TRAVELLERS;

const travellerBody = (t, position) => ({
  name: t.name.trim(),
  birthCountryCode: t.birthCountryCode || null,
  favouriteCountryCode: t.favouriteCountryCode || null,
  position,
});

const changed = (before, body) =>
  before.name !== body.name ||
  (before.birthCountryCode || null) !== body.birthCountryCode ||
  (before.favouriteCountryCode || null) !== body.favouriteCountryCode ||
  before.position !== body.position;

/**
 * `original` is the map as loaded; `form` is { name, groupType, splitUk, travellers: [{ id?, name, ... }] }.
 * Only the owner or a co-owner (`canRename`) changes the map itself; turning `splitUk` on or off moves the
 * map's UK data on the server (docs/API.md "The UK's nations").
 */
export async function saveMapSetup(mapId, original, form, { canRename = true } = {}) {
  const splitUk = Boolean(form.splitUk);
  const kept = form.travellers.filter((t) => t.name.trim());
  const removed = original.travellers.filter((before) => !kept.some((t) => t.id === before.id));
  // Those taken off go first, so a map becoming a smaller kind has room for it; but a map
  // keeping none of its old travellers keeps one until the last new one is added (the server
  // never lets a map go without a traveller)
  const keepsOne = kept.some((t) => t.id && original.travellers.some((o) => o.id === t.id));
  const later = keepsOne ? [] : removed.slice(-1);
  for (const before of removed) {
    if (!later.includes(before)) await deleteTraveller(mapId, before.id);
  }

  if (
    canRename &&
    (form.name.trim() !== original.name || form.groupType !== original.groupType || splitUk !== Boolean(original.splitUk))
  ) {
    await updateMap(mapId, { name: form.name.trim(), groupType: form.groupType, splitUk });
    forgetMapLists(); // the switcher lists maps by name
  }

  // The one kept back goes just before the last new traveller is added: the map never has
  // nobody, and never more than its kind has room for (a couple's map replacing both of its
  // travellers reached three, and the server said no; 19 Nov 2026, the audit). With only one
  // new traveller it would be the map's last, which the server never deletes: it becomes the
  // new person instead.
  let heldBackGone = !later.length;
  for (const [i, t] of kept.entries()) {
    const body = travellerBody(t, i);
    if (!heldBackGone && i === kept.length - 1) {
      heldBackGone = true;
      if (kept.length === 1 && !t.id) {
        await updateTraveller(mapId, later[0].id, body);
        continue;
      }
      for (const before of later) await deleteTraveller(mapId, before.id);
    }
    if (!t.id) await createTraveller(mapId, body);
    else {
      const before = original.travellers.find((o) => o.id === t.id);
      if (!before || changed(before, body)) await updateTraveller(mapId, t.id, body);
    }
  }
  if (!heldBackGone) for (const before of later) await deleteTraveller(mapId, before.id);
}
