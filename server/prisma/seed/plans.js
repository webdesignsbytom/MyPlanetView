// Each paid seed account gets a subscription as Stripe's webhook would leave it (no Stripe
// involved): Business paid monthly, First Class yearly. The plan in force is computed from
// it (src/utils/plans.js), so signing in as each account shows that plan's rules. The fake
// Stripe ids only make the rows valid; the billing portal won't open for them.
import { prisma } from '../../src/prisma.js';
import { seedAccounts } from './users.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const INTERVAL_DAYS = { MONTH: 30, YEAR: 365 };
const INTERVALS = { REGULAR: 'MONTH', PREMIUM: 'YEAR' };

export async function seedPlans() {
  for (const account of seedAccounts.filter((a) => a.plan !== 'FREE')) {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: account.email }, select: { id: true } });
    const interval = INTERVALS[account.plan];
    const slug = account.email.split('@')[0];
    await prisma.subscription.create({
      data: {
        userId: user.id,
        stripeCustomerId: `cus_seed_${slug}`,
        stripeSubscriptionId: `sub_seed_${slug}`,
        plan: account.plan,
        interval,
        status: 'active',
        extraMaps: 0,
        currentPeriodEnd: new Date(Date.now() + INTERVAL_DAYS[interval] * DAY_MS),
      },
    });
    console.log(`✅ ${account.email} is on ${account.plan} (${interval === 'MONTH' ? 'monthly' : 'yearly'})`);
  }
}
