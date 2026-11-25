// A map's own design (docs/API.md "Map designs"; 21 Nov 2026): its colours, and the sea's
// picture, one design per map style (22 Nov 2026, the user's wish), shown while the map is in
// that style. The owner and co-owners change them; everyone who can open the map sees them
// (the map's reply carries them, share links' too). Free on every plan, locked maps included.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse, sendMessageResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createMapEvent } from '../event/travelUtils.js';
import { canManage } from '../utils/access.js';
import { MAP_STYLES } from '../utils/mapSettings.js';
import {
  DESIGN_PICTURE_MAX_BYTES,
  DESIGN_PICTURE_SAVE_WINDOW_MINUTES,
  DESIGN_PICTURE_TYPES,
  DESIGN_PICTURE_UNSAVED_LIMIT,
  checkDesignPicture,
  isColourablePlace,
  parseDesignChange,
  storedColours,
} from '../utils/mapDesigns.js';
import {
  clearDesignPictureInDB,
  findDesignUpload,
  findMapDesigns,
  findPlaceKinds,
  saveMapDesignInDB,
  setDesignPictureInDB,
} from '../domain/mapDesigns.js';
import {
  buildDesignPictureKey,
  deleteStoredObjects,
  designPictureFolder,
  headPrivateObject,
  presignDesignPicture,
  signPhotoUrl,
} from '../services/s3/mediaService.js';
import { badRequest, denyUnless, handler, loadMap } from './helpers/travel.js';

const D = DOMAINS.maps;

/** A design as the replies give it, or null for a map without one. */
export async function designView(design) {
  if (!design) return null;
  return {
    style: design.style,
    shown: design.shown,
    countries: storedColours(design.countryColours),
    names: design.namesColour,
    grid: design.gridColour,
    hover: design.hoverColour,
    string: design.stringColour,
    stringTwist: design.stringTwistColour ?? null,
    plannedString: design.plannedStringColour ?? null,
    plannedStringTwist: design.plannedStringTwistColour ?? null,
    // How the places visited or lived in show, and their colour (25 Nov 2026)
    visitedLook: design.visitedLook ?? 'BADGE',
    visited: design.visitedColour ?? null,
    // Signed as a photo is (on the hour, for two), so the browser keeps it
    picture: design.picture ? { url: await signPhotoUrl(design.picture.key) } : null,
  };
}

/** A map's designs for its reply (GET /maps/:mapId and the share link's): style -> design. */
export const mapDesignsView = async (mapId) => {
  const designs = await findMapDesigns(mapId);
  return Object.fromEntries(await Promise.all(designs.map(async (design) => [design.style, await designView(design)])));
};

/** The map style a design request is for (`style`, body or query), or null when it names none. */
const designStyleOf = (value) => (MAP_STYLES.includes(value) ? value : null);

/** The map, if the caller may change its design; otherwise the reply has been sent. */
async function loadDesignableMap(req, res) {
  const { map, role } = await loadMap(req, req.params.mapId);
  if (denyUnless(req, res, D, role, canManage, EVENT_MESSAGES.mapNotFound)) return null;
  return map;
}

const logDesign = (req, map, action) =>
  logEvent(createMapEvent({ user: req.user, action, id: map.id, statusCode: 200 }));

// PATCH /maps/:mapId/design: { style, shown?, countries?, names?, grid?, hover?, string? }. `countries`
// replaces the whole set; a colour of null is the usual one again.
export const updateMapDesignHandler = handler(D, 'Update map design', async (req, res) => {
  const map = await loadDesignableMap(req, res);
  if (!map) return undefined;

  const style = designStyleOf(req.body?.style);
  if (!style) return badRequest(req, res, D, EVENT_MESSAGES.invalidMapStyle);
  const change = parseDesignChange(req.body);
  if (change.error) return badRequest(req, res, D, EVENT_MESSAGES[change.error]);
  if (change.codes.length) {
    const places = new Map((await findPlaceKinds(change.codes)).map((place) => [place.code, place]));
    if (!change.codes.every((code) => isColourablePlace(places.get(code)))) {
      return badRequest(req, res, D, EVENT_MESSAGES.invalidDesignPlace);
    }
  }

  const design = await saveMapDesignInDB(map.id, style, change.data);
  logDesign(req, map, 'Design Update');
  return sendDataResponse(res, 200, { design: await designView(design) });
});

