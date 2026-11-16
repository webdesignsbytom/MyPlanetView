// No reply is kept by a cache unless its route says so (server.js): the Netlify site passes
// /api and /go through to the API, and its CDN must never keep one person's reply for
// another. Public reference data sets its own (controllers/places.js).
import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
// No DB writes or reads from the app under test
vi.mock('../src/event/events.js', async (importOriginal) => ({
  ...(await importOriginal()),
  createAppEvent: vi.fn(async () => ({})),
}));
vi.mock('../src/domain/places.js', async (importOriginal) => ({
  ...(await importOriginal()),
  findAllCountries: vi.fn(async () => [{ code: 'FR', name: 'France' }]),
}));
// App under test (placeholder auth and origin settings on the command line)
const { default: app } = await import('../src/server.js');
const { REFERENCE_CACHE_CONTROL } = await import('../src/controllers/places.js');

describe('caching', () => {
  it('marks every reply no-store by default', async () => {
    const health = await request(app).get('/health');
    expect(health.status).toBe(200);
    expect(health.headers['cache-control']).toBe('no-store');
    const missing = await request(app).get('/api/nothing-here').set('Accept', 'application/json');
    expect(missing.status).toBe(404);
    expect(missing.headers['cache-control']).toBe('no-store');
    const offerLink = await request(app).get('/go/not-an-offer');
    expect(offerLink.headers['cache-control']).toBe('no-store');
  });

  it('lets a public route set its own', async () => {
    const countries = await request(app).get('/api/countries');
    expect(countries.status).toBe(200);
    expect(countries.headers['cache-control']).toBe(REFERENCE_CACHE_CONTROL);
  });
});
