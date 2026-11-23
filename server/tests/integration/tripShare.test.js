// "Welcome home" emails (docs/API.md "Emails"; 23 Nov 2026): the day after a trip ends, its
// map's owner is asked to share it, once per trip, unless they switched these emails off; and
// every new trip has its days.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, prisma, sentEmails, signUp } from './helpers.js';

const { sendTripShareEmails } = await import('../../src/services/memories/tripShare.js');
const { EMAIL_LISTS, unsubscribeToken } = await import('../../src/utils/onThisDay.js');

afterAll(cleanUp);

// Years no other test's trips end in
const NOW = new Date('2031-06-10T08:00:00Z');
const welcomesTo = (email) => sentEmails().filter((e) => e.kind === 'memory' && e.template === 'tripShareEmail' && e.to === email);
const secret = () => process.env.BETTER_AUTH_SECRET;

describe('trips have their days', () => {
  let owner;
  let map;

  beforeAll(async () => {
    owner = await signUp('TripDaysOwner');
    map = await defaultMapOf(owner.agent);
  });

  it('a new trip needs the day it starts and the day it ends', async () => {
    const none = await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Someday' });
    expect(none.status).toBe(400);
    expect(none.body.message).toBe('Give the trip the day it starts and the day it ends.');
    expect((await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Half', startDate: '2031-01-01' })).status).toBe(400);
    expect((await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Half', endDate: '2031-01-05' })).status).toBe(400);
    expect((await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Blank', startDate: '', endDate: '' })).status).toBe(400);
    const made = await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Lisbon', startDate: '2031-01-01', endDate: '2031-01-05' });
    expect(made.status).toBe(201);
    expect(data(made).trip).toMatchObject({ startDate: '2031-01-01', endDate: '2031-01-05' });
  });

  it('a trip’s days can be changed, never taken away', async () => {
    const trip = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Porto', startDate: '2031-02-01', endDate: '2031-02-03' })).trip;
    expect((await owner.agent.patch(`/api/trips/${trip.id}`).send({ endDate: null })).status).toBe(400);
    expect((await owner.agent.patch(`/api/trips/${trip.id}`).send({ startDate: '' })).status).toBe(400);
    // Other changes leave them be
    expect(data(await owner.agent.patch(`/api/trips/${trip.id}`).send({ title: 'Porto and Braga' })).trip).toMatchObject({
      startDate: '2031-02-01',
      endDate: '2031-02-03',
    });
    expect(data(await owner.agent.patch(`/api/trips/${trip.id}`).send({ endDate: '2031-02-04' })).trip.endDate).toBe('2031-02-04');
  });
});

describe('"Welcome home" emails', () => {
  let traveller;
  let quiet;
  let unverified;
  let map;
  let italy;
  let earlier;
  let today;
  let longAgo;

  const tripOn = async (who, mapId, body) => data(await who.agent.post(`/api/maps/${mapId}/trips`).send(body)).trip;
  const stop = async (who, tripId, countryCode) =>
    expect((await who.agent.post(`/api/trips/${tripId}/stops`).send({ countryCode })).status).toBe(201);
  const sentAt = async (tripId) => (await prisma.trip.findUnique({ where: { id: tripId }, select: { shareReminderSentAt: true } })).shareReminderSentAt;

  beforeAll(async () => {
    [traveller, quiet] = await Promise.all([signUp('WelcomeTraveller'), signUp('WelcomeQuiet')]);
    unverified = await signUp('WelcomeUnverified', { verified: false });
    map = await defaultMapOf(traveller.agent);
    // Ended yesterday, in two countries over nine days
    italy = await tripOn(traveller, map.id, { title: 'Rome and Nice', startDate: '2031-06-01', endDate: '2031-06-09' });
    await stop(traveller, italy.id, 'IT');
    await stop(traveller, italy.id, 'FR');
    // Ended five days ago: in the window, but the email is about the trip that ended last
    earlier = await tripOn(traveller, map.id, { title: 'Weekend in Ghent', startDate: '2031-06-04', endDate: '2031-06-05' });
    // Ends today (not over yet) and ended eight days ago (too long ago)
    today = await tripOn(traveller, map.id, { title: 'Day trip', startDate: '2031-06-10', endDate: '2031-06-10' });
    longAgo = await tripOn(traveller, map.id, { title: 'Old news', startDate: '2031-05-30', endDate: '2031-06-02' });

    const quietMap = await defaultMapOf(quiet.agent);
    await tripOn(quiet, quietMap.id, { title: 'Quiet trip', startDate: '2031-06-08', endDate: '2031-06-09' });
    expect(data(await quiet.agent.put('/api/users/email-preferences').send({ tripShare: false }))).toEqual({ onThisDay: true, tripShare: false });
    // An unverified account can't add a trip: one put straight in the database
    const unverifiedMap = await defaultMapOf(unverified.agent);
    await prisma.trip.create({
      data: {
        mapId: unverifiedMap.id,
        title: 'Unverified trip',
        startDate: new Date('2031-06-08T00:00:00Z'),
        endDate: new Date('2031-06-09T00:00:00Z'),
        shareCode: 'WLCM2HMETEST',
      },
    });
  });

  it('the account page reads and sets them, on to start with', async () => {
    expect(data(await traveller.agent.get('/api/users/email-preferences'))).toEqual({ onThisDay: true, tripShare: true });
    expect((await traveller.agent.put('/api/users/email-preferences').send({})).status).toBe(400);
    expect((await traveller.agent.put('/api/users/email-preferences').send({ tripShare: 'yes' })).status).toBe(400);
    expect((await traveller.agent.put('/api/users/email-preferences').send({ onThisDay: true, tripShare: 1 })).status).toBe(400);
  });

  it('sends one email the day after a trip ends, about the trip that ended last, to owners who want it', async () => {
    const result = await sendTripShareEmails({ now: NOW });
    expect(result.complete).toBe(true);
    const emails = welcomesTo(traveller.email);
    expect(emails).toHaveLength(1);
    const [email] = emails;
    expect(email).toMatchObject({
      subject: 'Welcome home from Rome and Nice',
      context: {
        headline: 'Welcome home from Rome and Nice!',
        caption: '2 countries in 9 days',
        tripTitle: 'Rome and Nice',
        dates: '1 June 2031 to 9 June 2031',
      },
    });
    expect(email.context.shareUrl).toMatch(new RegExp(`/maps/${map.id}\\?home=${italy.id}$`));
    expect(email.context.unsubscribeUrl).toMatch(/\/unsubscribe\?u=.+&t=.+&l=trips$/);
    expect(email.headers['List-Unsubscribe']).toMatch(/^<.+\/api\/emails\/unsubscribe\?u=.+&t=.+&l=trips>$/);
    expect(email.headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');

    // Both of the window's trips are done with; today's and the old one aren't touched
    expect(await sentAt(italy.id)).not.toBeNull();
    expect(await sentAt(earlier.id)).not.toBeNull();
    expect(await sentAt(today.id)).toBeNull();
    expect(await sentAt(longAgo.id)).toBeNull();
    // Switched off, and not verified: none
    expect(welcomesTo(quiet.email)).toHaveLength(0);
    expect(welcomesTo(unverified.email)).toHaveLength(0);
  });

  it('never sends twice for a trip, but a trip that ends later sends when it ends', async () => {
    await sendTripShareEmails({ now: NOW });
    expect(welcomesTo(traveller.email)).toHaveLength(1);
    // Today's trip ended yesterday by tomorrow's run
    await sendTripShareEmails({ now: new Date('2031-06-11T08:00:00Z') });
    const emails = welcomesTo(traveller.email);
    expect(emails).toHaveLength(2);
    expect(emails[1]).toMatchObject({ subject: 'Welcome home from Day trip', context: { caption: '1 day away' } });
  });

  it('a trip moved to end later (not over after all) emails again when it ends', async () => {
    // A day still to come: its email is to come too
    const moved = await traveller.agent.patch(`/api/trips/${italy.id}`).send({ endDate: '2031-06-20' });
    expect(moved.status).toBe(200);
    expect(await sentAt(italy.id)).toBeNull();
    // A change that doesn't move its end leaves the mark alone
    expect((await traveller.agent.patch(`/api/trips/${earlier.id}`).send({ title: 'Ghent and Bruges' })).status).toBe(200);
    expect(await sentAt(earlier.id)).not.toBeNull();

    await sendTripShareEmails({ now: new Date('2031-06-21T08:00:00Z') });
    const emails = welcomesTo(traveller.email);
    expect(emails).toHaveLength(3);
    expect(emails[2].context.caption).toBe('2 countries in 20 days');
  });

  it('its unsubscribe link turns only these off, in one click and without signing in', async () => {
    const u = traveller.user.id;
    const tripsToken = unsubscribeToken(u, secret(), EMAIL_LISTS.tripShare);
    // "On this day"'s link isn't this one's, and the other way round; an unknown list is refused
    expect((await anon().post(`/api/emails/unsubscribe?u=${u}&t=${unsubscribeToken(u, secret())}&l=trips`)).status).toBe(400);
    expect((await anon().post(`/api/emails/unsubscribe?u=${u}&t=${tripsToken}`)).status).toBe(400);
    expect((await anon().post(`/api/emails/unsubscribe?u=${u}&t=${tripsToken}&l=news`)).status).toBe(400);

    const res = await anon()
      .post(`/api/emails/unsubscribe?u=${u}&t=${tripsToken}&l=trips`)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('List-Unsubscribe=One-Click');
    expect(res.status).toBe(200);
    expect(data(res)).toEqual({ tripShare: false });
    expect(data(await traveller.agent.get('/api/users/email-preferences'))).toEqual({ onThisDay: true, tripShare: false });
    // The page's way: the same, in the body
    expect((await anon().post('/api/emails/unsubscribe').send({ u, t: tripsToken, l: 'trips' })).status).toBe(200);

    // Off: a trip that ends now sends nothing
    await tripOn(traveller, map.id, { title: 'After unsubscribing', startDate: '2031-07-01', endDate: '2031-07-02' });
    await sendTripShareEmails({ now: new Date('2031-07-03T08:00:00Z') });
    expect(welcomesTo(traveller.email)).toHaveLength(3);
  });

  it('runs with "On this day" in the daily call, which reports both', async () => {
    process.env.CRON_SECRET = 'welcome-home-cron-secret';
    const res = await anon().get('/api/emails/on-this-day/cron').set('Authorization', 'Bearer welcome-home-cron-secret');
    expect(res.status).toBe(200);
    expect(data(res)).toMatchObject({ complete: true, tripShare: { complete: true } });
  });

  it('"Your data" says whether they come', async () => {
    const file = data(await traveller.agent.get('/api/users/export'));
    expect(file.account.emails).toEqual({ onThisDay: true, tripShare: false });
  });
});
