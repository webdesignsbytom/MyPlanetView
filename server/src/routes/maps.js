import { Router } from 'express';
import {
  createMapHandler,
  createTravellerHandler,
  deleteMapHandler,
  deleteTravellerHandler,
  deleteVisitHandler,
  getMapHandler,
  getMapStatsHandler,
  getMyMapsHandler,
  makeMainMapHandler,
  upgradeMapHandler,
  downgradeMapHandler,
  putVisitHandler,
  quickFillVisitsHandler,
  transferMapHandler,
  updateMapHandler,
  updateTravellerHandler,
} from '../controllers/maps.js';
import { createTripHandler, getMapTripsHandler } from '../controllers/trips.js';
import { getYearRecapHandler } from '../controllers/recaps.js';
import {
  deleteDesignPictureHandler,
  presignDesignPictureHandler,
  saveDesignPictureHandler,
  updateMapDesignHandler,
} from '../controllers/mapDesigns.js';
import { createPhotoHandler, getMapPhotosHandler, presignPhotoHandler } from '../controllers/photos.js';
import { createMomentHandler, getMapMomentsHandler } from '../controllers/moments.js';
import {
  createPinHandler,
  deleteSubdivisionHandler,
  getPinsHandler,
  getSubdivisionsHandler,
  putSubdivisionHandler,
} from '../controllers/countryMaps.js';
import { saveVideoHandler, startVideoUploadHandler } from '../controllers/videos.js';
import {
  clearStampPhotoHandler,
  createGoalHandler,
  getBadgesHandler,
  getGoalsHandler,
  getPassportHandler,
  setStampPhotoHandler,
} from '../controllers/passport.js';
import { sharingHandlers } from '../controllers/sharing.js';
import {
  createCopyHandler,
  getCopyChoicesHandler,
  getMapCopiesHandler,
  previewCopyHandler,
} from '../controllers/travelCopies.js';
import { getMapThemeAlbumHandler, getMapThemesHandler } from '../controllers/themes.js';
import { requireVerifiedEmail as verified, validateAuthentication } from '../middleware/auth.js';
import { getCountryListsHandler } from '../controllers/countryLists.js';
import { createDbRateLimiter, keyByUserId } from '../middleware/dbRateLimit.js';
import {
  MAP_CREATE_DAILY_USER_LIMIT,
  MEMBER_INVITE_DAILY_USER_LIMIT,
  MEMBER_INVITE_RATE_LIMIT,
  IMPORT_PHOTO_PRESIGN_RATE_LIMIT,
  IMPORT_TRIPS_RATE_LIMIT,
  PHOTO_PRESIGN_RATE_LIMIT,
  TRAVEL_COPY_DAILY_USER_LIMIT,
} from '../utils/constants/rateLimitConstants.js';
import { getImportsHandler, importTripsHandler } from '../controllers/imports.js';
import { tickLandmarkHandler, untickLandmarkHandler } from '../controllers/landmarkVisits.js';
import { addAutoStringsHandler, addMapStringHandler, deleteAllMapStringsHandler, deleteMapStringHandler } from '../controllers/mapStrings.js';
import { createGuessGameHandler, getMapGuessGamesHandler } from '../controllers/guessGames.js';
import { addFlightsHandler, getMapFlightsHandler } from '../controllers/flights.js';

// Mounted at /api/maps. Everything needs a signed-in user; roles are checked per map.
// `verified`: adding or changing content needs a verified email address. Setting up the
// map (PATCH, travellers) doesn't, so the welcome page works straight after sign-up.
const router = Router();
const sharing = sharingHandlers('maps');
const everydayPresignLimiter = createDbRateLimiter(PHOTO_PRESIGN_RATE_LIMIT);
// An import's photos (an import key in the body) count apart, per user, with more room
const importPresignLimiter = createDbRateLimiter({ ...IMPORT_PHOTO_PRESIGN_RATE_LIMIT, keyFor: keyByUserId });
const photoPresignLimiter = (req, res, next) =>
  (typeof req.body?.importedFrom === 'string' ? importPresignLimiter : everydayPresignLimiter)(req, res, next);
