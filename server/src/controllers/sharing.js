// Sharing, the same for maps and trips (Google Docs style): people with access,
// general access (restricted / anyone with the link), the share link, invites.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createSharingEvent } from '../event/travelUtils.js';
import { runAfterResponse } from '../utils/background.js';
import { sanitizeEmail } from '../utils/sanitize.js';
import { cleanDisplayName } from '../utils/displayName.js';
import { SHARE_ROLES, canManage, canRemoveMember, canView } from '../utils/access.js';
import { LINK_ACCESS_VALUES, isEmail, isOneOf, isUuid } from '../utils/travelValidation.js';
import { formatShareCode, generateInviteToken, hashInviteToken } from '../utils/shareCodes.js';
import {
  BusinessName,
  BusinessSiteUrl,
  BusinessUrl,
  InviteAcceptUrl,
  LogoUrl,
  MapPageUrl,
  SharedPageUrl,
  TripPageUrl,
} from '../utils/constants/siteConstants.js';
import { sendUserEmail } from '../services/email/emailHandler.js';
import {
  countMapEditorSeats,
  countTripSeats,
  deleteMapMember,
  findMapMember,
  findMapMembers,
  updateMapInDB,
  upsertMapMember,
} from '../domain/maps.js';
import { checkEditorCap, checkTripPeopleCap } from '../utils/planLimits.js';
import {
  deleteTripMember,
  findTripMember,
  findTripMembers,
  updateTripInDB,
  upsertTripMember,
} from '../domain/trips.js';
import {
  deleteInviteInDB,
  findPendingInvites,
  findUserForSharing,
  replaceInviteInDB,
} from '../domain/sharing.js';
import { newUniqueShareCode } from '../services/travel/maps.js';
import { badRequest, conflict, denyUnless, forbidden, handler, loadMap, loadTrip, notFound } from './helpers/travel.js';

const D = DOMAINS.sharing;
const INVITE_DAYS = 14;

export const shareUrlFor = (shareCode) => `${SharedPageUrl}/${formatShareCode(shareCode)}`;

// The two kinds of shareable thing
const RESOURCES = {
  maps: {
    kind: 'map',
    notFoundMessage: EVENT_MESSAGES.mapNotFound,
    async load(req, id) {
      const { map, role } = await loadMap(req, id);
      return { resource: map, role };
    },
    label: (map) => map.name,
    pageUrl: (map) => `${MapPageUrl}/${map.id}`,
    target: (map) => ({ mapId: map.id }),
    update: (map, data) => updateMapInDB(map.id, data),
    members: (map) => findMapMembers(map.id),
    findMember: (map, userId) => findMapMember(map.id, userId),
    upsertMember: (map, userId, role) => upsertMapMember(map.id, userId, role),
    deleteMember: (map, userId) => deleteMapMember(map.id, userId),
    // Up to EDITORS_PER_MAP editors (EDITOR members and pending EDITOR invites, the
    // person being added left out); viewers are unlimited. -> null, or the 409 message
    async seatProblem(map, { role, userId, email }) {
      if (role !== 'EDITOR') return null;
      return checkEditorCap({ editors: await countMapEditorSeats(map.id, { exceptUserId: userId, exceptEmail: email }) });
    },
  },
  trips: {
    kind: 'trip',
    notFoundMessage: EVENT_MESSAGES.tripNotFound,
    async load(req, id) {
      // The map's owner manages a trip's sharing (their role on it is OWNER)
      const { trip, role } = await loadTrip(req, id);
      return { resource: trip, role };
    },
    label: (trip) => trip.title,
    pageUrl: (trip) => `${TripPageUrl}/${trip.id}`,
    target: (trip) => ({ tripId: trip.id }),
    update: (trip, data) => updateTripInDB(trip.id, data),
    members: (trip) => findTripMembers(trip.id),
    findMember: (trip, userId) => findTripMember(trip.id, userId),
    upsertMember: (trip, userId, role) => upsertTripMember(trip.id, userId, role),
    // Also takes the trip off the maps that person added it to (the visits stay)
    deleteMember: (trip, userId) => deleteTripMember(trip.id, userId),
    // Up to PEOPLE_PER_TRIP people of any role (members and pending invites, the person
    // being added left out). A role change adds nobody. -> null, or the 409 message
    async seatProblem(trip, { userId, email, roleChangeOnly = false }) {
      if (roleChangeOnly) return null;
      return checkTripPeopleCap({ people: await countTripSeats(trip.id, { exceptUserId: userId, exceptEmail: email }) });
    },
  },
};

const memberView = (m) => ({ userId: m.userId, name: m.user.name, email: m.user.email, role: m.role });
const inviteView = (i) => ({ id: i.id, email: i.email, role: i.role, expiresAt: i.expiresAt });

