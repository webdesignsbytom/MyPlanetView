// "Download my data" (docs/API.md, "Your data"): the parts of the file, each returning its
// payload (`res.data.data`); errors keep the client's `friendlyMessage`.
import client from './client';
import { DATA_EXPORT_API } from '@/utils/constants/apiRoutes';

const data = (promise) => promise.then((res) => res.data?.data ?? {});
const enc = encodeURIComponent;
const withCursor = (cursor) => (cursor ? `?cursor=${enc(cursor)}` : '');

// The account, its plan, and the maps and trips it's on
export const getExportAccount = () => data(client.get(DATA_EXPORT_API));
// One map you own -> { map }
export const getExportMap = (mapId) => data(client.get(`${DATA_EXPORT_API}/maps/${enc(mapId)}`));
// A page of its photos -> { photos, nextCursor }
export const getExportMapPhotos = (mapId, cursor) => data(client.get(`${DATA_EXPORT_API}/maps/${enc(mapId)}/photos${withCursor(cursor)}`));
// A page of your photos on other people's maps -> { photos, nextCursor }
export const getExportUploads = (cursor) => data(client.get(`${DATA_EXPORT_API}/uploads${withCursor(cursor)}`));
