// The country collections (docs/API.md "Badges and goals"; 24 Nov 2026, the user's wish):
// bronze, silver and gold for a quarter, half and all of a place's landmarks stamped in the
// passport. The server counts them (server/src/utils/badges.js collectionProgress) and sends
// each tier as a badge of the group `collections`, with its `place` and `tier`; this file
// words them and gathers each place's tiers for the suitcase.
import { countryName } from '@/utils/map/countries';

export const COLLECTION_GROUP = 'collections';

// Lowest first, as the server sends them
export const COLLECTION_TIERS = ['bronze', 'silver', 'gold'];

export const COLLECTION_TIER_LABELS = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold' };

const KEY = /^collect-([A-Z]{2})-(bronze|silver|gold)$/;

/** `{ place, tier }` from a collection's key (`collect-IT-gold`), or null for any other key (the server's). */
export function parseCollectionKey(key) {
  const match = KEY.exec(String(key));
  return match ? { place: match[1], tier: match[2] } : null;
}

const SHARE = { bronze: 'A quarter of', silver: 'Half of', gold: 'Every one of' };

/** A collection tier's words: "Gold for Italy", and what it took. Null for any other key. */
export function collectionWords(key) {
  const parsed = parseCollectionKey(key);
  if (!parsed) return null;
  const name = countryName(parsed.place);
  return {
    name: `${COLLECTION_TIER_LABELS[parsed.tier]} for ${name}`,
    description: `${SHARE[parsed.tier]} ${name}’s landmarks stamped in the passport, by a photo or a “been here” tick.`,
  };
}

const earnedOf = (tier) => Boolean(tier.earnedAt || tier.earned);

/**
 * Each place's collection from the badges: `[{ place, name, tiers, have, total, best }]`.
 * `tiers` lowest first; `total` is the place's landmarks (the top tier's need), `have` how many
 * are stamped (the top tier's), `best` the highest tier earned (or null). The places with the
 * best medals come first, then the furthest along, then A to Z.
 */
export function collectionPlaces(badges) {
  const byPlace = new Map();
  for (const badge of badges || []) {
    if (badge.group !== COLLECTION_GROUP) continue;
    const parsed = parseCollectionKey(badge.key);
    const place = badge.place || parsed?.place;
    const tier = badge.tier || parsed?.tier;
    if (!place || !tier) continue;
    if (!byPlace.has(place)) byPlace.set(place, []);
    byPlace.get(place).push({ ...badge, place, tier });
  }
  const rank = (tier) => (tier ? COLLECTION_TIERS.indexOf(tier) : -1);
  return [...byPlace.entries()]
    .map(([place, list]) => {
      const tiers = list.sort((a, b) => rank(a.tier) - rank(b.tier));
      const top = tiers[tiers.length - 1];
      const earned = tiers.filter(earnedOf);
      return { place, name: countryName(place), tiers, have: top.have, total: top.need, best: earned.length ? earned[earned.length - 1].tier : null };
    })
    .sort((a, b) => rank(b.best) - rank(a.best) || b.have / b.total - a.have / a.total || a.name.localeCompare(b.name));
}
