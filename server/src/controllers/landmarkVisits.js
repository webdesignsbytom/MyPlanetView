// Collecting landmarks (docs/API.md "Collecting"; 21 Nov 2026, the user's wish): an editor
// ticks a landmark "been here" when there's no photo to stamp the passport with. The checklist
// (and "23 of 1,273 World Heritage Sites") counts a tick or a stamp; ticking marks the
// landmark's place visited. Everyone who can see the map sees the ticks (its reply's
// `tickedLandmarkIds`).
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createMapEvent } from '../event/travelUtils.js';
import { canEdit } from '../utils/access.js';
import { isUuid } from '../utils/travelValidation.js';
import { landmarkPlace } from '../utils/ukNations.js';
import { findLandmarkById } from '../domain/places.js';
import { tickLandmarkInDB, untickLandmarkInDB } from '../domain/landmarkVisits.js';
import { denyUnless, handler, loadMap, notFound } from './helpers/travel.js';

const D = DOMAINS.maps;

async function load(req, res) {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canEdit, EVENT_MESSAGES.mapNotFound)) return null;
  const landmark = isUuid(req.params.landmarkId) ? await findLandmarkById(req.params.landmarkId) : null;
  if (!landmark) {
    notFound(req, res, D, EVENT_MESSAGES.landmarkNotFound);
    return null;
  }
  return { map, landmark };
}

// PUT /maps/:mapId/landmarks/:landmarkId/been -> { landmarkId, been: true, countryCode }
export const tickLandmarkHandler = handler(D, 'Tick landmark', async (req, res) => {
  const found = await load(req, res);
  if (!found) return undefined;
  const { map, landmark } = found;
  const place = landmarkPlace(landmark, Boolean(map.splitUk));
  await tickLandmarkInDB({ mapId: map.id, landmarkId: landmark.id, userId: req.user.id, place });
  logEvent(createMapEvent({ user: req.user, action: 'Landmark Ticked', id: map.id, detail: `landmark=${landmark.id}`, statusCode: 200 }));
  return sendDataResponse(res, 200, { landmarkId: landmark.id, been: true, countryCode: place });
});

// DELETE /maps/:mapId/landmarks/:landmarkId/been -> { landmarkId, been: false }
export const untickLandmarkHandler = handler(D, 'Untick landmark', async (req, res) => {
  const found = await load(req, res);
  if (!found) return undefined;
  await untickLandmarkInDB(found.map.id, found.landmark.id);
  return sendDataResponse(res, 200, { landmarkId: found.landmark.id, been: false });
});
