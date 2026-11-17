// The seed's owner account (prisma/seed/owner.js): verified, First Class for life, and a
// couple's map for Tom and Gigie; skipped without SEED_OWNER_PASSWORD.
import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/server.js';
import { PASSWORD, cleanUp, data, prisma, trackUser } from './helpers.js';
import { OWNER_ACCOUNT, seedOwnerAccount } from '../../prisma/seed/owner.js';

afterAll(cleanUp);

describe("the seed's owner account", () => {
  it('is skipped without a password in the env file', async () => {
    delete process.env.SEED_OWNER_PASSWORD;
    await seedOwnerAccount();
    expect(await prisma.user.findUnique({ where: { email: OWNER_ACCOUNT.email } })).toBeNull();
  });

  it('is verified, on First Class for life, with a couple’s map for Tom and Gigie', async () => {
    process.env.SEED_OWNER_PASSWORD = PASSWORD;
    try {
      await seedOwnerAccount();
    } finally {
      delete process.env.SEED_OWNER_PASSWORD;
    }
    const user = await prisma.user.findUniqueOrThrow({ where: { email: OWNER_ACCOUNT.email } });
    trackUser(user.id);
    expect(user).toMatchObject({ name: 'Tom', emailVerified: true, role: 'USER' });

    const grants = await prisma.planGrant.findMany({ where: { userId: user.id } });
    expect(grants).toEqual([expect.objectContaining({ plan: 'PREMIUM' })]);
    expect(grants[0].endsAt.toISOString()).toBe('9999-12-31T00:00:00.000Z');

    const map = await prisma.travelMap.findFirstOrThrow({
      where: { ownerId: user.id, isDefault: true },
      include: { travellers: { orderBy: { position: 'asc' } } },
    });
    expect(map).toMatchObject({ name: "Tom & Gigie's travels", groupType: 'COUPLE' });
    expect(map.travellers.map((t) => [t.name, t.userId])).toEqual([
      ['Tom', user.id],
      ['Gigie', null],
    ]);

    // Signing in with that password shows First Class, free for life
    const agent = request.agent(app);
    expect((await agent.post('/api/auth/sign-in/email').send({ email: OWNER_ACCOUNT.email, password: PASSWORD })).status).toBe(200);
    expect(data(await agent.get('/api/billing'))).toMatchObject({
      plan: 'PREMIUM',
      source: 'COMPLIMENTARY',
      grant: { plan: 'PREMIUM', endsAt: '9999-12-31T00:00:00.000Z' },
    });
  });
});
