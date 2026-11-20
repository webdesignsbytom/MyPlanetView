// Every country ticket's first page of photos and of moments, in one reply (docs/API.md
// "Country lists"; 19 Nov 2026, the audit). The map page fetches them all behind its loading
// screen (the user's wish, 17 Nov 2026: no spinner in a ticket), which took a request per
// country with photos and per country with moments: about a hundred on a well-travelled map,
// six at a time, every one counted against the rate limits (a share link's browse limit
// too). Each page is the list routes' own (photoPage, momentPage), so every access rule is
// theirs: hidden photos and moments, videos still converting, never GPS or best copies.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { canView } from '../utils/access.js';
import { badRequest, handler, loadMap, notFound } from './helpers/travel.js';
import { photoPage } from './photos.js';
import { momentPage } from './moments.js';

const D = DOMAINS.maps;
// More than every place on a map (countries, special places, the UK's nations, regions)
const CODES_MAX = 300;
// Pages built at a time (each is a query or two)
const AT_ONCE = 4;

// 'FR,IT' -> ['FR', 'IT'] (each once); [] for none; null when it isn't a list of codes
function codeList(value) {
  if (value === undefined || value === '') return [];
  if (typeof value !== 'string') return null;
  const codes = [...new Set(value.split(','))];
  if (codes.length > CODES_MAX || codes.some((code) => !/^[A-Z]{2}$/.test(code))) return null;
  return codes;
}

async function eachAtOnce(items, build) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await build(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(AT_ONCE, items.length) }, worker));
  return out;
}

/**
 * `query`: `photos` and `moments` (comma-separated country codes), `limit` and `display` (as
 * the photo list's), `momentLimit` (as the moment list's `limit`).
 * -> `{ photos: { [code]: { photos, nextCursor } }, moments: { [code]: { moments, nextCursor } } }`,
 * or `{ error }`
 */
export async function countryListPages({ query, mapId, role, photoAccess }) {
  const photoCodes = codeList(query.photos);
  const momentCodes = codeList(query.moments);
  if (!photoCodes || !momentCodes) return { error: EVENT_MESSAGES.malformedData };
  const photoQuery = { limit: query.limit, display: query.display };
  const photoPages = await eachAtOnce(photoCodes, (country) => photoPage({ query: { ...photoQuery, country }, mapId, role, allowBest: false }));
  const momentPages = await eachAtOnce(momentCodes, (country) => momentPage({ query: { limit: query.momentLimit, country }, mapId, role, photoAccess }));
  const failed = [...photoPages, ...momentPages].find((page) => page.error || page.forbidden);
  if (failed) return { error: failed.error ?? EVENT_MESSAGES.malformedData };
  return {
    photos: Object.fromEntries(photoCodes.map((code, i) => [code, photoPages[i]])),
    moments: Object.fromEntries(momentCodes.map((code, i) => [code, momentPages[i]])),
  };
}

export const getCountryListsHandler = handler(D, 'Get country lists', async (req, res) => {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (!canView(role)) return notFound(req, res, D, EVENT_MESSAGES.mapNotFound);
  const result = await countryListPages({ query: req.query || {}, mapId: map.id, role, photoAccess: { mapRole: role, trip: null } });
  if (result.error) return badRequest(req, res, D, result.error);
  return sendDataResponse(res, 200, result);
});