async function sharingView(adapter, resource) {
  const [members, invites] = await Promise.all([adapter.members(resource), findPendingInvites(adapter.target(resource))]);
  return {
    linkAccess: resource.linkAccess,
    shareCode: formatShareCode(resource.shareCode),
    shareUrl: shareUrlFor(resource.shareCode),
    members: members.map(memberView),
    invites: invites.map(inviteView),
  };
}

// The subject is fixed: the sharer's name (anyone's to choose) stays in the body,
// where it's escaped, so the email can't be dressed up as someone else's message
export const shareEmailSubject = (kind) => `${BusinessName}: a ${kind} was shared with you`;

function sendShareEmail({ to, sharer, adapter, resource, role, isInvite, token, expiresAt }) {
  const subject = shareEmailSubject(adapter.kind);
  runAfterResponse(
    sendUserEmail(to, subject, 'shareEmail', {
      title: subject,
      // Names are cleaned at sign-up and rename; this covers rows from before that
      sharerName: cleanDisplayName(sharer.name) || 'Someone',
      resourceKind: `a ${adapter.kind}`,
      resourceLabel: `"${adapter.label(resource)}"`,
      resourceName: adapter.label(resource),
      canEdit: role === 'EDITOR',
      isInvite,
      email: to,
      actionUrl: isInvite ? `${InviteAcceptUrl}/${token}` : adapter.pageUrl(resource),
      expiryTime: expiresAt
        ? expiresAt.toLocaleString('en-GB', { dateStyle: 'medium', timeZone: 'Europe/London' })
        : null,
      businessName: BusinessName,
      businessUrl: BusinessUrl,
      businessSiteUrl: BusinessSiteUrl,
      logoUrl: LogoUrl,
      year: new Date().getFullYear(),
    }).then((sent) => {
      if (!sent) logEvent(createSharingEvent({ user: sharer, action: 'Email Failed', detail: EVENT_MESSAGES.shareEmailFailed, statusCode: 500 }));
    })
  );
}

