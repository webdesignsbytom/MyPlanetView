// Accepting an emailed invite (someone shared a map or trip with an address
// that had no account). The invite's address must be the user's verified email.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createSharingEvent } from '../event/travelUtils.js';
import { hashInviteToken } from '../utils/shareCodes.js';
import { acceptInviteInDB, findInvitePreviewByHash, findUsableInviteByHash } from '../domain/sharing.js';
import { badRequest, forbidden, handler, notFound } from './helpers/travel.js';
import { invitePlanOf, recordInviteOffer } from '../services/billing/inviteOffer.js';
import { planOf } from '../utils/constants/plans.js';

const D = DOMAINS.sharing;

const isTokenShaped = (token) => typeof token === 'string' && token.length >= 20 && token.length <= 200;

/**
 * What an invite's link shows before anyone signs in (19 Nov 2026): the address it went to
 * (sign-up fills it in and keeps it), what it's for, who sent it, and a co-owner's traveller
 * (the name sign-up suggests). Holding the token is what proves the inbox, so this tells its
 * holder nothing new. A used, expired or unknown token is a 404.
 */
export const getInviteHandler = handler(D, 'Get invite', async (req, res) => {
  const { token } = req.params;
  if (!isTokenShaped(token)) return notFound(req, res, D, EVENT_MESSAGES.inviteInvalid);
  const invite = await findInvitePreviewByHash(hashInviteToken(token));
  if (!invite) return notFound(req, res, D, EVENT_MESSAGES.inviteInvalid);
  // A paid map's invite offer, for a new account (utils/inviteOffer.js)
  const mapPlan = await invitePlanOf(invite);
  const offer = mapPlan === 'REGULAR' || mapPlan === 'PREMIUM' ? { plan: mapPlan, planName: planOf(mapPlan).name } : null;
  return sendDataResponse(res, 200, {
    invite: {
      email: invite.email,
      role: invite.role,
      kind: invite.mapId ? 'map' : 'trip',
      id: invite.mapId ?? invite.tripId,
      name: invite.map?.name ?? invite.trip?.title ?? null,
      invitedBy: invite.invitedBy?.name ?? null,
      travellerName: invite.traveller?.name ?? null,
      expiresAt: invite.expiresAt,
      offer,
    },
  });
});

export const acceptInviteHandler = handler(D, 'Accept invite', async (req, res) => {
  const { token } = req.body || {};
  if (!isTokenShaped(token)) return badRequest(req, res, D, EVENT_MESSAGES.inviteInvalid);
  const invite = await findUsableInviteByHash(hashInviteToken(token));
  if (!invite) return badRequest(req, res, D, EVENT_MESSAGES.inviteInvalid);

  const sameAddress = String(req.user.email || '').toLowerCase() === invite.email;
  if (!sameAddress || !req.user.emailVerified) return forbidden(req, res, D, EVENT_MESSAGES.inviteWrongEmail);

  // One transaction; never lowers a role someone already has. False when the invite
  // was used meanwhile (two accepts at once).
  if (!(await acceptInviteInDB(invite, req.user.id))) return badRequest(req, res, D, EVENT_MESSAGES.inviteInvalid);
  await recordInviteOffer(req.user.id, invite).catch((err) => console.error('[INVITE] offer not recorded:', err.message));

  const resource = invite.mapId ? 'map' : 'trip';
  const id = invite.mapId ?? invite.tripId;
  logEvent(createSharingEvent({ user: req.user, action: 'Invite Accept Success', id, detail: `${resource} ${invite.role}` }));
  return sendDataResponse(res, 200, { resource, id });
});
