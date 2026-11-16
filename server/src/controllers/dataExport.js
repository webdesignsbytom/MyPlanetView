// "Download my data" (docs/API.md "Your data"): everything an account holds, in parts the
// browser joins into one JSON file. Reads only, of the caller's own data: their account,
// maps they own (anyone else's map is a 404, as if it didn't exist) and the photos they
// uploaded. Each photo carries a link to its best copy that works for EXPORT_LINK_DAYS.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { isUuid } from '../utils/travelValidation.js';
import {
  EXPORT_LINK_DAYS,
  EXPORT_PHOTO_PAGE,
  exportAccountView,
  exportFileName,
  exportFileOf,
  exportMapView,
  exportPhotoView,
  exportUploadView,
  pageOf,
  parseExportCursor,
} from '../utils/dataExport.js';
import { publicMediaUrlFrom } from '../utils/media/publicMediaUrl.js';
import { signPhotoExportUrl } from '../services/s3/mediaService.js';
import {
  findAccountForExport,
  findMapForExport,
  findMapOwnerId,
  findMapPhotosForExport,
  findUploadsElsewhereForExport,
} from '../domain/dataExport.js';
import { badRequest, handler, notFound } from './helpers/travel.js';

const D = DOMAINS.users;
const BAD_CURSOR = 'That page of the export doesn’t exist. Start the download again.';

// Never cached by a browser or a CDN: it's personal, and its links expire
const noStore = (res) => res.set('Cache-Control', 'no-store');

/** Is this map the caller's own? Replies 404 (nothing to probe) and answers false otherwise. */
async function ownMap(req, res) {
  const { mapId } = req.params;
  if (isUuid(mapId) && (await findMapOwnerId(mapId)) === req.user.id) return true;
  notFound(req, res, D, EVENT_MESSAGES.mapNotFound);
  return false;
}

// A page of photos, each with its signed link (signed side by side)
async function photoPage(rows, view, userId) {
  const { rows: page, nextCursor } = pageOf(rows, EXPORT_PHOTO_PAGE);
  const photos = await Promise.all(
    page.map(async (photo) => {
      const file = exportFileOf(photo);
      const fileUrl = file ? await signPhotoExportUrl(file.media.key, { downloadAs: exportFileName(photo, file), days: EXPORT_LINK_DAYS }) : null;
      return view(photo, { userId, fileUrl });
    })
  );
  return { photos, nextCursor };
}

// GET /api/users/export: the account, its plan, and the maps and trips it's on
export const getExportHandler = handler(D, 'Export account', async (req, res) => {
  const rows = await findAccountForExport(req.user.id);
  noStore(res);
  return sendDataResponse(res, 200, exportAccountView({ ...rows, avatarUrl: rows.avatarKey ? publicMediaUrlFrom(rows.avatarKey) : null }));
});

// GET /api/users/export/maps/:mapId: one map you own, apart from its photos
export const getMapExportHandler = handler(D, 'Export map', async (req, res) => {
  if (!(await ownMap(req, res))) return undefined;
  const rows = await findMapForExport(req.params.mapId);
  noStore(res);
  return sendDataResponse(res, 200, { map: exportMapView(rows, { userId: req.user.id }) });
});

// GET /api/users/export/maps/:mapId/photos?cursor=: its photos, newest upload first, 500 a page
export const getMapPhotosExportHandler = handler(D, 'Export map photos', async (req, res) => {
  const cursor = parseExportCursor(req.query.cursor);
  if (!cursor.ok) return badRequest(req, res, D, BAD_CURSOR);
  if (!(await ownMap(req, res))) return undefined;
  const rows = await findMapPhotosForExport(req.params.mapId, { cursor: cursor.value, take: EXPORT_PHOTO_PAGE });
  noStore(res);
  return sendDataResponse(res, 200, await photoPage(rows, exportPhotoView, req.user.id));
});

// GET /api/users/export/uploads?cursor=: the photos you added to other people's maps
export const getUploadsExportHandler = handler(D, 'Export uploads', async (req, res) => {
  const cursor = parseExportCursor(req.query.cursor);
  if (!cursor.ok) return badRequest(req, res, D, BAD_CURSOR);
  const rows = await findUploadsElsewhereForExport(req.user.id, { cursor: cursor.value, take: EXPORT_PHOTO_PAGE });
  noStore(res);
  return sendDataResponse(res, 200, await photoPage(rows, exportUploadView, req.user.id));
});