/** The sharing handlers for maps (`'maps'`) or trips (`'trips'`). */
export function sharingHandlers(resourceName) {
  const adapter = RESOURCES[resourceName];

  // Load the resource; answer and return null unless the caller may manage it
  async function loadManaged(req, res) {
    const { resource, role } = await adapter.load(req, req.params.id);
    if (denyUnless(req, res, D, role, canManage, adapter.notFoundMessage)) return null;
    return resource;
  }

  return {
    get: handler(D, `Get ${adapter.kind} sharing`, async (req, res) => {
      const resource = await loadManaged(req, res);
      if (!resource) return undefined;
      return sendDataResponse(res, 200, await sharingView(adapter, resource));
    }),

    update: handler(D, `Update ${adapter.kind} sharing`, async (req, res) => {
      const resource = await loadManaged(req, res);
      if (!resource) return undefined;
      const { linkAccess } = req.body || {};
      if (!isOneOf(linkAccess, LINK_ACCESS_VALUES)) return badRequest(req, res, D, EVENT_MESSAGES.invalidLinkAccess);
      await adapter.update(resource, { linkAccess });
      logEvent(createSharingEvent({ user: req.user, action: 'Link Access Update Success', id: resource.id, detail: `${adapter.kind} ${linkAccess}` }));
      return sendDataResponse(res, 200, await sharingView(adapter, { ...resource, linkAccess }));
    }),

    resetLink: handler(D, `Reset ${adapter.kind} link`, async (req, res) => {
      const resource = await loadManaged(req, res);
      if (!resource) return undefined;
      const shareCode = await newUniqueShareCode();
      await adapter.update(resource, { shareCode });
      logEvent(createSharingEvent({ user: req.user, action: 'Link Reset Success', id: resource.id, detail: adapter.kind }));
      return sendDataResponse(res, 200, { shareCode: formatShareCode(shareCode), shareUrl: shareUrlFor(shareCode) });
    }),

    // Emails someone, so the sharer's own address must be verified (and the route
    // has a per-user daily cap): an unverified throwaway account can't send mail
    // from our domain to strangers
    addMember: handler(D, `Add ${adapter.kind} member`, async (req, res) => {
      const resource = await loadManaged(req, res);
      if (!resource) return undefined;
      if (!req.user.emailVerified) return forbidden(req, res, D, EVENT_MESSAGES.shareNeedsVerifiedEmail);
      const body = req.body || {};
      const email = sanitizeEmail(body.email);
      if (!isEmail(email)) return badRequest(req, res, D, EVENT_MESSAGES.invalidEmail);
      if (!isOneOf(body.role, SHARE_ROLES)) return badRequest(req, res, D, EVENT_MESSAGES.invalidShareRole);
      if (email === String(req.user.email).toLowerCase()) {
        return badRequest(req, res, D, EVENT_MESSAGES.cannotShareWithOwner);
      }

      // Access straight away only for an active account whose address is verified.
      // Anyone could sign up with an address they don't own and never verify it.
      const user = await findUserForSharing(email);
      if (user && user.isActive !== false && user.emailVerified === true) {
        const full = await adapter.seatProblem(resource, { role: body.role, userId: user.id, email });
        if (full) return conflict(req, res, D, full);
        const member = await adapter.upsertMember(resource, user.id, body.role);
        logEvent(createSharingEvent({ user: req.user, action: 'Member Add Success', id: resource.id, targetId: user.id, detail: `${adapter.kind} ${body.role}`, statusCode: 201 }));
        sendShareEmail({ to: user.email, sharer: req.user, adapter, resource, role: body.role, isInvite: false });
        return sendDataResponse(res, 201, { member: memberView(member) });
      }

      // No account yet, or an unverified or deactivated one: an invite, accepted once
      // that address is verified (automatically then, or through the emailed link).
      // It holds a place until then (accepting it never fails on the cap).
      const full = await adapter.seatProblem(resource, { role: body.role, email });
      if (full) return conflict(req, res, D, full);
      const token = generateInviteToken();
      const expiresAt = new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000);
      const invite = await replaceInviteInDB({
        ...adapter.target(resource),
        email,
        role: body.role,
        invitedById: req.user.id,
        tokenHash: hashInviteToken(token),
        expiresAt,
      });
      logEvent(createSharingEvent({ user: req.user, action: 'Invite Create Success', id: resource.id, detail: `${adapter.kind} ${body.role}`, statusCode: 201 }));
      sendShareEmail({ to: email, sharer: req.user, adapter, resource, role: body.role, isInvite: true, token, expiresAt });
      return sendDataResponse(res, 201, { invite: inviteView(invite) });
    }),

    updateMember: handler(D, `Update ${adapter.kind} member`, async (req, res) => {
      const resource = await loadManaged(req, res);
      if (!resource) return undefined;
      const { role } = req.body || {};
      if (!isOneOf(role, SHARE_ROLES)) return badRequest(req, res, D, EVENT_MESSAGES.invalidShareRole);
      if (!(await adapter.findMember(resource, req.params.userId))) {
        return notFound(req, res, D, EVENT_MESSAGES.memberNotFound);
      }
      // Promoting a map viewer to editor takes an editor's place
      const full = await adapter.seatProblem(resource, { role, userId: req.params.userId, roleChangeOnly: true });
      if (full) return conflict(req, res, D, full);
      const member = await adapter.upsertMember(resource, req.params.userId, role);
      logEvent(createSharingEvent({ user: req.user, action: 'Member Update Success', id: resource.id, targetId: req.params.userId, detail: `${adapter.kind} ${role}` }));
      return sendDataResponse(res, 200, { member: memberView(member) });
    }),

    // The owner removes someone, or a member leaves
    removeMember: handler(D, `Remove ${adapter.kind} member`, async (req, res) => {
      const { resource, role } = await adapter.load(req, req.params.id);
      if (!canView(role)) return notFound(req, res, D, adapter.notFoundMessage);
      const targetUserId = req.params.userId;
      if (!canRemoveMember({ actorRole: role, actorId: req.user.id, targetUserId })) return forbidden(req, res, D);
      const result = await adapter.deleteMember(resource, targetUserId);
      if (!result.count) return notFound(req, res, D, EVENT_MESSAGES.memberNotFound);
      logEvent(createSharingEvent({ user: req.user, action: 'Member Remove Success', id: resource.id, targetId: targetUserId, detail: adapter.kind }));
      return sendDataResponse(res, 200, { message: 'Access removed.' });
    }),

    deleteInvite: handler(D, `Delete ${adapter.kind} invite`, async (req, res) => {
      const resource = await loadManaged(req, res);
      if (!resource) return undefined;
      if (!isUuid(req.params.inviteId)) return notFound(req, res, D, EVENT_MESSAGES.inviteNotFound);
      const result = await deleteInviteInDB({ inviteId: req.params.inviteId, ...adapter.target(resource) });
      if (!result.count) return notFound(req, res, D, EVENT_MESSAGES.inviteNotFound);
      logEvent(createSharingEvent({ user: req.user, action: 'Invite Delete Success', id: resource.id, detail: adapter.kind }));
      return sendDataResponse(res, 200, { message: 'Invite cancelled.' });
    }),
  };
}
