// Mock mode only: Google Docs style sharing for maps and trips (one module for both),
// invite links and share codes.
import { RANK, deny, fail, ok, route } from '../mockAdapter';
import { formatShareCode, getDb, me, newId, newShareCode, normaliseShareCode, session, shareUrlFor } from '../store';
import { canSeePhoto, higherRole, mapRole, mapTripsView, mapView, photoDetail, photoPage, tripRole, tripView } from '../views';
import { EDITORS_PER_MAP, PEOPLE_CAP_MESSAGES, PEOPLE_PER_TRIP } from '../plans';
import { momentPage } from '../moments';

const ROLES = ['VIEWER', 'EDITOR'];
const LINK_ACCESS = ['RESTRICTED', 'ANYONE_WITH_LINK'];
// The server's EVENT_MESSAGES.shareNeedsVerifiedEmail
const VERIFY_FIRST = 'Verify your email address before adding people. Use the link we emailed you, or send a new one from your account page.';
const memberTable = (kind) => (kind === 'maps' ? 'mapMembers' : 'tripMembers');
const idField = (kind) => (kind === 'maps' ? 'mapId' : 'tripId');

// The resource and the caller's role; only the owner (a trip's map owner) manages sharing
function loadResource(kind, id) {
  const db = getDb();
  if (kind === 'maps') {
    const item = db.maps.find((m) => m.id === id) || null;
    return { item, role: mapRole(item) };
  }
  const item = db.trips.find((t) => t.id === id) || null;
  const map = item ? db.maps.find((m) => m.id === item.mapId) : null;
  return { item, role: tripRole(item), isOwner: Boolean(map && map.ownerId === me().id) };
}

function sharingView(kind, item) {
  const db = getDb();
  const members = db[memberTable(kind)]
    .filter((m) => m[idField(kind)] === item.id)
    .map((m) => {
      const u = db.users.find((x) => x.id === m.userId);
      return { userId: m.userId, name: u?.name || 'Someone', email: u?.email || '', role: m.role };
    });
  const invites = db.invites
    .filter((i) => i[idField(kind)] === item.id && !i.acceptedAt)
    .map(({ id, email, role, expiresAt }) => ({ id, email, role, expiresAt }));
  return { linkAccess: item.linkAccess, shareCode: formatShareCode(item.shareCode), shareUrl: shareUrlFor(item.shareCode), members, invites };
}

