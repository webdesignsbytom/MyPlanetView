// Mock mode only: Google Docs style sharing for maps and trips (one module for both),
// invite links and share codes.
import { MESSAGES as COUNTRY_MAP_MESSAGES, countryMapOf, pinDetail, pinList, subdivisionStatuses } from '../countryMaps';
import { RANK, deny, fail, ok, route } from '../mockAdapter';
import { formatShareCode, getDb, me, newId, newShareCode, normaliseShareCode, session, shareUrlFor } from '../store';
import { canSeePhoto, higherRole, mapRole, mapTripsView, mapView, photoDetail, photoPage, tripRole, tripView } from '../views';
import { EDITORS_PER_MAP, PEOPLE_CAP_MESSAGES, PEOPLE_PER_TRIP, mapPlanId } from '../plans';
import { planOf } from '@/utils/constants/plans';
import { momentPage } from '../moments';
import { countryListPages } from '../countryLists';
import { adsFor } from '../offers';

// A co-owner (19 Nov 2026, docs/API.md "Co-owners"): maps only, one of the map's travellers
const ROLES_FOR = { maps: ['VIEWER', 'EDITOR', 'CO_OWNER'], trips: ['VIEWER', 'EDITOR'] };
const ROLE_MESSAGE = { maps: 'Role must be VIEWER, EDITOR or CO_OWNER.', trips: 'Role must be VIEWER or EDITOR.' };
const CO_OWNER_MESSAGES = {
  needsTraveller: "Choose which of the map's travellers a co-owner is.",
  travellerTaken: 'That traveller already has a login, or is invited as a co-owner.',
  full: "Every co-owner is one of the map's travellers, and the owner needs one too. Add a traveller first.",
  onlyOwner: "Only the map's owner can take away a co-owner's role.",
};
const isOwnerRole = (role) => role === 'OWNER';
// The owner, any change; a co-owner, any but taking a co-owner's role away (the server's canSetMemberRole)
const canSetMemberRole = (actorRole, currentRole, newRole) =>
  isOwnerRole(actorRole) || (actorRole === 'CO_OWNER' && (currentRole !== 'CO_OWNER' || newRole === 'CO_OWNER'));
const LINK_ACCESS = ['RESTRICTED', 'ANYONE_WITH_LINK'];
// The server's EVENT_MESSAGES.shareNeedsVerifiedEmail
const VERIFY_FIRST = 'Verify your email address before adding people. Use the link we emailed you, or send a new one from your account page.';
const memberTable = (kind) => (kind === 'maps' ? 'mapMembers' : 'tripMembers');
const idField = (kind) => (kind === 'maps' ? 'mapId' : 'tripId');

// The resource and the caller's role; the owner (a trip's map owner) or a map's co-owner manages sharing
function loadResource(kind, id) {
  const db = getDb();
  if (kind === 'maps') {
    const item = db.maps.find((m) => m.id === id) || null;
    return { item, role: mapRole(item) };
  }
  const item = db.trips.find((t) => t.id === id) || null;
  const map = item ? db.maps.find((m) => m.id === item.mapId) : null;
  return { item, role: tripRole(item), isOwner: Boolean(map && map.ownerId === me().id), ownerId: map?.ownerId ?? null };
}

const ownerIdOf = (kind, item) => (kind === 'maps' ? item?.ownerId : getDb().maps.find((m) => m.id === item?.mapId)?.ownerId) ?? null;

function sharingView(kind, item) {
  const db = getDb();
  const members = db[memberTable(kind)]
    .filter((m) => m[idField(kind)] === item.id)
    .map((m) => memberView(kind, item, m));
  const invites = db.invites
    .filter((i) => i[idField(kind)] === item.id && !i.acceptedAt && !(i.expiresAt && new Date(i.expiresAt).getTime() <= Date.now()))
    .map(inviteView);
  const owner = db.users.find((u) => u.id === ownerIdOf(kind, item));
  return {
    owner: owner ? { userId: owner.id, name: owner.name, email: owner.email } : null,
    linkAccess: item.linkAccess,
    shareCode: formatShareCode(item.shareCode),
    shareUrl: shareUrlFor(item.shareCode),
    members,
    invites,
  };
}

