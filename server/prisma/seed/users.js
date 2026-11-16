// Database
import { prisma } from '../../src/prisma.js';
// Auth
import { auth, disableAuthEmails } from '../../src/auth.js';

// Dev-only logins. `plan` is the plan each one is on (seed/plans.js gives the paid ones a
// subscription, as Stripe's webhook would): one account per plan, so each plan's rules can
// be tried by signing in. The USER is the demo couple's Economy map (travel.js, photos.js);
// First Class has the sample videos (videos.js). Real names (17 Nov 2026): the USER is Sam,
// the demo map's owner, and the ADMIN is Alex, Sam's partner (travel.js links Alex's
// traveller to this account).
export const seedAccounts = [
  { role: 'USER', email: 'user@gmail.com', password: '12345678', name: 'Sam Carter', plan: 'FREE' },
  { role: 'ADMIN', email: 'tom@gmail.com', password: '12345678', name: 'Alex Byrne', plan: 'FREE' },
  { role: 'DEVELOPER', email: 'dev@gmail.com', password: '12345678', name: 'Priya Nair', plan: 'FREE' },
  { role: 'USER', email: 'business@gmail.com', password: '12345678', name: 'Bea Hughes', plan: 'REGULAR' },
  { role: 'USER', email: 'firstclass@gmail.com', password: '12345678', name: 'Fran Okafor', plan: 'PREMIUM' },
];

/** The seeded account on a plan (the first one, for FREE: the demo couple's USER). */
export const seedAccountOnPlan = (plan) => seedAccounts.find((a) => a.plan === plan);

// Create a user via better-auth sign-up
async function signUp({ email, password, name }) {
  try {
    await auth.api.signUpEmail({ body: { email, password, name } });
  } catch (err) {
    throw new Error(`Sign-up failed for ${email}: ${err.message}`);
  }
}

export async function seedUsers() {
  disableAuthEmails();

  for (const acc of seedAccounts) {
    await signUp(acc);

    // Set role and mark email verified
    const updated = await prisma.user.update({
      where: { email: acc.email },
      data: { role: acc.role, emailVerified: true },
    });

    console.log(`✅ Seeded ${acc.role} user: ${acc.email} (id: ${updated.id})`);
  }
}
