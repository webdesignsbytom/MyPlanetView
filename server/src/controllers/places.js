// Countries and landmarks: public reference data (reads only, not logged)
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { isCountryCode } from '../utils/travelValidation.js';
import { findAllCountries, findCountryByCode, findLandmarks } from '../domain/places.js';
import { badRequest, handler } from './helpers/travel.js';

// Seeded data, changed only by a deploy or `npm run db:reference`, the same for everyone.
// Browsers keep it an hour. Vercel's CDN keeps it an hour too (s-maxage, which it strips
// before the browser sees it) and may serve it a day past that while it refreshes.
// The reply carries Access-Control-Allow-Origin for the caller's origin, so the CDN
// must keep one copy per Origin: Vary: Origin is set here on every reply, also when
// cors() adds none (a refused origin), so no copy without it can be served to the site.
export const REFERENCE_CACHE_CONTROL = 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400';
const cacheForAnHour = (res) => {
  res.set('Cache-Control', REFERENCE_CACHE_CONTROL);
  res.vary('Origin');
};

export const getCountriesHandler = handler(DOMAINS.places, 'Get countries', async (req, res) => {
  const countries = await findAllCountries();
  cacheForAnHour(res);
  return sendDataResponse(res, 200, { countries });
});

export const getLandmarksHandler = handler(DOMAINS.places, 'Get landmarks', async (req, res) => {
  const { country } = req.query || {};
  if (country !== undefined) {
    if (!isCountryCode(country) || !(await findCountryByCode(country))) {
      return badRequest(req, res, DOMAINS.places, EVENT_MESSAGES.countryNotFound);
    }
  }
  const landmarks = await findLandmarks({ countryCode: country });
  cacheForAnHour(res);
  return sendDataResponse(res, 200, { landmarks });
});
