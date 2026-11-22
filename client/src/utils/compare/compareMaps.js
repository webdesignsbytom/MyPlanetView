// Comparing two maps (22 Nov 2026, the user's wish, from "what else can we do to compete"):
// the countries both have been to, only one, only the other, and those both want to go to.
// Only maps the person can already open (their own, ones shared with them, a share link),
// so nothing new is seen. Pure.
import { countsAsVisited } from '@/utils/map/visitStatus';
import { countryOf } from '@/utils/map/ukNations';
import { countryName } from '@/utils/map/countries';

// The places a map's visits mark one way, as countries: a UK nation is the UK and a region its
// country, so a map that splits the UK compares with one that doesn't
const placesOf = (visits, keep) => new Set((visits || []).filter((v) => keep(v.status)).map((v) => countryOf(v.countryCode)));
const byName = (a, b) => countryName(a).localeCompare(countryName(b));

/** `{ both, onlyA, onlyB, bothWant }`, each a list of codes A to Z by name. */
export function compareMaps(visitsA, visitsB) {
  const a = placesOf(visitsA, countsAsVisited);
  const b = placesOf(visitsB, countsAsVisited);
  const wantA = placesOf(visitsA, (status) => status === 'WANT_TO_GO');
  const wantB = placesOf(visitsB, (status) => status === 'WANT_TO_GO');
  return {
    both: [...a].filter((code) => b.has(code)).sort(byName),
    onlyA: [...a].filter((code) => !b.has(code)).sort(byName),
    onlyB: [...b].filter((code) => !a.has(code)).sort(byName),
    // Neither has been yet: a trip to plan together
    bothWant: [...wantA].filter((code) => wantB.has(code) && !a.has(code) && !b.has(code)).sort(byName),
  };
}

/** A share link or code as typed ("https://…/shared/K7QX-M2PA-9RTW", "k7qx m2pa 9rtw") → the code, or ''. */
export function shareCodeFrom(text) {
  const value = String(text || '').trim();
  const fromLink = value.match(/\/shared\/([^/?#\s]+)/);
  return (fromLink ? decodeURIComponent(fromLink[1]) : value).replace(/\s+/g, '');
}
