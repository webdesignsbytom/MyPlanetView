// What the logs keep (docs/AUDIT.md D5) and how reference data is cached (B9).
import { afterAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { ORIGIN, anon, prisma } from './helpers.js';

const { default: app } = await import('../../src/server.js');

const eventIds = [];
afterAll(async () => {
  await prisma.appEvent.deleteMany({ where: { id: { in: eventIds } } });
});

describe('AppEvent.path', () => {
  it('keeps the route, never the share code or a query value', async () => {
    const res = await anon().get('/api/shared/K7QX-M2PA-9RTW?token=secret-value&limit=5');
    expect(res.status).toBe(404);
    const requestId = res.headers['x-request-id'];
    const event = await vi.waitFor(
      async () => {
        const found = await prisma.appEvent.findFirst({ where: { requestId } });
        if (!found) throw new Error('no event yet');
        return found;
      },
      { timeout: 5000 }
    );
    eventIds.push(event.id);
    expect(event.path).toBe('/api/shared/:code?token=:redacted&limit=5');
    expect(JSON.stringify(event)).not.toMatch(/K7QX|secret-value/);
  });
});

describe('reference data caching', () => {
  const CACHE = 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400';
  const varies = (res) => String(res.headers.vary || '').split(/\s*,\s*/).includes('Origin');

  it('is cached by browsers and the CDN, one copy per Origin', async () => {
    for (const path of ['/api/countries', '/api/landmarks?country=FR']) {
      const fromSite = await anon().get(path);
      expect(fromSite.status).toBe(200);
      expect(fromSite.headers['cache-control']).toBe(CACHE);
      expect(fromSite.headers['access-control-allow-origin']).toBe(ORIGIN);
      expect(varies(fromSite)).toBe(true);
      expect(fromSite.headers['set-cookie']).toBeUndefined();

      // A refused origin gets no CORS header; Vary: Origin keeps its copy apart
      const foreign = await request(app).get(path).set('Origin', 'https://evil.example');
      expect(foreign.headers['access-control-allow-origin']).toBeUndefined();
      expect(varies(foreign)).toBe(true);

      const noOrigin = await request(app).get(path);
      expect(varies(noOrigin)).toBe(true);
    }
  });

  it('caches nothing for a bad request', async () => {
    const res = await anon().get('/api/landmarks?country=ZZ');
    expect(res.status).toBe(400);
    expect(res.headers['cache-control'] ?? '').not.toMatch(/max-age/);
  });
});
