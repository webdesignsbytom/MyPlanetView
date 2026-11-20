// Sharing, the same for maps and trips (Google Docs style): people with access,
// general access (restricted / anyone with the link), the share link, invites.
import { DOMAINS, EVENT_MESSAGES, sendDataResponse } from '../utils/responses/responses.js';
import { logEvent } from '../utils/events/logEvent.js';
import { createSharingEvent } from '../event/travelUtils.js';
import { runAfterResponse } from '../utils/background.js';
import { sanitizeEmail } from '../utils/sanitize.js';
import { cleanDisplayName } from '../utils/displayName.js';
import { SHARE_ROLES, TRIP_SHARE_ROLES, canManage, canRemoveMember, canSetMemberRole, canView } from '../utils/access.js';
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
import { invitePlanOf } from '../services/billing/inviteOffer.js';
import { formatPence, planOf } from '../utils/constants/plans.js';
import { yearlyInviteSaving } from '../utils/inviteOffer.js';
import {
  countMapCoOwnerSeats,
  countMapEditorSeats,
  countTravellers,
  countTripSeats,
  deleteMapMember,
  findTraveller,
  findMapMember,
  findMapMembers,
  updateMapInDB,
  upsertMapMember,
} from '../domain/maps.js';
import { checkCoOwnerCap, checkEditorCap, checkTripPeopleCap } from '../utils/planLimits.js';
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
  findSharingOwner,
  findUserForSharing,
  linkTravellerInTx,
  replaceInviteInDB,
  travellerFreeForCoOwner,
  withShareTargetLocked,
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
    // Co-owners too (19 Nov 2026, docs/API.md "Co-owners"): one of the map's travellers each
    roles: SHARE_ROLES,
    invalidRoleMessage: EVENT_MESSAGES.invalidMapShareRole,
    ownerId: (map) => map.ownerId,
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
    upsertMember: (map, userId, role, tx) => upsertMapMember(map.id, userId, role, tx),
    deleteMember: (map, userId) => deleteMapMember(map.id, userId),
    // Up to EDITORS_PER_MAP editors (EDITOR members and pending EDITOR invites, the
    // person being added left out); viewers are unlimited. A co-owner is one of the
    // travellers no one else has (checkCoOwnerCap; never counted as an editor). Counted in
    // `tx`, the map's row locked (withShareTargetLocked). -> null, or the 409 message
    async seatProblem(map, { role, userId, email, travellerId }, tx) {
      const except = { exceptUserId: userId, exceptEmail: email };
      if (role === 'EDITOR') return checkEditorCap({ editors: await countMapEditorSeats(map.id, except, tx) });
      if (role !== 'CO_OWNER') return null;
      const [coOwners, travellers] = await Promise.all([countMapCoOwnerSeats(map.id, except, tx), countTravellers(map.id, tx)]);
      const full = checkCoOwnerCap({ coOwners, travellers });
      if (full) return full;
      const free = await travellerFreeForCoOwner(tx, { mapId: map.id, travellerId, userId, email });
      return free ? null : EVENT_MESSAGES.coOwnerTravellerTaken;
    },
    // A new co-owner becomes their traveller, in `tx`
    linkTraveller: (map, userId, travellerId, tx) => linkTravellerInTx(tx, { mapId: map.id, userId, travellerId }),
  },
  trips: {
    kind: 'trip',
    notFoundMessage: EVENT_MESSAGES.tripNotFound,
    roles: TRIP_SHARE_ROLES,
    invalidRoleMessage: EVENT_MESSAGES.invalidShareRole,
    ownerId: (trip) => trip.map?.ownerId,
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
    upsertMember: (trip, userId, role, tx) => upsertTripMember(trip.id, userId, role, tx),
    // Also takes the trip off the maps that person added it to (the visits stay)
    deleteMember: (trip, userId) => deleteTripMember(trip.id, userId),
    // Up to PEOPLE_PER_TRIP people of any role (members and pending invites, the person
    // being added left out). A role change adds nobody. -> null, or the 409 message
    async seatProblem(trip, { userId, email, roleChangeOnly = false }, tx) {
      if (roleChangeOnly) return null;
      return checkTripPeopleCap({ people: await countTripSeats(trip.id, { exceptUserId: userId, exceptEmail: email }, tx) });
    },
  },
};

