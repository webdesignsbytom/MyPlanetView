// The site owner's own account (17 Nov 2026, the user's wish): First Class free for life,
// its address already verified, and its default map a couple's map for Tom and Gigie.
// Unlike the demo logins (users.js), its password is never in the repo: it comes from
// SEED_OWNER_PASSWORD in the env file the seed runs with, and without one this step is
// skipped with a message.
import { prisma } from '../../src/prisma.js';
import { auth } from '../../src/auth.js';
import { FOR_LIFE_ENDS_AT } from '../../src/utils/promoCodes.js';

export const OWNER_ACCOUNT = {
  email: 'xtombrock1989@gmail.com',
  name: 'Tom',
  plan: 'PREMIUM',
  map: { name: "Tom & Gigie's travels", travellers: ['Tom', 'Gigie'] },
};

// better-auth's own minimum; the site's rule (utils/passwordRules.js) only applies over HTTP
const MIN_PASSWORD = 8;

export async function seedOwnerAccount() {
  const password = process.env.SEED_OWNER_PASSWORD;
  if (typeof password !== 'string' || password.length < MIN_PASSWORD) {
    console.log(`⏭️  Owner account skipped: set SEED_OWNER_PASSWORD (${MIN_PASSWORD}+ characters) to seed ${OWNER_ACCOUNT.email}`);
    return;
  }
  const { email, name, plan, map: mapSetup } = OWNER_ACCOUNT;

  try {
    await auth.api.signUpEmail({ body: { email, password, name } });
  } catch (err) {
    throw new Error(`Sign-up failed for ${email}: ${err.message}`);
  }
  const user = await prisma.user.update({ where: { email }, data: { emailVerified: true }, select: { id: true } });

  // Free for life: a complimentary membership ending FOR_LIFE_ENDS_AT (shown as "for life")
  await prisma.planGrant.create({
    data: { userId: user.id, plan, endsAt: FOR_LIFE_ENDS_AT, reason: 'Owner account, free for life' },
  });

  // The default map the sign-up hook made becomes the couple's map: Tom (this account) and Gigie
  const map = await prisma.travelMap.findFirstOrThrow({
    where: { ownerId: user.id, isDefault: true },
    select: { id: true, travellers: { select: { id: true }, orderBy: { position: 'asc' } } },
  });
  await prisma.travelMap.update({ where: { id: map.id }, data: { name: mapSetup.name, groupType: 'COUPLE' } });
  const [first, second] = mapSetup.travellers;
  await prisma.traveller.update({ where: { id: map.travellers[0].id }, data: { name: first } });
  await prisma.traveller.create({ data: { mapId: map.id, name: second, position: 1 } });

  console.log(`✅ Seeded owner account: ${email} (First Class for life, "${mapSetup.name}")`);
}
