// The developers' event log (/api/events): listing, paging and filtering, one event,
// triage and deleting. Every route is for developers only: an admin is refused too.
// "Delete all" empties the whole app_event table: fine here, as this only ever runs
// against a throwaway *_test database, one file at a time.
import { afterAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, prisma, signUp } from './helpers.js';

// This file's own events carry this domain, so the lists can be filtered to them
const DOMAIN = `it-${Date.now().toString(36)}`;
const eventIds = new Set();
afterAll(async () => {
  await prisma.appEvent.deleteMany({ where: { OR: [{ id: { in: [...eventIds] } }, { domain: { startsWith: DOMAIN } }] } });
  await cleanUp();
});

async function withRole(label, role) {
  const person = await signUp(label);
  await prisma.user.update({ where: { id: person.user.id }, data: { role } });
  return person;
}

async function makeEvent(fields = {}) {
  const event = await prisma.appEvent.create({
    data: { domain: DOMAIN, action: 'test', message: 'A test event', level: 'INFO', ...fields },
  });
  eventIds.add(event.id);
  return event;
}

const ROUTES = (id) => [
  ['get', '/api/events/get-all-events'],
  ['get', '/api/events/get-paginated-events'],
  ['get', `/api/events/get-event-by-id/${id}`],
  ['patch', `/api/events/update-event-status/${id}`],
  ['delete', `/api/events/delete-event/${id}`],
  ['delete', '/api/events/delete-all-events'],
];

describe('who may use the event log', () => {
  it('refuses a visitor (401), a plain user and an admin (403)', async () => {
    const event = await makeEvent();
    const user = await signUp('Events user');
    const admin = await withRole('Events admin', 'ADMIN');
    for (const [method, path] of ROUTES(event.id)) {
      expect((await anon()[method](path).send({ status: 'RESOLVED' })).status, `${method} ${path}`).toBe(401);
      expect((await user.agent[method](path).send({ status: 'RESOLVED' })).status, `${method} ${path}`).toBe(403);
      const refused = await admin.agent[method](path).send({ status: 'RESOLVED' });
      expect(refused.status, `${method} ${path}`).toBe(403);
      expect(refused.body.message).toBe('This action requires a developer role.');
    }
    // Nothing changed
    expect(await prisma.appEvent.findUnique({ where: { id: event.id } })).toMatchObject({ status: 'OPEN' });
  });
});

