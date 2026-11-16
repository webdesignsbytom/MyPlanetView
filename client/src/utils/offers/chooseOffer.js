// Choosing the travel offer for a slot (docs/API.md, "Travel offers": "Choosing a card").
// The client gets every live offer once (GET /offers) and picks here, so nothing about the
// viewer is ever sent to choose one. Pure, with no imports: the same in every browser and
// under Node.
//
// Among the offers for the slot's placement, the first group that has any wins:
//   1. 'trip':    a planned trip on this map with future dates: its destination's country;
//   2. 'country': the country being viewed;
//   3. 'around':  the country of the photos around the slot;
//   4. 'general': the offers with no country (insurance, eSIMs, luggage).
// Within the group, one is picked by `weight`, the same way for the same slot every time:
// the pick is seeded from the slot's key (its gallery and number), never Math.random, so
// a page draws the same card on every render and every visit.

/** The offers that may go in a placement (GALLERY, SLIDESHOW, COUNTRY_PAGE, TRAVEL_DESK). */
export const offersForPlacement = (offers, placement) =>
  (offers || []).filter((offer) => Array.isArray(offer.placements) && offer.placements.includes(placement));

// FNV-1a, then MurmurHash3's finaliser so slot keys that differ by one character land far apart
export function slotHash(text) {
  let h = 0x811c9dc5;
  const value = String(text);
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

const byId = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const weightOf = (offer) => Math.max(1, Math.floor(Number(offer.weight) || 1));

/** One of `list`, chosen by weight (an offer of weight 3 three times as often as one of 1), the same for the same `seed`. */
export function pickByWeight(list, seed) {
  if (!list?.length) return null;
  // In a fixed order, so the server's order of the list never changes the pick
  const sorted = [...list].sort(byId);
  const total = sorted.reduce((sum, offer) => sum + weightOf(offer), 0);
  let ticket = slotHash(seed) % total;
  for (const offer of sorted) {
    const weight = weightOf(offer);
    if (ticket < weight) return offer;
    ticket -= weight;
  }
  return sorted[sorted.length - 1];
}

/**
 * The groups a slot draws from, best first, each with at least one offer:
 * `[{ source: 'trip'|'country'|'around'|'general', countryCode, offers }]`.
 * `context`: `{ placement, tripCountry, country, aroundCountry }` (any may be null).
 */
export function offerGroups(offers, { placement, tripCountry = null, country = null, aroundCountry = null }) {
  const fitting = offersForPlacement(offers, placement);
  const groups = [];
  const add = (source, countryCode, list) => {
    if (list.length) groups.push({ source, countryCode, offers: list });
  };
  if (tripCountry) add('trip', tripCountry, fitting.filter((o) => o.countryCode === tripCountry));
  if (country) add('country', country, fitting.filter((o) => o.countryCode === country));
  if (aroundCountry) add('around', aroundCountry, fitting.filter((o) => o.countryCode === aroundCountry));
  add('general', null, fitting.filter((o) => !o.countryCode));
  return groups;
}

/**
 * The offer for one slot, or null when none fits: `{ offer, source, countryCode }`.
 * `slotKey` names the slot ("trip:<id>#0"). `avoidIds`: offers already shown beside it
 * (a group with nothing else falls through to the next); `otherKindsThan`: kinds already
 * shown, avoided when the group has another kind.
 */
export function chooseOffer(offers, context, slotKey, { avoidIds = [], otherKindsThan = [] } = {}) {
  for (const group of offerGroups(offers, context)) {
    let left = group.offers.filter((o) => !avoidIds.includes(o.id));
    if (!left.length) continue;
    const otherKinds = left.filter((o) => !otherKindsThan.includes(o.kind));
    if (otherKinds.length) left = otherKinds;
    return { offer: pickByWeight(left, slotKey), source: group.source, countryCode: group.countryCode };
  }
  return null;
}

/** Up to `count` different offers for slots side by side (a country page's two), each of another kind where it can be. */
export function chooseOffers(offers, context, slotKey, count) {
  const chosen = [];
  for (let slot = 0; slot < count; slot++) {
    const choice = chooseOffer(offers, context, `${slotKey}#${slot}`, {
      avoidIds: chosen.map((c) => c.offer.id),
      otherKindsThan: chosen.map((c) => c.offer.kind),
    });
    if (!choice) break;
    chosen.push(choice);
  }
  return chosen;
}

/**
 * The country most of `photos` are in, or null. List them nearest the slot first: a tie
 * goes to the country nearer the slot.
 */
export function mostCommonCountry(photos) {
  // A Map keeps the order codes were first seen in: nearest first
  const counts = new Map();
  for (const photo of photos || []) {
    const code = photo?.countryCode;
    if (code) counts.set(code, (counts.get(code) || 0) + 1);
  }
  let best = null;
  for (const [code, count] of counts) if (!best || count > counts.get(best)) best = code;
  return best;
}
