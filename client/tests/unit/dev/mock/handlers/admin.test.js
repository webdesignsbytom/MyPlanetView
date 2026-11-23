import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { presignMockUpload, confirmMockUpload } from '@/dev/mock/uploads';
import { ALEX, PAUSED, USER, db, del, freshStore, get, patch, post, registerAllRoutes, signOut, testUser } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

const as = (role) => {
  testUser().role = role;
};

describe('the contact form', () => {
  it('takes a message from anyone, newest first', async () => {
    signOut();
    const { status, data } = await post('/api/contact/create-new-contact-form', { name: ' Ana ', email: ' Ana@Example.test ', message: ' Hello ' });
    expect(status).toBe(201);
    expect(data.contactForm).toMatchObject({ name: 'Ana', email: 'ana@example.test', message: 'Hello', imageKey: null });
    expect(db().contactForms[0].id).toBe(data.contactForm.id);
  });

  it('refuses a form with no name, message or real address', async () => {
    expect((await post('/api/contact/create-new-contact-form', { email: 'a@b.co', message: 'x' })).status).toBe(400);
    expect((await post('/api/contact/create-new-contact-form', { name: 'a', email: 'a@b.co' })).status).toBe(400);
    expect((await post('/api/contact/create-new-contact-form', { name: 'a', email: 'nope', message: 'x' })).message).toBe('Enter a valid email address.');
  });

  it('takes a confirmed contact image from the last hour, once', async () => {
    const key = 'myplanetview/contact/anon/a.png';
    presignMockUpload(key, { resource: 'contact', contentType: 'image/png', bytes: 3 });
    const form = { name: 'a', email: 'a@b.co', message: 'x', imageKey: key };
    expect((await post('/api/contact/create-new-contact-form', form)).status).toBe(400);
    confirmMockUpload(key, true);
    expect((await post('/api/contact/create-new-contact-form', form)).status).toBe(201);
    expect((await post('/api/contact/create-new-contact-form', form)).status).toBe(400);
    const old = 'myplanetview/contact/anon/old.png';
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() - 2 * 3600000);
    presignMockUpload(old, { resource: 'contact', contentType: 'image/png', bytes: 3 });
    vi.restoreAllMocks();
    confirmMockUpload(old, true);
    expect((await post('/api/contact/create-new-contact-form', { ...form, imageKey: old })).status).toBe(400);
  });

  it('lists and deletes forms for admins only', async () => {
    expect((await get('/api/contact/get-all-contact-forms')).status).toBe(403);
    as('ADMIN');
    expect((await get('/api/contact/get-all-contact-forms')).data.contactForms).toHaveLength(2);
    await del('/api/contact/delete-contact-form/contact-1');
    expect(db().contactForms.map((c) => c.id)).toEqual(['contact-2']);
    await del('/api/contact/delete-all-contact-forms');
    expect(db().contactForms).toEqual([]);
    signOut();
    expect((await get('/api/contact/get-all-contact-forms')).status).toBe(401);
  });
});

