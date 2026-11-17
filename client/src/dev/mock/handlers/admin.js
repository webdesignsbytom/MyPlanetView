// Mock mode only: the contact form, and the admin pages (users, contact forms, and the
// developer audit log) with a few fake rows. Switch roles from the mock badge.
import { fail, ok, route } from '../mockAdapter';
import { getDb, me, newId, session } from '../store';
import { CONTACT_IMAGE_MAX_AGE_MS, UPLOAD_IMAGE_EXTENSIONS, mockUpload } from '../uploads';

// As the server's normalizeEmail (utils/sanitize.js): one plain address, at most 254
const EMAIL_ADDRESS = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:".]+$/;
const cleanEmail = (value) => {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return email.length <= 254 && EMAIL_ADDRESS.test(email) ? email : null;
};

// As the server: a confirmed contact image, uploaded within the hour, on no other form
function usableContactImage(key) {
  const upload = typeof key === 'string' ? mockUpload(key) : null;
  if (!upload?.confirmed || upload.resource !== 'contact' || !UPLOAD_IMAGE_EXTENSIONS[upload.contentType]) return false;
  if (Date.now() - upload.createdAt > CONTACT_IMAGE_MAX_AGE_MS) return false;
  return !getDb().contactForms.some((c) => c.imageKey === key);
}

const isAdmin = () => session.signedIn && ['ADMIN', 'DEVELOPER'].includes(me().role);
const isDeveloper = () => session.signedIn && me().role === 'DEVELOPER';
const forbidden = () => (session.signedIn ? fail(403, 'Admins only.') : fail(401, 'No valid session. Please sign in.'));
const adminUser = ({ id, name, email, emailVerified, role, isActive, image, createdAt, updatedAt }) => ({ id, name, email, emailVerified, role, isActive, image, createdAt, updatedAt });
const person = (id) => {
  const u = getDb().users.find((x) => x.id === id);
  return u ? { id: u.id, name: u.name, email: u.email } : null;
};
const eventView = (e) => ({ ...e, actor: person(e.actorId), target: person(e.targetId) });

function page(list, query) {
  const pageNo = Math.max(Number(query.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize) || 20, 1), 100);
  return { items: list.slice((pageNo - 1) * pageSize, pageNo * pageSize), total: list.length, page: pageNo, pageSize };
}