// A member as the server shows them: a co-owner with the traveller they are
function memberView(kind, item, m) {
  const db = getDb();
  const u = db.users.find((x) => x.id === m.userId);
  const traveller = kind === 'maps' && m.role === 'CO_OWNER' ? db.travellers.find((t) => t.mapId === item.id && t.userId === m.userId) : null;
  return {
    userId: m.userId,
    name: u?.name || 'Someone',
    email: u?.email || '',
    role: m.role,
    ...(traveller ? { travellerId: traveller.id, travellerName: traveller.name } : {}),
  };
}

function inviteView({ id, email, role, expiresAt, travellerId }) {
  const traveller = travellerId ? getDb().travellers.find((t) => t.id === travellerId) : null;
  return { id, email, role, expiresAt, ...(travellerId ? { travellerId, travellerName: traveller?.name ?? null } : {}) };
}

// Make travellerId (one of the map's) the traveller userId is: false when it's someone else's
function linkTraveller(mapId, userId, travellerId) {
  const db = getDb();
  const traveller = db.travellers.find((t) => t.id === travellerId && t.mapId === mapId);
  if (!traveller || (traveller.userId && traveller.userId !== userId)) return false;
  db.travellers.forEach((t) => {
    if (t.mapId === mapId && t.userId === userId && t.id !== travellerId) t.userId = null;
  });
  traveller.userId = userId;
  return true;
}

// The caps on people (docs/API.md, "Sharing"): a map's editors (EDITOR members plus
// pending EDITOR invites) and a trip's people (members of any role plus pending invites),
// leaving out the person being added. -> null, or the 409 message
const pendingInvite = (invite) => !invite.acceptedAt && invite.expiresAt > new Date().toISOString();
function seatProblem(kind, item, { role, userId = null, email = null, roleChangeOnly = false, travellerId = null }) {
  const db = getDb();
  if (kind === 'maps' && role === 'CO_OWNER') {
    // One fewer co-owners than travellers, each a traveller no one else has (the server's checkCoOwnerCap)
    const coOwners =
      db.mapMembers.filter((m) => m.mapId === item.id && m.role === 'CO_OWNER' && m.userId !== userId).length +
      db.invites.filter((i) => i.mapId === item.id && i.role === 'CO_OWNER' && pendingInvite(i) && i.email !== email).length;
    const travellers = db.travellers.filter((t) => t.mapId === item.id);
    if (coOwners + 1 > Math.max(0, travellers.length - 1)) return CO_OWNER_MESSAGES.full;
    const traveller = travellers.find((t) => t.id === travellerId);
    const invited = db.invites.some((i) => i.travellerId === travellerId && pendingInvite(i) && i.email !== email);
    if (!traveller || invited || (traveller.userId && traveller.userId !== userId)) return CO_OWNER_MESSAGES.travellerTaken;
    return null;
  }
  if (kind === 'maps') {
    if (role !== 'EDITOR') return null;
    const editors =
      db.mapMembers.filter((m) => m.mapId === item.id && m.role === 'EDITOR' && m.userId !== userId).length +
      db.invites.filter((i) => i.mapId === item.id && i.role === 'EDITOR' && pendingInvite(i) && i.email !== email).length;
    return editors + 1 > EDITORS_PER_MAP ? PEOPLE_CAP_MESSAGES.editors : null;
  }
  if (roleChangeOnly) return null;
  const people =
    db.tripMembers.filter((m) => m.tripId === item.id && m.userId !== userId).length +
    db.invites.filter((i) => i.tripId === item.id && pendingInvite(i) && i.email !== email).length;
  return people + 1 > PEOPLE_PER_TRIP ? PEOPLE_CAP_MESSAGES.tripPeople : null;
}

