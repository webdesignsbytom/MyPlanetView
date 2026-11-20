// Every country ticket's first pages in one reply, as the server's controllers/countryLists.js
// (docs/API.md "Country lists"): each page the photo and moment lists' own (views.js
// photoPage, moments.js momentPage), so their rules hold.
import { photoPage } from './views';
import { momentPage } from './moments';

const CODES_MAX = 300;

// 'FR,IT' -> ['FR', 'IT']; [] for none; null when it isn't a list of codes
function codeList(value) {
  if (value === undefined || value === '') return [];
  if (typeof value !== 'string') return null;
  const codes = [...new Set(value.split(','))];
  if (codes.length > CODES_MAX || codes.some((code) => !/^[A-Z]{2}$/.test(code))) return null;
  return codes;
}

/**
 * `photos`: the map's photos (the store's rows), `role` the caller's; `mapId` and
 * `photoAccess` as momentPage takes them. -> `{ photos, moments }`, or `{ error, status? }`
 */
export function countryListPages({ query, photos, role, mapId, photoAccess }) {
  const photoCodes = codeList(query.photos);
  const momentCodes = codeList(query.moments);
  if (!photoCodes || !momentCodes) return { error: 'Malformed data.' };
  const out = { photos: {}, moments: {} };
  for (const code of photoCodes) {
    const page = photoPage(photos, role, { limit: query.limit, display: query.display, country: code }, { allowBest: false });
    if (page.error) return page;
    out.photos[code] = page;
  }
  for (const code of momentCodes) {
    const page = momentPage({ query: { limit: query.momentLimit, country: code }, mapId, role, photoAccess });
    if (page.error) return page;
    out.moments[code] = page;
  }
  return out;
}
