// Accepting an emailed invite (someone shared a map or trip with an address
// that had no account). The invite's address must be the user's verified email.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createSharingEvent } from '../event/travelUtils.js';
import { hashInviteToken } from '../utils/shareCodes.js';
import { acceptInviteInDB, findUsableInviteByHash } from '../domain/sharing.js';
import { badRequest, forbidden, handler } from './helpers/travel.js';

const D = DOMAINS.sharing;

export const acceptInviteHandler = handler(D, 'Accept invite', async (req, res) => {
  const { token } = req.body || {};
  if (typeof token !== 'string' || token.length < 20 || token.length > 200) {
    return badRequest(req, res, D, EVENT_MESSAGES.inviteInvalid);
  }
  const invite = await findUsableInviteByHash(hashInviteToken(token));
  if (!invite) return badRequest(req, res, D, EVENT_MESSAGES.inviteInvalid);

  const sameAddress = String(req.user.email || '').toLowerCase() === invite.email;
  if (!sameAddress || !req.user.emailVerified) return forbidden(req, res, D, EVENT_MESSAGES.inviteWrongEmail);

  // One transaction; never lowers a role someone already has. False when the invite
  // was used meanwhile (two accepts at once).
  if (!(await acceptInviteInDB(invite, req.user.id))) return badRequest(req, res, D, EVENT_MESSAGES.inviteInvalid);

  const resource = invite.mapId ? 'map' : 'trip';
  const id = invite.mapId ?? invite.tripId;
  logEvent(createSharingEvent({ user: req.user, action: 'Invite Accept Success', id, detail: `${resource} ${invite.role}` }));
  return sendDataResponse(res, 200, { resource, id });
});
