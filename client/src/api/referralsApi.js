// Give a month, get a month (docs/API.md "Give a month, get a month"). Each returns the
// payload; errors keep the client's `friendlyMessage`.
import client from './client';

const data = (promise) => promise.then((res) => res.data?.data ?? {});

/** -> `{ referral: { code, friendDays, perYear, friendsJoined, friendsPaid, monthsEarned, monthsLeftThisYear } }` */
export const getReferral = () => data(client.get('/api/users/referral'));
/** The member's code, made now if they have none (a verified address). -> as getReferral */
export const createReferral = () => data(client.post('/api/users/referral'));