// A co-owner's traveller (travellerId, travellerName) comes with them
const memberView = (m, traveller = m.user.travellerOf?.[0]) => ({
  userId: m.userId,
  name: m.user.name,
  email: m.user.email,
  role: m.role,
  ...(m.role === 'CO_OWNER' && traveller ? { travellerId: traveller.id, travellerName: traveller.name } : {}),
});
const inviteView = (i) => ({
  id: i.id,
  email: i.email,
  role: i.role,
  expiresAt: i.expiresAt,
  ...(i.travellerId ? { travellerId: i.travellerId, travellerName: i.traveller?.name ?? null } : {}),
});

async function sharingView(adapter, resource) {
  const [members, invites, owner] = await Promise.all([
    adapter.members(resource),
    findPendingInvites(adapter.target(resource)),
    findSharingOwner(adapter.ownerId(resource)),
  ]);
  return {
    // The list's first row (a co-owner manages sharing too, so isn't always the owner)
    owner: owner ? { userId: owner.id, name: owner.name, email: owner.email } : null,
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

function sendShareEmail({ to, sharer, adapter, resource, role, isInvite, token, expiresAt, travellerName = null, offerPlan = null }) {
  const subject = shareEmailSubject(adapter.kind);
  runAfterResponse(
    sendUserEmail(to, subject, 'shareEmail', {
      title: subject,
      // Names are cleaned at sign-up and rename; this covers rows from before that
      sharerName: cleanDisplayName(sharer.name) || 'Someone',
      resourceKind: `a ${adapter.kind}`,
      resourceLabel: `"${adapter.label(resource)}"`,
      resourceName: adapter.label(resource),
      canEdit: role === 'EDITOR' || role === 'CO_OWNER',
      isCoOwner: role === 'CO_OWNER',
      travellerName,
      // The invite offer, for someone with no account yet (utils/inviteOffer.js)
      offerPlanName: offerPlan ? planOf(offerPlan).name : null,
      offerYearly: offerPlan ? formatPence(yearlyInviteSaving(offerPlan)) : null,
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

  // Load the resource; answer and return null unless the caller may manage it (the owner,
  // or a map's co-owner)
  async function loadManagedWithRole(req, res) {
    const { resource, role } = await adapter.load(req, req.params.id);
    if (denyUnless(req, res, D, role, canManage, adapter.notFoundMessage)) return {};
    return { resource, role };
  }
  const loadManaged = async (req, res) => (await loadManagedWithRole(req, res)).resource ?? null;

  // A role from the body, and for a co-owner the traveller they are -> { role, travellerId } or { error }
  function parseRole(body) {
    if (!isOneOf(body.role, adapter.roles)) return { error: adapter.invalidRoleMessage };
    if (body.role !== 'CO_OWNER') return { role: body.role, travellerId: null };
    if (!isUuid(body.travellerId)) return { error: EVENT_MESSAGES.coOwnerNeedsTraveller };
    return { role: body.role, travellerId: body.travellerId };
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
      const { resource, role: actorRole } = await loadManagedWithRole(req, res);
      if (!resource) return undefined;
      if (!req.user.emailVerified) return forbidden(req, res, D, EVENT_MESSAGES.shareNeedsVerifiedEmail);
      const body = req.body || {};
      const email = sanitizeEmail(body.email);
      if (!isEmail(email)) return badRequest(req, res, D, EVENT_MESSAGES.invalidEmail);
      const parsed = parseRole(body);
      if (parsed.error) return badRequest(req, res, D, parsed.error);
      const { role, travellerId } = parsed;
      if (email === String(req.user.email).toLowerCase()) {
        return badRequest(req, res, D, EVENT_MESSAGES.cannotShareWithOwner);
      }

      // Access straight away only for an active account whose address is verified.
      // Anyone could sign up with an address they don't own and never verify it.
      const user = await findUserForSharing(email);
      if (user && user.isActive !== false && user.emailVerified === true) {
        // A co-owner can share too (never with the owner), but only the owner takes a co-owner's role away
        if (user.id === adapter.ownerId(resource)) return badRequest(req, res, D, EVENT_MESSAGES.cannotShareWithOwner);
        const current = await adapter.findMember(resource, user.id);
        if (!canSetMemberRole({ actorRole, currentRole: current?.role ?? null, newRole: role })) {
          return forbidden(req, res, D, EVENT_MESSAGES.onlyOwnerChangesCoOwner);
        }
        const { full, member } = await withShareTargetLocked(adapter.target(resource), async (tx) => {
          const problem = await adapter.seatProblem(resource, { role, userId: user.id, email, travellerId }, tx);
          if (problem) return { full: problem };
          const added = await adapter.upsertMember(resource, user.id, role, tx);
          if (role === 'CO_OWNER') await adapter.linkTraveller(resource, user.id, travellerId, tx);
          return { member: added };
        });
        if (full) return conflict(req, res, D, full);
        const traveller = role === 'CO_OWNER' ? await findTraveller(resource.id, travellerId) : null;
        logEvent(createSharingEvent({ user: req.user, action: 'Member Add Success', id: resource.id, targetId: user.id, detail: `${adapter.kind} ${role}`, statusCode: 201 }));
        sendShareEmail({ to: user.email, sharer: req.user, adapter, resource, role, isInvite: false, travellerName: traveller?.name ?? null });
        return sendDataResponse(res, 201, { member: memberView(member, travellerId ? { id: travellerId, name: traveller?.name ?? null } : null) });
      }

      // No account yet, or an unverified or deactivated one: an invite, accepted once
      // that address is verified (automatically then, or through the emailed link).
      // It holds a place until then (accepting it never fails on the cap).
      const token = generateInviteToken();
      const expiresAt = new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000);
      const { full, invite } = await withShareTargetLocked(adapter.target(resource), async (tx) => {
        const problem = await adapter.seatProblem(resource, { role, email, travellerId }, tx);
        if (problem) return { full: problem };
        const data = { ...adapter.target(resource), email, role, travellerId, invitedById: req.user.id, tokenHash: hashInviteToken(token), expiresAt };
        return { invite: await replaceInviteInDB(data, tx) };
      });
      if (full) return conflict(req, res, D, full);
      logEvent(createSharingEvent({ user: req.user, action: 'Invite Create Success', id: resource.id, detail: `${adapter.kind} ${role}`, statusCode: 201 }));
      const mapPlan = await invitePlanOf(adapter.target(resource)).catch(() => null);
      // Only an address with no account can make a new one with the offer
      const offerPlan = !user && (mapPlan === 'REGULAR' || mapPlan === 'PREMIUM') ? mapPlan : null;
      sendShareEmail({ to: email, sharer: req.user, adapter, resource, role, isInvite: true, token, expiresAt, travellerName: invite.traveller?.name ?? null, offerPlan });
      return sendDataResponse(res, 201, { invite: inviteView(invite) });
    }),

    updateMember: handler(D, `Update ${adapter.kind} member`, async (req, res) => {
      const { resource, role: actorRole } = await loadManagedWithRole(req, res);
      if (!resource) return undefined;
      const body = req.body || {};
      const current = await adapter.findMember(resource, req.params.userId);
      if (!current) return notFound(req, res, D, EVENT_MESSAGES.memberNotFound);
      // A co-owner staying one keeps their traveller: no traveller needed then
      const parsed = current.role === 'CO_OWNER' && body.role === 'CO_OWNER' ? { role: 'CO_OWNER', keep: true } : parseRole(body);
      if (parsed.error) return badRequest(req, res, D, parsed.error);
      const { role, travellerId, keep } = parsed;
      if (!canSetMemberRole({ actorRole, currentRole: current.role, newRole: role })) {
        return forbidden(req, res, D, EVENT_MESSAGES.onlyOwnerChangesCoOwner);
      }
      // Promoting a map viewer to editor takes an editor's place; a co-owner, a traveller's
      const { full, member } = await withShareTargetLocked(adapter.target(resource), async (tx) => {
        if (!keep) {
          const problem = await adapter.seatProblem(resource, { role, userId: req.params.userId, travellerId, roleChangeOnly: true }, tx);
          if (problem) return { full: problem };
        }
        const changed = await adapter.upsertMember(resource, req.params.userId, role, tx);
        if (role === 'CO_OWNER' && !keep) await adapter.linkTraveller(resource, req.params.userId, travellerId, tx);
        return { member: changed };
      });
      if (full) return conflict(req, res, D, full);
      logEvent(createSharingEvent({ user: req.user, action: 'Member Update Success', id: resource.id, targetId: req.params.userId, detail: `${adapter.kind} ${role}` }));
      const members = role === 'CO_OWNER' ? await adapter.members(resource) : null;
      return sendDataResponse(res, 200, { member: memberView(members?.find((m) => m.userId === member.userId) ?? member) });
    }),

    // The owner removes someone, a co-owner anyone but a co-owner, or a member leaves
    removeMember: handler(D, `Remove ${adapter.kind} member`, async (req, res) => {
      const { resource, role } = await adapter.load(req, req.params.id);
      if (!canView(role)) return notFound(req, res, D, adapter.notFoundMessage);
      const targetUserId = req.params.userId;
      const target = await adapter.findMember(resource, targetUserId);
      if (!canRemoveMember({ actorRole: role, actorId: req.user.id, targetUserId, targetRole: target?.role ?? null })) {
        return forbidden(req, res, D);
      }
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