// POST /maps/:mapId/design/picture/presign: { contentType, bytes } -> a PUT into the private
// bucket, signing both. The browser makes the picture (at most 2,560 px wide) first.
export const presignDesignPictureHandler = handler(D, 'Presign map design picture', async (req, res) => {
  const map = await loadDesignableMap(req, res);
  if (!map) return undefined;

  const { contentType, bytes } = req.body || {};
  const problem = checkDesignPicture({ contentType, bytes });
  if (problem === 'designPictureTooLarge') return sendMessageResponse(res, 413, EVENT_MESSAGES[problem]);
  if (problem) return badRequest(req, res, D, EVENT_MESSAGES[problem]);

  const key = buildDesignPictureKey({ mapId: map.id, contentType });
  const { url, expiresIn } = await presignDesignPicture({
    key,
    contentType,
    bytes,
    userId: req.user.id,
    limit: DESIGN_PICTURE_UNSAVED_LIMIT,
  });
  return sendDataResponse(res, 200, {
    key,
    upload: { url, method: 'PUT', headers: { 'Content-Type': contentType }, bytes, expiresIn },
  });
});

// PUT /maps/:mapId/design/picture: { key, style } -> the picture checked in the bucket, put on
// the style's design (which then shows), and the picture it replaced deleted.
export const saveDesignPictureHandler = handler(D, 'Save map design picture', async (req, res) => {
  const map = await loadDesignableMap(req, res);
  if (!map) return undefined;

  const style = designStyleOf(req.body?.style);
  if (!style) return badRequest(req, res, D, EVENT_MESSAGES.invalidMapStyle);
  const key = req.body?.key;
  const invalid = () => badRequest(req, res, D, EVENT_MESSAGES.designPictureInvalid);
  if (typeof key !== 'string' || !key.startsWith(`${designPictureFolder(map.id)}sea-`)) return invalid();
  const item = await findDesignUpload(key);
  if (!item || item.resource !== 'mapDesign' || item.ownerId !== req.user.id) return invalid();
  if (Date.now() - new Date(item.createdAt).getTime() > DESIGN_PICTURE_SAVE_WINDOW_MINUTES * 60 * 1000) {
    return badRequest(req, res, D, EVENT_MESSAGES.designPictureExpired);
  }

  const stored = await headPrivateObject(key);
  if (!stored) return invalid();
  if (stored.bytes > DESIGN_PICTURE_MAX_BYTES || !DESIGN_PICTURE_TYPES.includes(stored.contentType)) {
    await deleteStoredObjects([key]);
    return stored.bytes > DESIGN_PICTURE_MAX_BYTES
      ? sendMessageResponse(res, 413, EVENT_MESSAGES.designPictureTooLarge)
      : badRequest(req, res, D, EVENT_MESSAGES.designPictureType);
  }

  const { design, oldKey } = await setDesignPictureInDB({
    mapId: map.id,
    style,
    mediaId: item.id,
    bytes: stored.bytes,
    contentType: stored.contentType,
  });
  // The row no longer points at the old file, so it can go (never throws; a failure is the
  // daily clean-up's)
  if (oldKey) await deleteStoredObjects([oldKey]);
  logDesign(req, map, 'Design Picture Saved');
  return sendDataResponse(res, 200, { design: await designView(design) });
});

// DELETE /maps/:mapId/design/picture?style=: the style's sea goes back to its usual look
export const deleteDesignPictureHandler = handler(D, 'Remove map design picture', async (req, res) => {
  const map = await loadDesignableMap(req, res);
  if (!map) return undefined;

  const style = designStyleOf(req.query?.style);
  if (!style) return badRequest(req, res, D, EVENT_MESSAGES.invalidMapStyle);
  const { design, oldKey } = await clearDesignPictureInDB(map.id, style);
  if (oldKey) await deleteStoredObjects([oldKey]);
  if (oldKey) logDesign(req, map, 'Design Picture Removed');
  return sendDataResponse(res, 200, { design: await designView(design) });
});