const importTripsLimiter = createDbRateLimiter({ ...IMPORT_TRIPS_RATE_LIMIT, keyFor: keyByUserId });
const memberInviteLimiter = createDbRateLimiter(MEMBER_INVITE_RATE_LIMIT);
// Shared with the trips router (same name): one daily count per user for both
const memberInviteDailyLimiter = createDbRateLimiter({ ...MEMBER_INVITE_DAILY_USER_LIMIT, keyFor: keyByUserId });
// New maps a day, per user
const mapCreateDailyLimiter = createDbRateLimiter({ ...MAP_CREATE_DAILY_USER_LIMIT, keyFor: keyByUserId });
// Requests to copy your travels a day, per user (each emails the family map's owner)
const travelCopyDailyLimiter = createDbRateLimiter({ ...TRAVEL_COPY_DAILY_USER_LIMIT, keyFor: keyByUserId });

router.use(validateAuthentication);

// Maps
router.get('/', getMyMapsHandler);
router.post('/', verified, mapCreateDailyLimiter, createMapHandler);
router.get('/:mapId', getMapHandler);
router.patch('/:mapId', updateMapHandler);
router.delete('/:mapId', verified, deleteMapHandler);
router.get('/:mapId/stats', getMapStatsHandler);

// Importing from Polarsteps (docs/API.md "Importing from Polarsteps"): what's been imported,
// and the trips (photos and stories come through the routes below, with their keys)
router.get('/:mapId/imports/polarsteps', getImportsHandler);
router.post('/:mapId/imports/polarsteps', verified, importTripsLimiter, importTripsHandler);

// Collecting (docs/API.md "Collecting"): a landmark ticked "been here", or not
router.put('/:mapId/landmarks/:landmarkId/been', verified, tickLandmarkHandler);
router.delete('/:mapId/landmarks/:landmarkId/been', verified, untickLandmarkHandler);
// Strings between places (docs/API.md "Strings"): tie one, the automatic ones, untie one or all
router.post('/:mapId/strings', verified, addMapStringHandler);
router.post('/:mapId/strings/auto', verified, addAutoStringsHandler);
router.delete('/:mapId/strings/:stringId', verified, deleteMapStringHandler);
router.delete('/:mapId/strings', verified, deleteAllMapStringsHandler);
// Its year in travel (docs/API.md "Year in travel"): anyone on the map
router.get('/:mapId/recap/:year', getYearRecapHandler);
// "Guess where I was" games made from its photos (docs/API.md "Guess where I was"): editors
router.get('/:mapId/guess-games', getMapGuessGamesHandler);
router.post('/:mapId/guess-games', verified, createGuessGameHandler);
// Its flight log (docs/API.md "Flights"): anyone on the map reads it, editors add flights
router.get('/:mapId/flights', getMapFlightsHandler);
router.post('/:mapId/flights', verified, addFlightsHandler);

// Its own design (docs/API.md "Map designs"): colours like the map's settings (no verified
// email needed); a picture upload as an avatar (verified), removing it not
router.patch('/:mapId/design', updateMapDesignHandler);
router.post('/:mapId/design/picture/presign', verified, presignDesignPictureHandler);
router.put('/:mapId/design/picture', verified, saveDesignPictureHandler);
router.delete('/:mapId/design/picture', deleteDesignPictureHandler);
// Owner only: the included (main) map, and handing a map to someone on it
router.post('/:mapId/main', verified, makeMainMapHandler);
// Put a map on the owner's plan (a paid extra map's slot), or take it back (19 Nov 2026)
router.post('/:mapId/upgrade', verified, upgradeMapHandler);
router.delete('/:mapId/upgrade', verified, downgradeMapHandler);
// Counts as making a map: handing over your main map makes you a new one (17 Nov 2026)
router.post('/:mapId/transfer', verified, mapCreateDailyLimiter, transferMapHandler);