function manage(kind, id) {
  const { item, role } = loadResource(kind, id);
  if (!role) return { reply: fail(404, 'Not found.') };
  // A trip's role is the higher of the map's and its own: its map's owner or co-owners
  if (role !== 'OWNER' && role !== 'CO_OWNER') return { reply: fail(403, 'Only the owner and co-owners can manage sharing.') };
  return { item, role };
}

// A role from the body, and a co-owner's traveller -> { role, travellerId } or { error }
function parseRole(kind, body) {
  if (!ROLES_FOR[kind].includes(body.role)) return { error: ROLE_MESSAGE[kind] };
  if (body.role !== 'CO_OWNER') return { role: body.role, travellerId: null };
  if (typeof body.travellerId !== 'string' || !body.travellerId) return { error: CO_OWNER_MESSAGES.needsTraveller };
  return { role: body.role, travellerId: body.travellerId };
}

/**
 * Turn an invite into access for `userId` (the server's acceptInviteInDB): never lowering a
 * role they have; a co-owner becomes their traveller, or an editor if it's gone to someone
 * else meanwhile. Used by the accept route and by a sign-up from the invite's link.
 */
export function acceptInviteFor(invite, userId) {
  const db = getDb();
  const kind = invite.mapId ? 'maps' : 'trips';
  const id = invite.mapId || invite.tripId;
  const table = db[memberTable(kind)];
  // Mock mode has one signed-in user, who may own what they were invited to: nothing to add then
  if (userId === ownerIdOf(kind, kind === 'maps' ? db.maps.find((m) => m.id === id) : db.trips.find((t) => t.id === id))) {
    invite.acceptedAt = new Date().toISOString();
    return { kind, id };
  }
  const existing = table.find((m) => m[idField(kind)] === id && m.userId === userId);
  let role = invite.role;
  if (role === 'CO_OWNER' && existing?.role !== 'CO_OWNER' && !(invite.travellerId && linkTraveller(id, userId, invite.travellerId))) role = 'EDITOR';
  if (existing) existing.role = RANK[role] > RANK[existing.role] ? role : existing.role;
  else table.push({ [idField(kind)]: id, userId, role, createdAt: new Date().toISOString() });
  invite.acceptedAt = new Date().toISOString();
  return { kind, id };
}

// A paid map's invite offer, for the invite page (the server's GET /invites/:token)
function offerFor(map) {
  const plan = map ? mapPlanId(map) : null;
  return plan === 'REGULAR' || plan === 'PREMIUM' ? { plan, planName: planOf(plan).name } : null;
}

