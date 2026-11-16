// Influencer codes (docs/API.md, "Promo codes"): made by admins, checked before sign-up,
// and recorded on the new account, whose free month waits for its first paid Checkout
// (that part is in billing.test.js, which has the fake Stripe).
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PASSWORD, anon, cleanUp, data, prisma, sentEmails, signUp, testEmail, trackUser } from './helpers.js';

const promoIds = [];
afterAll(async () => {
  await cleanUp();
  await prisma.promoCode.deleteMany({ where: { id: { in: promoIds } } });
});

const tokenOf = (link) => new URL(link).pathname.split('/').pop();

describe('promo codes', () => {
  let admin;
  let code;

  /** Sign up through better-auth with a code; returns the response and the agent. */
  const signUpWith = async (label, promoCode) => {
    const email = testEmail(label);
    const agent = anon();
    const res = await agent.post('/api/auth/sign-up/email').send({ email, password: PASSWORD, name: label, promoCode });
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) trackUser(user.id);
    return { res, agent, email, user };
  };

  beforeAll(async () => {
    admin = await signUp('PromoAdmin');
    await prisma.user.update({ where: { id: admin.user.id }, data: { role: 'ADMIN' } });
  });

  it('are made by admins only, unique and well formed', async () => {
    const body = { code: `it-promo-${Date.now() % 100000}`, label: 'Sam Travels (YouTube)', maxUses: 2 };
    const user = await signUp('PromoNotAdmin');
    expect((await user.agent.post('/api/users/admin/promo-codes').send(body)).status).toBe(403);
    const made = await admin.agent.post('/api/users/admin/promo-codes').send(body);
    expect(made.status).toBe(201);
    code = data(made).promoCode;
    promoIds.push(code.id);
    expect(code).toMatchObject({ code: body.code.toUpperCase().replace(/-/g, ''), trialDays: 30, signUps: 0, trials: 0 });
    expect(code).not.toHaveProperty('offerPlan');
    expect((await admin.agent.post('/api/users/admin/promo-codes').send(body)).status).toBe(409);
    expect((await admin.agent.post('/api/users/admin/promo-codes').send({ ...body, code: 'x' })).status).toBe(400);
    expect((await admin.agent.post('/api/users/admin/promo-codes').send({ ...body, code: 'ITOTHER', maxUses: 0 })).status).toBe(400);
  });

  it('can be checked before signing up, without the label', async () => {
    const res = await anon().get(`/api/promo-codes/${code.code.toLowerCase()}`);
    expect(res.status).toBe(200);
    expect(data(res).promoCode).toEqual({ code: code.code, trialDays: 30 });
    expect((await anon().get('/api/promo-codes/NOSUCHCODE')).status).toBe(404);
  });

  it('refuse a sign-up with a code that does not work, and make no account', async () => {
    const { res, user } = await signUpWith('PromoBadCode', 'NOSUCHCODE');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/isn't valid/);
    expect(user).toBeNull();
  });

  it('go on the new account, whose free month waits for a paid Checkout', async () => {
    const { res, user, email, agent } = await signUpWith('PromoFollower', code.code);
    expect(res.status).toBe(200);
    expect(await prisma.profile.findUnique({ where: { userId: user.id } })).toMatchObject({ promoCodeId: code.id, promoTrialUsedAt: null });

    await vi.waitFor(() => expect(sentEmails().filter((e) => e.to === email && e.template === 'userVerificationEmail')).toHaveLength(1));
    const [verify] = sentEmails().filter((e) => e.to === email && e.template === 'userVerificationEmail');
    expect((await agent.get(`/api/auth/verify-email?token=${tokenOf(verify.context.confirmationUrl)}`)).status).toBe(200);

    // Verifying gives no membership: the month is a trial on the first paid Checkout
    expect(await prisma.planGrant.count({ where: { userId: user.id } })).toBe(0);
    expect(data(await agent.get('/api/billing'))).toMatchObject({ plan: 'FREE', promoTrial: { code: code.code, days: 30 } });
  });

  it('stop at their limit, and when turned off', async () => {
    expect((await signUpWith('PromoSecond', code.code)).res.status).toBe(200);
    expect((await signUpWith('PromoThird', code.code)).res.status).toBe(400);

    const listed = data(await admin.agent.get('/api/users/admin/promo-codes')).promoCodes.find((p) => p.id === code.id);
    expect(listed).toMatchObject({ signUps: 2, verified: 1, trials: 0, paying: 0 });

    const off = await admin.agent.patch(`/api/users/admin/promo-codes/${code.id}`).send({ active: false, maxUses: null });
    expect(data(off).promoCode).toMatchObject({ active: false, maxUses: null, code: code.code });
    expect((await anon().get(`/api/promo-codes/${code.code}`)).status).toBe(404);
    expect((await admin.agent.patch(`/api/users/admin/promo-codes/${code.id}`).send({ code: 'RENAMED' })).status).toBe(400);
  });
});
