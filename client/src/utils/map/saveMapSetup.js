// Saves a map's set-up (name, group type, travellers) by working out what changed:
// PATCH the map, then add, update and remove travellers. Used by onboarding and by the
// map settings panel.
import { createTraveller, deleteTraveller, updateMap, updateTraveller } from '@/api/travelApi';

export const GROUP_TYPES = [
  { value: 'SOLO', label: 'Just me', hint: 'A solo traveller with their own map', minTravellers: 1 },
  { value: 'COUPLE', label: 'A couple', hint: 'Two of you, travelling together', minTravellers: 2 },
  { value: 'FAMILY', label: 'A family', hint: 'Everyone who comes on holiday', minTravellers: 2 },
];

export const minTravellersFor = (groupType) => GROUP_TYPES.find((g) => g.value === groupType)?.minTravellers || 1;

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

/** `original` is the map as loaded; `form` is { name, groupType, travellers: [{ id?, name, ... }] }. */
export async function saveMapSetup(mapId, original, form, { canRename = true } = {}) {
  if (canRename && (form.name.trim() !== original.name || form.groupType !== original.groupType)) {
    await updateMap(mapId, { name: form.name.trim(), groupType: form.groupType });
  }

  const kept = form.travellers.filter((t) => t.name.trim());
  // Add and update first, so the map is never left without a traveller
  for (const [i, t] of kept.entries()) {
    const body = travellerBody(t, i);
    if (!t.id) await createTraveller(mapId, body);
    else {
      const before = original.travellers.find((o) => o.id === t.id);
      if (!before || changed(before, body)) await updateTraveller(mapId, t.id, body);
    }
  }
  for (const before of original.travellers) {
    if (!kept.some((t) => t.id === before.id)) await deleteTraveller(mapId, before.id);
  }
}
