// Countries and landmarks: public reference data (reads only, not logged)
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { isCountryCode } from '../utils/travelValidation.js';
import { findAllCountries, findCountryByCode, findLandmarks } from '../domain/places.js';
import { badRequest, handler } from './helpers/travel.js';

// Seeded data changes only with a deploy
const cacheForAnHour = (res) => res.set('Cache-Control', 'public, max-age=3600');

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
