// Audit events for the travel features (writes only; reads aren't logged).
import { createAppEvent, levelFromStatusCode } from './events.js';
import { DOMAINS } from '../utils/responses/responses.js';

const actorId = (user) => (user && typeof user === 'object' ? user.id ?? null : null);

const mk = (domain) => async ({ user, action, id, detail, statusCode = 200, targetId }) => {
  const message = [action, id ? `id=${id}` : null, detail || null].filter(Boolean).join(' | ');
  await createAppEvent({
    level: levelFromStatusCode(statusCode),
    domain,
    action,
    message,
    statusCode,
    actorId: actorId(user),
    targetId: targetId ?? null,
  });
};

// e.g. createMapEvent({ user, action: 'Create Success', id: map.id, statusCode: 201 })
export const createMapEvent = mk(DOMAINS.maps);
export const createTripEvent = mk(DOMAINS.trips);
export const createPhotoEvent = mk(DOMAINS.photos);
export const createSharingEvent = mk(DOMAINS.sharing);
// Moments: ids and field names only, never a title, story or place name
export const createMomentEvent = mk(DOMAINS.moments);
// Country maps: ids and state codes only (never a pin's name, notes or position)
export const createCountryMapEvent = mk(DOMAINS.countryMaps);
// Plans, payments and complimentary memberships (never an email address or a reason text)
export const createBillingEvent = mk(DOMAINS.billing);
// Travel offers: ids and keys only (clicks are never events: OfferClickDaily counts them)
export const createOfferEvent = mk(DOMAINS.offers);
// Monthly photo themes: ids and months only
export const createThemeEvent = mk(DOMAINS.themes);
// Friends challenges: ids only, never a title or a name
export const createChallengeEvent = mk(DOMAINS.challenges);
// "Guess where I was" games and the flight log (23 Nov 2026)
export const createGuessGameEvent = mk(DOMAINS.guessGames);
export const createPhotoShowEvent = mk(DOMAINS.photoShows);
export const createFlightEvent = mk(DOMAINS.flights);
// Feedback (docs/API.md "Feedback"): ids, kinds and statuses only, never what was written
export const createFeedbackEvent = mk(DOMAINS.feedback);
