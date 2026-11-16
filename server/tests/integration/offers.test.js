// Travel offers (docs/API.md, "Travel offers"): imported by key, listed without their links,
// clicks counted per day and placement then redirected, and how often a viewer sees a card.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { anon, cleanUp, data, defaultMapOf, givePlan, prisma, signUp } from './helpers.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const example = JSON.parse(fs.readFileSync(path.join(here, '../../prisma/seed/data/offers.example.json'), 'utf8'));
const exampleKeys = example.offers.map((o) => o.key);

afterAll(async () => {
  await prisma.affiliateOffer.deleteMany({ where: { OR: [{ key: { in: exampleKeys } }, { key: { startsWith: 'it-offer-' } }] } });
  await cleanUp();
});

describe('travel offers', () => {
  let admin;

  beforeAll(async () => {
    admin = await signUp('OfferAdmin');
    await prisma.user.update({ where: { id: admin.user.id }, data: { role: 'ADMIN' } });
  });

  it('imports the example file by key, and again as updates', async () => {
    const user = await signUp('OfferNotAdmin');
    expect((await user.agent.post('/api/users/admin/offers/import').send(example)).status).toBe(403);
    const first = await admin.agent.post('/api/users/admin/offers/import').send(example);
    expect(first.status).toBe(200);
    expect(data(first)).toMatchObject({ created: example.offers.length, updated: 0 });
    const again = await admin.agent.post('/api/users/admin/offers/import').send(example);
    expect(data(again)).toMatchObject({ created: 0, updated: example.offers.length });
  });

  it('refuses a whole import if any offer is wrong, and says which', async () => {
    const offers = [
      { key: 'it-offer-ok', partner: 'Example Stays', kind: 'HOTEL', title: 'Hotels', placements: ['GALLERY'], url: 'https://www.example.com/' },
      { key: 'it-offer-bad', partner: 'Example Stays', kind: 'HOTEL', title: 'Hotels', placements: ['GALLERY'], url: 'http://www.example.com/' },
    ];
    const res = await admin.agent.post('/api/users/admin/offers/import').send({ offers });
    expect(res.status).toBe(400);
    expect(res.body.data.problems).toEqual([{ index: 1, key: 'it-offer-bad', field: 'url' }]);
    expect(await prisma.affiliateOffer.count({ where: { key: { startsWith: 'it-offer-' } } })).toBe(0);
    expect((await admin.agent.post('/api/users/admin/offers/import').send({ offers: [] })).status).toBe(400);
  });

  it('lists the live offers to anyone, without their links', async () => {
    const res = await anon().get('/api/offers');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toMatch(/public, max-age=300/);
    const keys = data(res).offers.map((o) => o.id);
    expect(keys.length).toBe(example.offers.filter((o) => o.active !== false).length);
    const japan = data(res).offers.find((o) => o.title === 'Hotels in Japan');
    expect(japan).toMatchObject({ partner: 'Example Stays', kind: 'HOTEL', countryCode: 'JP', imageKey: example.offers.find((o) => o.title === 'Hotels in Japan').imageKey });
    expect(japan).not.toHaveProperty('url');
    expect(japan).not.toHaveProperty('key');
    expect(data(res).offers.some((o) => o.title.startsWith('Summer sale'))).toBe(false);
  });

  it('counts a click per day and placement, then sends it on with its link filled', async () => {
    const offer = await prisma.affiliateOffer.findUniqueOrThrow({ where: { key: 'example-stays-jp' } });
    const res = await anon().get(`/go/${offer.id}?p=TRAVEL_DESK&dest=Kyoto&country=JP&from=2027-04-01&to=2027-04-08`).redirects(0);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(
      'https://www.example.com/stays?country=JP&q=Kyoto&checkin=2027-04-01&checkout=2027-04-08&ref=myplanetview-example'
    );
    expect(res.headers['referrer-policy']).toBe('no-referrer');
    await anon().get(`/go/${offer.id}?p=TRAVEL_DESK`).redirects(0);
    await anon().get(`/go/${offer.id}?p=GALLERY`).redirects(0);
    // An unknown placement still goes through, uncounted
    expect((await anon().get(`/go/${offer.id}?p=POPUP`).redirects(0)).status).toBe(302);
    const tallies = await prisma.offerClickDaily.findMany({ where: { offerId: offer.id }, orderBy: { placement: 'asc' } });
    expect(tallies.map((t) => [t.placement, t.count])).toEqual([['GALLERY', 1], ['TRAVEL_DESK', 2]]);

    const listed = data(await admin.agent.get('/api/users/admin/offers')).offers.find((o) => o.id === offer.id);
    expect(listed.clicks).toMatchObject({ total: 3, byPlacement: { GALLERY: 1, TRAVEL_DESK: 2 } });
    expect(listed.url).toBe(offer.url);
  });

  it('refuses a click on an offer that is off or unknown', async () => {
    const off = await prisma.affiliateOffer.findUniqueOrThrow({ where: { key: 'example-stays-summer-sale' } });
    expect((await anon().get(`/go/${off.id}?p=GALLERY`).redirects(0)).status).toBe(404);
    expect((await anon().get('/go/not-an-id').redirects(0)).status).toBe(404);
  });

  it('lets an admin make, change and delete one', async () => {
    const body = { key: 'it-offer-made', partner: 'Example Tours', kind: 'TOUR', title: 'Tours in Peru', countryCode: 'PE', placements: ['TRAVEL_DESK'], url: 'https://www.example.com/peru' };
    const made = await admin.agent.post('/api/users/admin/offers').send(body);
    expect(made.status).toBe(201);
    expect((await admin.agent.post('/api/users/admin/offers').send(body)).status).toBe(409);
    expect((await admin.agent.post('/api/users/admin/offers').send({ ...body, key: 'it-offer-x', kind: 'CASINO' })).status).toBe(400);
    const { offer } = data(made);
    const changed = await admin.agent.patch(`/api/users/admin/offers/${offer.id}`).send({ active: false, weight: 5 });
    expect(data(changed).offer).toMatchObject({ active: false, weight: 5, key: 'it-offer-made' });
    expect((await admin.agent.patch(`/api/users/admin/offers/${offer.id}`).send({ key: 'renamed' })).status).toBe(400);
    expect((await admin.agent.delete(`/api/users/admin/offers/${offer.id}`)).status).toBe(200);
    expect((await admin.agent.delete(`/api/users/admin/offers/${offer.id}`)).status).toBe(404);
  });
});