// Travellers
router.post('/:mapId/travellers', createTravellerHandler);
router.patch('/:mapId/travellers/:travellerId', updateTravellerHandler);
router.delete('/:mapId/travellers/:travellerId', deleteTravellerHandler);

// Countries visited
// Ticking several countries at once: like setting the map up, no verified email needed (a new
// account's map offers it before the address is verified)
router.post('/:mapId/visits/quick-fill', quickFillVisitsHandler);
router.put('/:mapId/visits/:countryCode', verified, putVisitHandler);
router.delete('/:mapId/visits/:countryCode', verified, deleteVisitHandler);

// Trips on the map
router.get('/:mapId/trips', getMapTripsHandler);
router.post('/:mapId/trips', verified, createTripHandler);

// Photos on the map
router.post('/:mapId/photos/presign', verified, photoPresignLimiter, presignPhotoHandler);
router.post('/:mapId/photos', verified, createPhotoHandler);
router.get('/:mapId/photos', getMapPhotosHandler);
// Every country ticket's first pages of photos and moments, in one reply (the map's loading screen)
router.get('/:mapId/country-lists', getCountryListsHandler);

// First Class videos (Cloudflare Stream; docs/API.md "Videos"): start the upload, then save it
router.post('/:mapId/videos/upload', verified, photoPresignLimiter, startVideoUploadHandler);
router.post('/:mapId/videos', verified, saveVideoHandler);

// Moments on the map (a trip editor may add one on their trip: tripId in the body)
router.get('/:mapId/moments', getMapMomentsHandler);
router.post('/:mapId/moments', verified, createMomentHandler);

// Country maps (docs/API.md "Country maps"): one country's states visited (?country=US),
// and its pins (each pin's own routes are /api/pins)
router.get('/:mapId/subdivisions', getSubdivisionsHandler);
router.put('/:mapId/subdivisions/:code', verified, putSubdivisionHandler);
router.delete('/:mapId/subdivisions/:code', verified, deleteSubdivisionHandler);
router.get('/:mapId/pins', getPinsHandler);
router.post('/:mapId/pins', verified, createPinHandler);

// The passport, badges and goals (badges and goals are awarded as the owner or an editor
// loads them; docs/API.md, "Badges and goals")
router.get('/:mapId/passport', getPassportHandler);
router.put('/:mapId/passport/stamps/:landmarkId/photo', verified, setStampPhotoHandler);
router.delete('/:mapId/passport/stamps/:landmarkId/photo', verified, clearStampPhotoHandler);
router.get('/:mapId/badges', getBadgesHandler);
router.get('/:mapId/goals', getGoalsHandler);
router.post('/:mapId/goals', verified, createGoalHandler);

// Monthly photo themes: the map's albums (docs/API.md, "Photo themes")
router.get('/:mapId/themes', getMapThemesHandler);
router.get('/:mapId/themes/:themeId/photos', getMapThemeAlbumHandler);

// Taking your travels with you (docs/API.md "Travel copies"): on the family map, what a
// traveller can take, what it comes to on their own map, and asking for it; on any map, the
// requests to copy from it and onto it (its owner and co-owners)
router.get('/:mapId/travel-copy-choices', getCopyChoicesHandler);
router.post('/:mapId/travel-copies/preview', verified, previewCopyHandler);
router.post('/:mapId/travel-copies', verified, travelCopyDailyLimiter, createCopyHandler);
router.get('/:mapId/travel-copies', getMapCopiesHandler);

// Sharing
router.get('/:id/sharing', sharing.get);
router.patch('/:id/sharing', verified, sharing.update);
router.post('/:id/sharing/reset-link', verified, sharing.resetLink);
router.post('/:id/members', verified, memberInviteLimiter, memberInviteDailyLimiter, sharing.addMember);
router.patch('/:id/members/:userId', verified, sharing.updateMember);
router.delete('/:id/members/:userId', verified, sharing.removeMember);
router.delete('/:id/invites/:inviteId', verified, sharing.deleteInvite);

export default router;
