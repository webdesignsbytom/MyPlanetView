import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ALEX, HOME_MAP, SAM_MAP, TOM_MAP, db, del, freshStore, get, post, put, registerAllRoutes, signOut, testUser } from '../mockApi';

beforeAll(() => registerAllRoutes());
beforeEach(() => freshStore());

const visit = (code) => db().visits.find((v) => v.mapId === HOME_MAP && v.countryCode === code);

describe('ticking a landmark "been here"', () => {
  it('ticks it once and marks its place visited', async () => {
    const { data } = await put(`/api/maps/${HOME_MAP}/landmarks/lm-mount-fuji/been`);
    expect(data).toEqual({ landmarkId: 'lm-mount-fuji', been: true, countryCode: 'JP' });
    await put(`/api/maps/${HOME_MAP}/landmarks/lm-mount-fuji/been`);
    expect(db().landmarkVisits.filter((v) => v.landmarkId === 'lm-mount-fuji')).toHaveLength(1);
    expect(visit('JP')).toMatchObject({ status: 'VISITED', source: 'MANUAL' });
    expect((await get(`/api/maps/${HOME_MAP}`)).data.map.tickedLandmarkIds).toEqual(['lm-mount-fuji']);
    // Who ticked it (their own traveller's passport gets the stamp), and the stamp counts
    expect(db().landmarkVisits.find((v) => v.landmarkId === 'lm-mount-fuji').createdById).toBe('mock-user');
    const { map } = (await get(`/api/maps/${HOME_MAP}`)).data;
    expect(map.stampedLandmarkIds).not.toContain('lm-mount-fuji');
    expect(map.stats.landmarks).toBe(14);
    const { passport } = (await get(`/api/maps/${HOME_MAP}/passport`)).data;
    expect(passport.pages.flatMap((p) => p.stamps).find((s) => s.landmarkId === 'lm-mount-fuji')).toMatchObject({ ticked: true, photo: null });
  });

  it('marks a UK landmark’s nation on a split map', async () => {
    db().maps.find((m) => m.id === HOME_MAP).splitUk = true;
    expect((await put(`/api/maps/${HOME_MAP}/landmarks/lm-old-and-new-towns-of-edinburgh/been`)).data.countryCode).toBe('XC');
    expect(visit('XC')).toBeDefined();
  });

  it('unticks it, leaving the visit', async () => {
    await put(`/api/maps/${HOME_MAP}/landmarks/lm-mount-fuji/been`);
    expect((await del(`/api/maps/${HOME_MAP}/landmarks/lm-mount-fuji/been`)).data).toEqual({ landmarkId: 'lm-mount-fuji', been: false });
    expect(db().landmarkVisits).toEqual([]);
    expect(visit('JP').status).toBe('VISITED');
  });

  it('needs an editor, and a landmark that exists', async () => {
    expect((await put(`/api/maps/${SAM_MAP}/landmarks/lm-mount-fuji/been`)).status).toBe(403);
    expect((await put(`/api/maps/${TOM_MAP}/landmarks/lm-mount-fuji/been`)).status).toBe(404);
    expect((await put(`/api/maps/${HOME_MAP}/landmarks/lm-nope/been`)).status).toBe(404);
  });
});

describe('the emails people can stop', () => {
  it('has "On this day" on until it’s turned off', async () => {
    expect((await get('/api/users/email-preferences')).data).toEqual({ onThisDay: true, tripShare: true });
    expect((await put('/api/users/email-preferences', { onThisDay: false })).data).toEqual({ onThisDay: false, tripShare: true });
    expect(testUser().onThisDayEmails).toBe(false);
    expect((await put('/api/users/email-preferences', { tripShare: false })).data).toEqual({ onThisDay: false, tripShare: false });
    expect(testUser().tripShareEmails).toBe(false);
    expect((await put('/api/users/email-preferences', { onThisDay: 'no' })).status).toBe(400);
    expect((await put('/api/users/email-preferences', {})).status).toBe(400);
    signOut();
    expect((await get('/api/users/email-preferences')).status).toBe(401);
    expect((await put('/api/users/email-preferences', { onThisDay: true })).status).toBe(401);
  });

  it('stops them from an email’s link with no sign-in', async () => {
    signOut();
    expect((await post(`/api/emails/unsubscribe?u=${ALEX}&t=any`)).data).toEqual({ onThisDay: false });
    expect(db().users.find((u) => u.id === ALEX).onThisDayEmails).toBe(false);
    expect((await post('/api/emails/unsubscribe', { u: 'nobody', t: 'x' })).status).toBe(400);
    expect((await post(`/api/emails/unsubscribe?u=${ALEX}`)).status).toBe(400);
  });

  it('stops "Welcome home" alone from its own link (`l=trips`), and refuses a list it doesn’t know', async () => {
    signOut();
    expect((await post(`/api/emails/unsubscribe?u=${ALEX}&t=any&l=trips`)).data).toEqual({ tripShare: false });
    const alex = db().users.find((u) => u.id === ALEX);
    expect(alex.tripShareEmails).toBe(false);
    expect(alex.onThisDayEmails).not.toBe(false);
    expect((await post('/api/emails/unsubscribe', { u: ALEX, t: 'any', l: 'news' })).status).toBe(400);
  });
});
