// Emails people can stop (docs/API.md "Emails"): "On this day" (a photo taken on this day in an
// earlier year, at most once a week, to those who want it), its signed picture and unsubscribe
// links, and the account's own setting.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, prisma, sentEmails, signUp, uploadPhoto } from './helpers.js';

const { sendOnThisDayEmails } = await import('../../src/services/memories/onThisDay.js');
const { photoLinkToken, unsubscribeToken } = await import('../../src/utils/onThisDay.js');

afterAll(cleanUp);

// A day no other test's photos fall on
const NOW = new Date('2026-03-17T08:00:00Z');
const COLOSSEUM = { latitude: 41.8902, longitude: 12.4922 };
const memoriesTo = (email) => sentEmails().filter((e) => e.kind === 'memory' && e.to === email);

describe('emails people can stop', () => {
  let traveller;
  let quiet;
  let unverified;
  let photo;

  beforeAll(async () => {
    [traveller, quiet] = await Promise.all([signUp('MemoryTraveller'), signUp('MemoryQuiet')]);
    unverified = await signUp('MemoryUnverified', { verified: false });
    for (const who of [traveller, quiet, unverified]) {
      const map = await defaultMapOf(who.agent);
      const res = await uploadPhoto(who.agent, map.id, { ...COLOSSEUM, takenAt: '2023-03-17T12:00:00.000Z' });
      if (who === traveller) {
        photo = data(res).photo;
        const colosseum = photo.landmarks.find((l) => l.name === 'Colosseum');
        expect((await who.agent.patch(`/api/photos/${photo.id}/landmarks/${colosseum.id}`).send({ confirmed: true })).status).toBe(200);
      }
    }
    // Taken this year: not a memory
    await uploadPhoto(traveller.agent, (await defaultMapOf(traveller.agent)).id, { countryCode: 'FR', takenAt: '2026-03-17T09:00:00.000Z' });
  });

  it('the account page reads and sets "On this day", on to start with', async () => {
    expect(data(await traveller.agent.get('/api/users/email-preferences'))).toEqual({ onThisDay: true, tripShare: true });
    expect(data(await quiet.agent.put('/api/users/email-preferences').send({ onThisDay: false }))).toEqual({ onThisDay: false, tripShare: true });
    expect(data(await quiet.agent.get('/api/users/email-preferences'))).toEqual({ onThisDay: false, tripShare: true });
    expect((await quiet.agent.put('/api/users/email-preferences').send({ onThisDay: 'no' })).status).toBe(400);
    expect((await anon().get('/api/users/email-preferences')).status).toBe(401);
  });

  it('sends a photo from this day in an earlier year, once a week, only to those who want it', async () => {
    const result = await sendOnThisDayEmails({ now: NOW });
    expect(result.sent).toBeGreaterThanOrEqual(1);
    const [email] = memoriesTo(traveller.email);
    expect(email).toMatchObject({
      subject: '3 years ago today: Colosseum',
      template: 'onThisDayEmail',
      context: { headline: '3 years ago today you were in Italy', caption: 'Colosseum, Italy', takenOn: '17 March 2023' },
    });
    expect(email.context.photoUrl).toContain(`/api/emails/photos/${photo.id}?t=`);
    expect(email.context.unsubscribeUrl).toMatch(/\/unsubscribe\?u=.+&t=.+/);
    expect(email.headers['List-Unsubscribe']).toMatch(/^<.+\/api\/emails\/unsubscribe\?u=.+&t=.+>$/);
    expect(email.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    // Switched off, and not verified: none
    expect(memoriesTo(quiet.email)).toHaveLength(0);
    expect(memoriesTo(unverified.email)).toHaveLength(0);

    // The same day again, or the next: nothing more this week
    await sendOnThisDayEmails({ now: NOW });
    await sendOnThisDayEmails({ now: new Date('2026-03-18T08:00:00Z') });
    expect(memoriesTo(traveller.email)).toHaveLength(1);
  });

  it('the picture link works with its signature, for anyone', async () => {
    const good = await anon().get(`/api/emails/photos/${photo.id}?t=${photoLinkToken(photo.id, process.env.BETTER_AUTH_SECRET)}`);
    expect(good.status).toBe(302);
    expect(good.headers.location).toContain('display-');
    expect((await anon().get(`/api/emails/photos/${photo.id}?t=wrong`)).status).toBe(404);
  });

  it('the unsubscribe link turns it off, in one click and without signing in', async () => {
    const u = traveller.user.id;
    expect((await anon().post(`/api/emails/unsubscribe?u=${u}&t=nope`)).status).toBe(400);
    const res = await anon()
      .post(`/api/emails/unsubscribe?u=${u}&t=${unsubscribeToken(u, process.env.BETTER_AUTH_SECRET)}`)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('List-Unsubscribe=One-Click');
    expect(res.status).toBe(200);
    expect(data(await traveller.agent.get('/api/users/email-preferences'))).toEqual({ onThisDay: false, tripShare: true });
    // The page's way: the same, in the body
    expect((await anon().post('/api/emails/unsubscribe').send({ u, t: unsubscribeToken(u, process.env.BETTER_AUTH_SECRET) })).status).toBe(200);
  });

  it('the daily run needs the cron secret', async () => {
    expect((await anon().get('/api/emails/on-this-day/cron')).status).toBe(401);
    process.env.CRON_SECRET = 'emails-cron-secret';
    const res = await anon().get('/api/emails/on-this-day/cron').set('Authorization', 'Bearer emails-cron-secret');
    expect(res.status).toBe(200);
    expect(data(res)).toMatchObject({ complete: true });
    expect(await prisma.profile.count({ where: { userId: traveller.user.id, lastOnThisDayAt: { not: null } } })).toBe(1);
  });
});