export function registerAdminRoutes() {
  // Contact
  route('POST', '/api/contact/create-new-contact-form', ({ body }) => {
    const name = String(body.name || '').trim();
    const email = cleanEmail(body.email);
    const message = String(body.message || '').trim();
    if (!name || !message) return fail(400, 'Malformed data.');
    if (!email) return fail(400, 'Enter a valid email address.');
    if (body.imageKey && !usableContactImage(body.imageKey)) {
      return fail(400, 'The attached image has expired or can’t be used. Please attach it again.');
    }
    const contactForm = { id: newId(), name, email, message: message.slice(0, 2000), imageKey: body.imageKey || null, createdAt: new Date().toISOString() };
    getDb().contactForms.unshift(contactForm);
    return ok({ contactForm }, 201);
  });
  route('GET', '/api/contact/get-all-contact-forms', () => (isAdmin() ? ok({ contactForms: getDb().contactForms }) : forbidden()));
  route('DELETE', '/api/contact/delete-contact-form/:id', ({ params }) => {
    if (!isAdmin()) return forbidden();
    getDb().contactForms = getDb().contactForms.filter((c) => c.id !== params.id);
    return ok({ message: 'Success: Contact form deleted' });
  });
  route('DELETE', '/api/contact/delete-all-contact-forms', () => {
    if (!isAdmin()) return forbidden();
    getDb().contactForms = [];
    return ok({ message: 'Success: All contact forms deleted' });
  });

  // Admin users
  route('GET', '/api/users/admin/get-all-users', ({ query }) => {
    if (!isAdmin()) return forbidden();
    const search = String(query.search || '').toLowerCase();
    const list = getDb().users.filter(
      (u) =>
        (!search || u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)) &&
        (!query.role || u.role === query.role) &&
        (!query.status || (query.status === 'active') === u.isActive),
    );
    const { items, total, page: pageNo, pageSize } = page(list, query);
    return ok({ users: items.map(adminUser), total, page: pageNo, pageSize });
  });
  route('GET', '/api/users/admin/get-user-by-id/:userId', ({ params }) => {
    if (!isAdmin()) return forbidden();
    const user = getDb().users.find((u) => u.id === params.userId);
    return user ? ok({ user: adminUser(user) }) : fail(404, 'User not found.');
  });
  route('PATCH', '/api/users/admin/change-user-role', ({ body }) => {
    if (!isAdmin()) return forbidden();
    const user = getDb().users.find((u) => u.id === body.userId);
    if (!user) return fail(404, 'User not found.');
    if (user.id === me().id) return fail(403, 'You cannot change your own role.');
    if (user.role === 'DEVELOPER' && me().role !== 'DEVELOPER') return fail(403, 'Only a developer can manage developer accounts.');
    if (!['USER', 'ADMIN', 'DEVELOPER'].includes(body.newRole)) return fail(400, 'Unknown role.');
    if (body.newRole === 'DEVELOPER' && me().role !== 'DEVELOPER') return fail(403, 'Only a developer can grant developer.');
    user.role = body.newRole;
    return ok({ user: adminUser(user) });
  });
  for (const [path, isActive] of [['deactivate-user', false], ['reactivate-user', true]]) {
    route('PATCH', `/api/users/admin/${path}/:userId`, ({ params }) => {
      if (!isAdmin()) return forbidden();
      const user = getDb().users.find((u) => u.id === params.userId);
      if (!user) return fail(404, 'User not found.');
      if (user.id === me().id) return fail(403, 'You cannot change your own status.');
      if (user.role === 'DEVELOPER' && me().role !== 'DEVELOPER') return fail(403, 'Only a developer can manage developer accounts.');
      user.isActive = isActive;
      return ok({ user: adminUser(user) });
    });
  }
  route('DELETE', '/api/users/admin/delete-user-by-id/:userId', ({ params }) => {
    if (!isAdmin()) return forbidden();
    if (params.userId === me().id) return fail(403, 'You cannot delete yourself.');
    if (getDb().users.find((u) => u.id === params.userId)?.role === 'DEVELOPER' && me().role !== 'DEVELOPER') {
      return fail(403, 'Only a developer can manage developer accounts.');
    }
    getDb().users = getDb().users.filter((u) => u.id !== params.userId);
    return ok({ message: 'User deleted.' });
  });

  // Audit log (developer only)
  route('GET', '/api/events/get-paginated-events', ({ query }) => {
    if (!isDeveloper()) return forbidden();
    const search = String(query.search || '').toLowerCase();
    const list = getDb().events.filter(
      (e) =>
        (!query.level || e.level === query.level) &&
        (!query.domain || e.domain === query.domain) &&
        (!query.status || e.status === query.status) &&
        (!search || e.message.toLowerCase().includes(search)),
    );
    const { items, total, page: pageNo, pageSize } = page(list, query);
    return ok({ events: items.map(eventView), total, page: pageNo, pageSize });
  });
  route('GET', '/api/events/get-event-by-id/:eventId', ({ params }) => {
    if (!isDeveloper()) return forbidden();
    const event = getDb().events.find((e) => e.id === params.eventId);
    return event ? ok({ event: eventView(event) }) : fail(404, 'Event not found.');
  });
  route('PATCH', '/api/events/update-event-status/:eventId', ({ params, body }) => {
    if (!isDeveloper()) return forbidden();
    const event = getDb().events.find((e) => e.id === params.eventId);
    if (!event) return fail(404, 'Event not found.');
    event.status = body.status || event.status;
    return ok({ event: eventView(event) });
  });
  route('DELETE', '/api/events/delete-event/:eventId', ({ params }) => {
    if (!isDeveloper()) return forbidden();
    getDb().events = getDb().events.filter((e) => e.id !== params.eventId);
    return ok({ message: 'Event deleted.', id: params.eventId });
  });
  route('DELETE', '/api/events/delete-all-events', () => {
    if (!isDeveloper()) return forbidden();
    const count = getDb().events.length;
    getDb().events = [];
    return ok({ message: 'All events deleted.', count });
  });
}