describe('reading events', () => {
  it('lists the newest events, with their actor and target', async () => {
    const developer = await withRole('Events developer', 'DEVELOPER');
    const subject = await signUp('Events subject');
    const older = await makeEvent({ message: 'Older', createdAt: new Date(Date.now() - 60_000) });
    const newer = await makeEvent({ message: 'Newer', actorId: developer.user.id, targetId: subject.user.id });

    const res = await developer.agent.get('/api/events/get-all-events');
    expect(res.status).toBe(200);
    const { events } = data(res);
    expect(events.length).toBeLessThanOrEqual(500);
    const ids = events.map((e) => e.id);
    expect(ids.indexOf(newer.id)).toBeLessThan(ids.indexOf(older.id));
    const shown = events.find((e) => e.id === newer.id);
    expect(shown.actor).toEqual({ id: developer.user.id, name: 'Events developer', email: developer.email });
    expect(shown.target).toEqual({ id: subject.user.id, name: 'Events subject', email: subject.email });
  });

  it('pages and filters by level, status, domain and words', async () => {
    const developer = await withRole('Events pager', 'DEVELOPER');
    // A domain of their own, so only these three match
    const domain = `${DOMAIN}-page`;
    const at = (minutesAgo) => new Date(Date.now() - minutesAgo * 60_000);
    const info = await makeEvent({ domain, message: 'Sign-in went fine', createdAt: at(3) });
    const warning = await makeEvent({ domain, level: 'WARNING', message: 'Slow bucket', createdAt: at(2) });
    const error = await makeEvent({ domain, level: 'ERROR', status: 'ACKNOWLEDGED', action: 'upload-failed', message: 'Bucket down', createdAt: at(1) });
    const page = async (query) => {
      const res = await developer.agent.get('/api/events/get-paginated-events').query({ domain, ...query });
      expect(res.status).toBe(200);
      return data(res);
    };

    const all = await page({ pageSize: 2 });
    expect(all).toMatchObject({ page: 1, pageSize: 2 });
    expect(all.total).toBe(3);
    expect(all.events.map((e) => e.id)).toEqual([error.id, warning.id]);
    const second = await page({ page: 2, pageSize: 2 });
    expect(second).toMatchObject({ page: 2, total: 3 });
    expect(second.events.map((e) => e.id)).toEqual([info.id]);

    expect((await page({ level: 'warning' })).events.map((e) => e.id)).toEqual([warning.id]);
    expect((await page({ status: 'acknowledged' })).events.map((e) => e.id)).toEqual([error.id]);
    // The message or the action, any case
    expect((await page({ search: 'BUCKET' })).events.map((e) => e.id)).toEqual([error.id, warning.id]);
    expect((await page({ search: 'upload-failed' })).events.map((e) => e.id)).toEqual([error.id]);
    // Unknown filters are ignored, and the page size is kept to 1-100
    const loose = await page({ level: 'LOUD', status: 'MAYBE', pageSize: 5000, page: 0 });
    expect(loose).toMatchObject({ page: 1, pageSize: 100 });
    expect(loose.events.map((e) => e.id)).toEqual([error.id, warning.id, info.id]);
    // Another domain's events aren't in it
    expect((await page({ domain: `${DOMAIN}-none` })).total).toBe(0);
  });

  it('shows one event, and answers an unknown id with 404', async () => {
    const developer = await withRole('Events reader', 'DEVELOPER');
    const event = await makeEvent({ message: 'Just this one', actorId: developer.user.id });
    const res = await developer.agent.get(`/api/events/get-event-by-id/${event.id}`);
    expect(res.status).toBe(200);
    expect(data(res).event).toMatchObject({ id: event.id, message: 'Just this one', actor: { id: developer.user.id } });
    expect((await developer.agent.get('/api/events/get-event-by-id/00000000-0000-4000-8000-000000000000')).status).toBe(404);
  });
});

describe('triage', () => {
  it('sets a known status (any case), refuses another with 400 and an unknown event with 404', async () => {
    const developer = await withRole('Events triager', 'DEVELOPER');
    const event = await makeEvent();
    const set = (id, status) => developer.agent.patch(`/api/events/update-event-status/${id}`).send({ status });

    const res = await set(event.id, 'resolved');
    expect(res.status).toBe(200);
    expect(data(res).event).toMatchObject({ id: event.id, status: 'RESOLVED' });
    expect((await prisma.appEvent.findUniqueOrThrow({ where: { id: event.id } })).status).toBe('RESOLVED');

    for (const status of ['DONE', '', undefined]) {
      const refused = await set(event.id, status);
      expect(refused.status).toBe(400);
      expect(refused.body.message).toBe('Event status must be OPEN, ACKNOWLEDGED, RESOLVED or IGNORED.');
    }
    expect((await set('00000000-0000-4000-8000-000000000000', 'IGNORED')).status).toBe(404);
  });
});

describe('deleting events', () => {
  it('deletes one; deleting it again is a 404', async () => {
    const developer = await withRole('Events deleter', 'DEVELOPER');
    const event = await makeEvent();
    const res = await developer.agent.delete(`/api/events/delete-event/${event.id}`);
    expect(res.status).toBe(200);
    expect(data(res)).toEqual({ message: 'Event deleted.', id: event.id });
    expect(await prisma.appEvent.findUnique({ where: { id: event.id } })).toBeNull();
    expect((await developer.agent.delete(`/api/events/delete-event/${event.id}`)).status).toBe(404);
  });

  it('deletes them all, saying how many', async () => {
    const developer = await withRole('Events wiper', 'DEVELOPER');
    await makeEvent();
    await makeEvent();
    const res = await developer.agent.delete('/api/events/delete-all-events');
    expect(res.status).toBe(200);
    expect(data(res).message).toBe('All events deleted.');
    expect(data(res).count).toBeGreaterThanOrEqual(2);
    expect(await prisma.appEvent.count({ where: { domain: DOMAIN } })).toBe(0);
  });
});