describe('the admin users page', () => {
  it('is for admins and developers only', async () => {
    expect((await get('/api/users/admin/get-all-users')).status).toBe(403);
    as('DEVELOPER');
    expect((await get('/api/users/admin/get-all-users')).status).toBe(200);
  });

  it('searches, filters and pages the users, never their passwords', async () => {
    as('ADMIN');
    expect((await get('/api/users/admin/get-all-users', { search: 'MORGAN' })).data.users.map((u) => u.id)).toEqual([ALEX]);
    expect((await get('/api/users/admin/get-all-users', { status: 'inactive' })).data.users.map((u) => u.id)).toEqual([PAUSED]);
    expect((await get('/api/users/admin/get-all-users', { role: 'ADMIN' })).data.users.map((u) => u.id).sort()).toEqual(['mock-admin', USER]);
    const paged = await get('/api/users/admin/get-all-users', { page: 2, pageSize: 3 });
    expect(paged.data).toMatchObject({ page: 2, pageSize: 3, total: db().users.length });
    expect(paged.data.users).toHaveLength(3);
    testUser().password = 'secret';
    expect('password' in (await get(`/api/users/admin/get-user-by-id/${USER}`)).data.user).toBe(false);
    expect((await get('/api/users/admin/get-user-by-id/nope')).status).toBe(404);
  });

  it('changes another account’s role, never their own, and only a developer makes or manages a developer', async () => {
    as('ADMIN');
    expect((await patch('/api/users/admin/change-user-role', { userId: ALEX, newRole: 'ADMIN' })).data.user.role).toBe('ADMIN');
    expect((await patch('/api/users/admin/change-user-role', { userId: USER, newRole: 'USER' })).status).toBe(403);
    expect((await patch('/api/users/admin/change-user-role', { userId: ALEX, newRole: 'KING' })).status).toBe(400);
    expect((await patch('/api/users/admin/change-user-role', { userId: ALEX, newRole: 'DEVELOPER' })).status).toBe(403);
    expect((await patch('/api/users/admin/change-user-role', { userId: 'nope', newRole: 'USER' })).status).toBe(404);
    as('DEVELOPER');
    expect((await patch('/api/users/admin/change-user-role', { userId: ALEX, newRole: 'DEVELOPER' })).data.user.role).toBe('DEVELOPER');
    as('ADMIN');
    expect((await patch(`/api/users/admin/deactivate-user/${ALEX}`)).message).toBe('Only a developer can manage developer accounts.');
    expect((await del(`/api/users/admin/delete-user-by-id/${ALEX}`)).status).toBe(403);
  });

  it('deactivates and reactivates others, and deletes them', async () => {
    as('ADMIN');
    expect((await patch(`/api/users/admin/deactivate-user/${ALEX}`)).data.user.isActive).toBe(false);
    expect((await patch(`/api/users/admin/reactivate-user/${ALEX}`)).data.user.isActive).toBe(true);
    expect((await patch(`/api/users/admin/deactivate-user/${USER}`)).status).toBe(403);
    expect((await patch('/api/users/admin/deactivate-user/nope')).status).toBe(404);
    expect((await del(`/api/users/admin/delete-user-by-id/${USER}`)).status).toBe(403);
    expect((await del(`/api/users/admin/delete-user-by-id/${ALEX}`)).status).toBe(200);
    expect(db().users.some((u) => u.id === ALEX)).toBe(false);
  });
});

describe('the audit log', () => {
  it('is for developers only', async () => {
    as('ADMIN');
    expect((await get('/api/events/get-paginated-events')).status).toBe(403);
    expect((await del('/api/events/delete-all-events')).status).toBe(403);
  });

  it('filters, shows, updates and deletes events, naming who did what', async () => {
    as('DEVELOPER');
    const all = await get('/api/events/get-paginated-events');
    expect(all.data.total).toBe(4);
    expect(all.data.events[0].actor).toEqual({ id: USER, name: 'Charlie Reid', email: 'test@myplanetview.local' });
    expect((await get('/api/events/get-paginated-events', { level: 'ERROR' })).data.events.map((e) => e.id)).toEqual(['event-3']);
    expect((await get('/api/events/get-paginated-events', { search: 'DEMO ROW' })).data.events.map((e) => e.id)).toEqual(['event-4']);
    expect((await get('/api/events/get-event-by-id/event-4')).data.event.actor).toBeNull();
    expect((await get('/api/events/get-event-by-id/nope')).status).toBe(404);
    expect((await patch('/api/events/update-event-status/event-1', { status: 'RESOLVED' })).data.event.status).toBe('RESOLVED');
    expect((await patch('/api/events/update-event-status/nope', {})).status).toBe(404);
    expect((await del('/api/events/delete-event/event-1')).data).toEqual({ message: 'Event deleted.', id: 'event-1' });
    expect((await del('/api/events/delete-all-events')).data.count).toBe(3);
  });
});
