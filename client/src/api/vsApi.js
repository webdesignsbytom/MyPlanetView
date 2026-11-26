// Vs mode (docs/API.md "Vs mode"; 26 Nov 2026). Each returns the payload; errors keep the
// client's `friendlyMessage` (and `response.status`).
import client from './client';
import { VS_API } from '@/utils/constants/apiRoutes';

const data = (promise) => promise.then((res) => res.data?.data ?? {});
const enc = encodeURIComponent;

/** -> `{ groups: [{ id, title, memberCount, youStartedIt, hasMap }], perUserLimit, memberLimit }` */
export const getMyVsGroups = () => data(client.get(VS_API));
/** `{ title?, mapId }` -> `{ group }` */
export const createVsGroup = (body) => data(client.post(VS_API, body));
/** -> `{ group }`: everyone compared (docs/API.md "Vs mode") */
export const getVsGroup = (groupId) => data(client.get(`${VS_API}/${enc(groupId)}`));
export const renameVsGroup = (groupId, title) => data(client.patch(`${VS_API}/${enc(groupId)}`, { title }));
export const deleteVsGroup = (groupId) => data(client.delete(`${VS_API}/${enc(groupId)}`));
export const resetVsLink = (groupId) => data(client.post(`${VS_API}/${enc(groupId)}/reset-link`));
export const setMyVsMap = (groupId, mapId) => data(client.patch(`${VS_API}/${enc(groupId)}/me`, { mapId }));
export const leaveVsGroup = (groupId) => data(client.delete(`${VS_API}/${enc(groupId)}/me`));
/** By its link (anyone) -> `{ group: { id, title, startedBy, memberCount, memberLimit, full, youAreIn } }` */
export const previewVsGroup = (code) => data(client.get(`${VS_API}/join/${enc(code)}`));
export const joinVsGroup = (code, mapId) => data(client.post(`${VS_API}/join/${enc(code)}`, { mapId }));
