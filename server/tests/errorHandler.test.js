import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
// No DB writes from the handler under test
const createAppEvent = vi.fn(async () => ({}));
vi.mock('../src/event/events.js', async (importOriginal) => ({
  ...(await importOriginal()),
  createAppEvent,
}));
// App under test
const { default: app } = await import('../src/server.js');

describe('global error handler', () => {
  it('answers malformed JSON with a 400 message, not a 500', async () => {
    const res = await request(app)
      .post('/api/contact/create-new-contact-form')
      .set('Content-Type', 'application/json')
      .send('{"firstName": ');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ status: 'fail', message: expect.any(String) });
    expect(createAppEvent).not.toHaveBeenCalledWith(expect.objectContaining({ level: 'CRITICAL' }));
  });

  it('answers an oversized body with 413', async () => {
    const res = await request(app)
      .post('/api/contact/create-new-contact-form')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ message: 'x'.repeat(2_100_000) }));

    expect(res.status).toBe(413);
    expect(res.body.message).toMatch(/too large/i);
  });

  it('answers unknown API paths with a JSON message', async () => {
    const res = await request(app).get('/api/no-such-route').set('Accept', 'application/json');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ status: 'fail', message: '404 Not Found' });
  });

  it('marks every response noindex', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-robots-tag']).toBe('noindex, nofollow');
  });
});
