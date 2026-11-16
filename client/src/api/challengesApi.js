// Friends challenges (docs/API.md, "Friends challenges"): the challenges you're in, one's
// leaderboard, starting, joining by a link, the map that counts, leaving, and the
// starter's changes. Each function returns the payload (`res.data.data`); errors keep the
// client's `friendlyMessage`.
import client from './client';
import { CHALLENGES_API } from '@/utils/constants/apiRoutes';

const data = (promise) => promise.then((res) => res.data?.data ?? {});
const enc = encodeURIComponent;

/** -> `{ challenges: [{ id, title, measure, startsOn, endsOn, target, status, memberCount, myCount, reachedTarget, counting, youStartedIt }], perUserLimit }` */
export const getMyChallenges = () => data(client.get(CHALLENGES_API));
/** `{ title, measure, startsOn, endsOn, target?, mapId }` -> 201 `{ challenge }` (its page's shape) */
export const createChallenge = (body) => data(client.post(CHALLENGES_API, body));
/** -> `{ challenge: { ...fields, joinCode, youStartedIt, myMap, members: [{ name, count, rank, reachedTarget, counting, isYou, startedIt }], memberLimit } }` */
export const getChallenge = (challengeId) => data(client.get(`${CHALLENGES_API}/${enc(challengeId)}`));
/** The starter: `{ title?, startsOn?, endsOn?, target? }` -> `{ challenge }` */
export const updateChallenge = (challengeId, body) => data(client.patch(`${CHALLENGES_API}/${enc(challengeId)}`, body));
/** The starter -> `{ message }` */
export const deleteChallenge = (challengeId) => data(client.delete(`${CHALLENGES_API}/${enc(challengeId)}`));
/** The starter: a new join link -> `{ challenge }` */
export const resetChallengeLink = (challengeId) => data(client.post(`${CHALLENGES_API}/${enc(challengeId)}/reset-link`));
/** Which of your maps counts -> `{ challenge }` */
export const setMyChallengeMap = (challengeId, mapId) => data(client.patch(`${CHALLENGES_API}/${enc(challengeId)}/me`, { mapId }));
/** Leave (not the starter) -> `{ message }` */
export const leaveChallenge = (challengeId) => data(client.delete(`${CHALLENGES_API}/${enc(challengeId)}/me`));
/** Anyone with the link: `{ challenge: { ...fields, startedBy, memberCount, full, youAreIn } }` */
export const previewChallenge = (code) => data(client.get(`${CHALLENGES_API}/join/${enc(code)}`));
/** Signed in: join counting `mapId` -> `{ challenge }` */
export const joinChallenge = (code, mapId) => data(client.post(`${CHALLENGES_API}/join/${enc(code)}`, { mapId }));