export function registerSharingRoutes() {
  for (const kind of ['maps', 'trips']) {
    const base = `/api/${kind}/:id`;

    route('GET', `${base}/sharing`, ({ params }) => {
      const { item, reply } = manage(kind, params.id);
      return reply || ok(sharingView(kind, item));
    });

    route('PATCH', `${base}/sharing`, ({ params, body }) => {
      const { item, reply } = manage(kind, params.id);
      if (reply) return reply;
      if (!LINK_ACCESS.includes(body.linkAccess)) return fail(400, 'Choose Restricted or Anyone with the link.');
      item.linkAccess = body.linkAccess;
      return ok(sharingView(kind, item));
    });

    route('POST', `${base}/sharing/reset-link`, ({ params }) => {
      const { item, reply } = manage(kind, params.id);
      if (reply) return reply;
      item.shareCode = newShareCode();
      return ok({ shareCode: formatShareCode(item.shareCode), shareUrl: shareUrlFor(item.shareCode) });
    });

    route('POST', `${base}/members`, ({ params, body }) => {
      const db = getDb();
      const { item, role: actorRole, reply } = manage(kind, params.id);
      if (reply) return reply;
      // As the server: the sharer's own address must be verified
      if (!me().emailVerified) return fail(403, VERIFY_FIRST);
      const email = String(body.email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, 'Enter a valid email address.');
      const parsed = parseRole(kind, body);
      if (parsed.error) return fail(400, parsed.error);
      const { role, travellerId } = parsed;
      if (email === me().email.toLowerCase()) return fail(400, 'That is your own address.');
      const user = db.users.find((u) => u.email.toLowerCase() === email);
      if (user && user.id === ownerIdOf(kind, item)) return fail(400, 'The owner already has access.');
      const table = db[memberTable(kind)];
      const existing = user ? table.find((m) => m[idField(kind)] === item.id && m.userId === user.id) : null;
      if (!canSetMemberRole(actorRole, existing?.role ?? null, role)) return fail(403, CO_OWNER_MESSAGES.onlyOwner);
      const full = seatProblem(kind, item, { role, userId: user?.id ?? null, email, travellerId });
      if (full) return fail(409, full);
      // Added straight away only when verified and active; anyone else gets an invite
      if (user && user.isActive !== false && user.emailVerified === true) {
        if (existing) existing.role = role;
        else table.push({ [idField(kind)]: item.id, userId: user.id, role, createdAt: new Date().toISOString() });
        if (role === 'CO_OWNER') linkTraveller(item.id, user.id, travellerId);
        const member = table.find((m) => m[idField(kind)] === item.id && m.userId === user.id);
        return ok({ member: memberView(kind, item, member) }, 201);
      }
      db.invites = db.invites.filter((i) => !(i[idField(kind)] === item.id && i.email === email && !i.acceptedAt));
      // A token, so the mock's invite page and sign-up can use it (the server emails it)
      const invite = { id: newId(), email, role, travellerId, mapId: kind === 'maps' ? item.id : null, tripId: kind === 'trips' ? item.id : null, invitedById: me().id, token: `mock-invite-${newId()}`, expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(), acceptedAt: null };
      db.invites.push(invite);
      return ok({ invite: inviteView(invite) }, 201);
    });

    route('PATCH', `${base}/members/:userId`, ({ params, body }) => {
      const db = getDb();
      const { item, role: actorRole, reply } = manage(kind, params.id);
      if (reply) return reply;
      const member = db[memberTable(kind)].find((m) => m[idField(kind)] === item.id && m.userId === params.userId);
      if (!member) return fail(404, 'That person could not be found.');
      const keep = member.role === 'CO_OWNER' && body.role === 'CO_OWNER';
      const parsed = keep ? { role: 'CO_OWNER' } : parseRole(kind, body);
      if (parsed.error) return fail(400, parsed.error);
      if (!canSetMemberRole(actorRole, member.role, parsed.role)) return fail(403, CO_OWNER_MESSAGES.onlyOwner);
      const u = db.users.find((x) => x.id === member.userId);
      if (!keep) {
        const full = seatProblem(kind, item, { role: parsed.role, userId: member.userId, email: u?.email ?? null, roleChangeOnly: true, travellerId: parsed.travellerId });
        if (full) return fail(409, full);
      }
      member.role = parsed.role;
      if (parsed.role === 'CO_OWNER' && !keep) linkTraveller(item.id, member.userId, parsed.travellerId);
      return ok({ member: memberView(kind, item, member) });
    });

    // The owner removes someone, a co-owner anyone but a co-owner, or a member leaves
    route('DELETE', `${base}/members/:userId`, ({ params }) => {
      const db = getDb();
      const { item, role } = loadResource(kind, params.id);
      if (!role) return fail(404, 'Not found.');
      const table = memberTable(kind);
      const target = db[table].find((m) => m[idField(kind)] === item.id && m.userId === params.userId);
      const allowed =
        params.userId === me().id || role === 'OWNER' || (role === 'CO_OWNER' && target?.role !== 'CO_OWNER');
      if (!allowed) return fail(403, 'Only the owner can remove a co-owner.');
      db[table] = db[table].filter((m) => !(m[idField(kind)] === item.id && m.userId === params.userId));
      // A co-owner's traveller stays, with no login
      if (kind === 'maps') {
        db.travellers.forEach((t) => {
          if (t.mapId === item.id && t.userId === params.userId) t.userId = null;
        });
      }
      // Leaving a trip also takes it off the maps that person added it to
      if (kind === 'trips') db.tripMaps = db.tripMaps.filter((l) => !(l.tripId === item.id && l.addedById === params.userId));
      return ok({ message: 'Removed.' });
    });

    route('DELETE', `${base}/invites/:inviteId`, ({ params }) => {
      const db = getDb();
      const { item, reply } = manage(kind, params.id);
      if (reply) return reply;
      db.invites = db.invites.filter((i) => !(i.id === params.inviteId && i[idField(kind)] === item.id));
      return ok({ message: 'Invite cancelled.' });
    });
  }

  // Invite links (the seeded one: /invite/demo-invite)
  route('POST', '/api/invites/accept', ({ body }) => {
    const db = getDb();
    if (!session.signedIn) return fail(401, 'No valid session. Please sign in.');
    const invite = db.invites.find((i) => i.token && i.token === body.token && !i.acceptedAt && i.expiresAt > new Date().toISOString());
    if (!invite) return fail(400, 'This invite link is invalid or has expired.');
    if (invite.email.toLowerCase() !== me().email.toLowerCase() || !me().emailVerified) {
      return fail(403, 'This invite was sent to a different email address.');
    }
    const kind = invite.mapId ? 'maps' : 'trips';
    const id = invite.mapId || invite.tripId;
    acceptInviteFor(invite, me().id);
    return ok({ resource: kind === 'maps' ? 'map' : 'trip', id });
  });

  // What an invite is for, signed out too (GET /api/invites/:token)
  route('GET', '/api/invites/:token', ({ params }) => {
    const db = getDb();
    const invite = db.invites.find((i) => i.token && i.token === params.token && !i.acceptedAt && i.expiresAt > new Date().toISOString());
    if (!invite) return fail(404, 'This invite link is invalid, has been used or has expired.');
    const map = invite.mapId ? db.maps.find((m) => m.id === invite.mapId) : null;
    const trip = invite.tripId ? db.trips.find((t) => t.id === invite.tripId) : null;
    const inviter = db.users.find((u) => u.id === invite.invitedById);
    const traveller = invite.travellerId ? db.travellers.find((t) => t.id === invite.travellerId) : null;
    return ok({
      invite: {
        email: invite.email,
        role: invite.role,
        kind: invite.mapId ? 'map' : 'trip',
        id: invite.mapId || invite.tripId,
        name: map?.name ?? trip?.title ?? null,
        invitedBy: inviter?.name ?? null,
        travellerName: traveller?.name ?? null,
        expiresAt: invite.expiresAt,
        offer: offerFor(map ?? db.maps.find((m) => m.id === trip?.mapId)),
      },
    });
  });

  // Share links: the caller's own role, else VIEWER when the link is on
  const resolveCode = (code) => {
    const db = getDb();
    const normal = normaliseShareCode(code);
    if (!normal) return null;
    const map = db.maps.find((m) => m.shareCode === normal);
    if (map) {
      const role = higherRole(mapRole(map), map.linkAccess === 'ANYONE_WITH_LINK' ? 'VIEWER' : null);
      return role ? { kind: 'map', item: map, role } : null;
    }
    const trip = db.trips.find((t) => t.shareCode === normal);
    if (trip) {
      const role = higherRole(tripRole(trip), trip.linkAccess === 'ANYONE_WITH_LINK' ? 'VIEWER' : null);
      return role ? { kind: 'trip', item: trip, role } : null;
    }
    return null;
  };
  const NOT_FOUND = 'This link has expired or was never shared with you.';

  route('GET', '/api/shared/:code', ({ params }) => {
    const shared = resolveCode(params.code);
    if (!shared) return fail(404, NOT_FOUND);
    const { kind, item, role } = shared;
    if (kind === 'map') {
      // Group trips added from other maps always in their limited form: a share link
      // never opens another map's trip
      const trips = mapTripsView(item, role, { viaShareLink: true });
      return ok({ resource: 'map', id: item.id, role, map: { ...mapView(item, role), ads: adsFor(item) }, trips });
    }
    // As the map's: a signed-out visitor counts as Economy (docs/API.md, "Travel offers")
    const map = getDb().maps.find((m) => m.id === item.mapId);
    return ok({ resource: 'trip', id: item.id, role, trip: { ...tripView(item, role, { viaShareLink: true }), ads: adsFor(map) } });
  });

  route('GET', '/api/shared/:code/photos', ({ params, query }) => {
    const shared = resolveCode(params.code);
    if (!shared) return fail(404, NOT_FOUND);
    const photos = getDb().photos.filter((p) => (shared.kind === 'map' ? p.mapId === shared.item.id : p.tripId === shared.item.id));
    // A shared trip's photos come in the trip's order
    // Never the best copies through a link (`best=1` is a 403), as the server
    const filters = shared.kind === 'trip' ? { ...query, tripId: shared.item.id } : query;
    const page = photoPage(photos, shared.role, filters, { allowBest: false });
    return page.error ? fail(page.status ?? 400, page.error) : ok(page);
  });

  // A country map through a map's link: its states visited and pins, as a viewer sees them
  route('GET', '/api/shared/:code/subdivisions', ({ params, query }) => {
    const shared = resolveCode(params.code);
    if (!shared || shared.kind !== 'map') return fail(404, NOT_FOUND);
    const country = countryMapOf(query.country, shared.item.splitUk);
    if (!country) return fail(400, COUNTRY_MAP_MESSAGES.countryMapNotFound);
    return ok({ subdivisions: subdivisionStatuses(shared.item.id, country) });
  });
  route('GET', '/api/shared/:code/pins', ({ params, query }) => {
    const shared = resolveCode(params.code);
    if (!shared || shared.kind !== 'map') return fail(404, NOT_FOUND);
    const country = countryMapOf(query.country, shared.item.splitUk);
    if (!country) return fail(400, COUNTRY_MAP_MESSAGES.countryMapNotFound);
    return ok({ pins: pinList(shared.item.id, country, shared.role) });
  });
  route('GET', '/api/shared/:code/pins/:pinId', ({ params }) => {
    const shared = resolveCode(params.code);
    if (!shared || shared.kind !== 'map') return fail(404, NOT_FOUND);
    const pin = pinDetail(params.pinId, shared.role, { mapId: shared.item.id });
    return pin ? ok({ pin }) : fail(404, COUNTRY_MAP_MESSAGES.pinNotFound);
  });

  // The map's moments, or the trip's (with that trip's photos only); never hidden ones below editor
  route('GET', '/api/shared/:code/moments', ({ params, query }) => {
    const shared = resolveCode(params.code);
    if (!shared) return fail(404, NOT_FOUND);
    const scope =
      shared.kind === 'map'
        ? { mapId: shared.item.id, photoAccess: { mapRole: shared.role, trip: null } }
        : { mapId: shared.item.mapId, tripId: shared.item.id, photoAccess: { mapRole: null, trip: { id: shared.item.id, role: shared.role } } };
    const page = momentPage({ query, ...scope, role: shared.role });
    return page.error ? fail(400, page.error) : ok(page);
  });

  // A map link's country tickets, every first page in one reply (map links only, as the server)
  route('GET', '/api/shared/:code/country-lists', ({ params, query }) => {
    const shared = resolveCode(params.code);
    if (!shared || shared.kind !== 'map') return fail(404, NOT_FOUND);
    const photos = getDb().photos.filter((p) => p.mapId === shared.item.id);
    const lists = countryListPages({ query, photos, role: shared.role, mapId: shared.item.id, photoAccess: { mapRole: shared.role, trip: null } });
    return lists.error ? fail(lists.status ?? 400, lists.error) : ok(lists);
  });

  route('GET', '/api/shared/:code/photos/:photoId', ({ params }) => {
    const shared = resolveCode(params.code);
    if (!shared) return fail(404, NOT_FOUND);
    const photo = getDb().photos.find((p) => p.id === params.photoId);
    const inScope = photo && (shared.kind === 'map' ? photo.mapId === shared.item.id : photo.tripId === shared.item.id);
    if (!inScope || !canSeePhoto(photo, shared.role)) return fail(404, 'This photo could not be found.');
    return deny(shared.role, 'VIEWER') || ok({ photo: photoDetail(photo, shared.role) });
  });
}