describe('how often a viewer sees a card', () => {
  it('follows the owner’s plan, and never shows one to a paying viewer', async () => {
    const owner = await signUp('AdsOwner');
    const friend = await signUp('AdsFriend');
    const map = await defaultMapOf(owner.agent);
    await owner.agent.post(`/api/maps/${map.id}/members`).send({ email: friend.email, role: 'VIEWER' });
    const every = async (agent) => data(await agent.get(`/api/maps/${map.id}`)).map.ads.every;

    expect(await every(owner.agent)).toBe(12);
    expect(await every(friend.agent)).toBe(12);
    await givePlan(owner.user.id, { plan: 'REGULAR' });
    // The owner pays: none for them, fewer for the friend who doesn't
    expect(await every(owner.agent)).toBeNull();
    expect(await every(friend.agent)).toBe(24);
    await givePlan(owner.user.id, { plan: 'PREMIUM' });
    expect(await every(friend.agent)).toBeNull();
    await givePlan(owner.user.id, { plan: 'FREE' });
    await givePlan(friend.user.id, { plan: 'REGULAR' });
    expect(await every(friend.agent)).toBeNull();

    // Through the link, signed out: the owner's rate; a trip's link too
    await owner.agent.patch(`/api/maps/${map.id}/sharing`).send({ linkAccess: 'ANYONE_WITH_LINK' });
    const { shareCode } = data(await owner.agent.get(`/api/maps/${map.id}/sharing`));
    expect(data(await anon().get(`/api/shared/${shareCode}`)).map.ads).toEqual({ every: 12 });
    const trip = data(await owner.agent.post(`/api/maps/${map.id}/trips`).send({ title: 'Lisbon' })).trip;
    expect(data(await owner.agent.get(`/api/trips/${trip.id}`)).trip.ads).toEqual({ every: 12 });
  });
});