// The caps on people (docs/API.md, "Sharing"): a map's editors (EDITOR members plus
// pending EDITOR invites) and a trip's people (members of any role plus pending invites),
// leaving out the person being added. -> null, or the 409 message
const pendingInvite = (invite) => !invite.acceptedAt && invite.expiresAt > new Date().toISOString();
function seatProblem(kind, item, { role, userId = null, email = null, roleChangeOnly = false }) {
  const db = getDb();
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
  const { item, role, isOwner } = loadResource(kind, id);
  const owner = kind === 'maps' ? role === 'OWNER' : isOwner;
  if (!role) return { reply: fail(404, 'Not found.') };
  if (!owner) return { reply: fail(403, 'Only the owner can manage sharing.') };
  return { item };
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
      const { item, reply } = manage(kind, params.id);
      if (reply) return reply;
      // As the server: the sharer's own address must be verified
      if (!me().emailVerified) return fail(403, VERIFY_FIRST);
      const email = String(body.email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(400, 'Enter a valid email address.');
      if (!ROLES.includes(body.role)) return fail(400, 'Choose viewer or editor.');
      if (email === me().email.toLowerCase()) return fail(400, 'That is your own address.');
      const user = db.users.find((u) => u.email.toLowerCase() === email);
      const full = seatProblem(kind, item, { role: body.role, userId: user?.id ?? null, email });
      if (full) return fail(409, full);
      const table = db[memberTable(kind)];
      // Added straight away only when verified and active; anyone else gets an invite
      if (user && user.isActive !== false && user.emailVerified === true) {
        const existing = table.find((m) => m[idField(kind)] === item.id && m.userId === user.id);
        if (existing) existing.role = body.role;
        else table.push({ [idField(kind)]: item.id, userId: user.id, role: body.role, createdAt: new Date().toISOString() });
        return ok({ member: { userId: user.id, name: user.name, email: user.email, role: body.role } }, 201);
      }
      db.invites = db.invites.filter((i) => !(i[idField(kind)] === item.id && i.email === email && !i.acceptedAt));
      const invite = { id: newId(), email, role: body.role, mapId: kind === 'maps' ? item.id : null, tripId: kind === 'trips' ? item.id : null, invitedById: me().id, token: null, expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(), acceptedAt: null };
      db.invites.push(invite);
      return ok({ invite: { id: invite.id, email, role: invite.role, expiresAt: invite.expiresAt } }, 201);
    });

    route('PATCH', `${base}/members/:userId`, ({ params, body }) => {
      const db = getDb();
      const { item, reply } = manage(kind, params.id);
      if (reply) return reply;
      if (!ROLES.includes(body.role)) return fail(400, 'Choose viewer or editor.');
      const member = db[memberTable(kind)].find((m) => m[idField(kind)] === item.id && m.userId === params.userId);
      if (!member) return fail(404, 'That person could not be found.');
      const u = db.users.find((x) => x.id === member.userId);
      const full = seatProblem(kind, item, { role: body.role, userId: member.userId, email: u?.email ?? null, roleChangeOnly: true });
      if (full) return fail(409, full);
      member.role = body.role;
      return ok({ member: { userId: member.userId, name: u?.name || '', email: u?.email || '', role: member.role } });
    });

    // The owner removes someone, or a member leaves
    route('DELETE', `${base}/members/:userId`, ({ params }) => {
      const db = getDb();
      const { item, role, isOwner } = loadResource(kind, params.id);
      if (!role) return fail(404, 'Not found.');
      const owner = kind === 'maps' ? role === 'OWNER' : isOwner;
      if (!owner && params.userId !== me().id) return fail(403, 'Only the owner can remove people.');
      const table = memberTable(kind);
      db[table] = db[table].filter((m) => !(m[idField(kind)] === item.id && m.userId === params.userId));
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
    const table = db[memberTable(kind)];
    const existing = table.find((m) => m[idField(kind)] === id && m.userId === me().id);
    if (existing) existing.role = RANK[invite.role] > RANK[existing.role] ? invite.role : existing.role;
    else table.push({ [idField(kind)]: id, userId: me().id, role: invite.role, createdAt: new Date().toISOString() });
    invite.acceptedAt = new Date().toISOString();
    return ok({ resource: kind === 'maps' ? 'map' : 'trip', id });
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
      return ok({ resource: 'map', id: item.id, role, map: mapView(item, role), trips });
    }
    return ok({ resource: 'trip', id: item.id, role, trip: tripView(item, role, { viaShareLink: true }) });
  });

  route('GET', '/api/shared/:code/photos', ({ params, query }) => {
    const shared = resolveCode(params.code);
    if (!shared) return fail(404, NOT_FOUND);
    const photos = getDb().photos.filter((p) => (shared.kind === 'map' ? p.mapId === shared.item.id : p.tripId === shared.item.id));
    // A shared trip's photos come in the trip's order
    const page = photoPage(photos, shared.role, shared.kind === 'trip' ? { ...query, tripId: shared.item.id } : query);
    return page.error ? fail(400, page.error) : ok(page);
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

  route('GET', '/api/shared/:code/photos/:photoId', ({ params }) => {
    const shared = resolveCode(params.code);
    if (!shared) return fail(404, NOT_FOUND);
    const photo = getDb().photos.find((p) => p.id === params.photoId);
    const inScope = photo && (shared.kind === 'map' ? photo.mapId === shared.item.id : photo.tripId === shared.item.id);
    if (!inScope || !canSeePhoto(photo, shared.role)) return fail(404, 'This photo could not be found.');
    return deny(shared.role, 'VIEWER') || ok({ photo: photoDetail(photo, shared.role) });
  });
}
