// Emails people can stop (docs/API.md "Emails"). Each returns the payload; errors keep the
// client's `friendlyMessage`.
import client from './client';

const data = (promise) => promise.then((res) => res.data?.data ?? {});

/** -> `{ onThisDay }` */
export const getEmailPreferences = () => data(client.get('/api/users/email-preferences'));
/** `{ onThisDay }` -> `{ onThisDay }` */
export const saveEmailPreferences = (body) => data(client.put('/api/users/email-preferences', body));
/** An email's unsubscribe link (no sign-in): `{ u, t }` -> `{ onThisDay: false }` */
export const unsubscribeFromEmails = (body) => data(client.post('/api/emails/unsubscribe', body));
