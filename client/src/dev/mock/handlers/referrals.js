// Mock mode only: give a month, get a month (docs/API.md "Give a month, get a month"): the
// test user's own invite code, made when they ask (a verified address: mockAdapter's list),
// and what it has brought. The member's month comes from the Stripe webhook on the server
// when a friend pays; the mock has no Stripe, so its counts are the store's rewards
// (`db.referralRewards`, none to start with) and the friends who signed up with the code.
import { ok, route } from '../mockAdapter';
import { getDb, me, newId } from '../store';
import { PROMO_TRIAL_DAYS } from '@/utils/plans/promoCodes';

const PER_YEAR = 12;
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';

// As the server's utils/referrals.js referralCodeFor
function referralCodeFor(name) {
  const first = String(name ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .split(/\s+/)[0]
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 8);
  const tail = Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
  return `${first.length >= 2 ? first : 'FRIEND'}${tail}`;
}

const ownCode = () => (getDb().promoCodes || []).find((p) => p.ownerId === me().id) || null;

function referralView(code) {
  const db = getDb();
  const rewards = (db.referralRewards || []).filter((r) => r.referrerId === me().id);
  const given = rewards.filter((r) => r.kind !== 'CAPPED');
  const thisYear = given.filter((r) => Date.now() - new Date(r.createdAt).getTime() < YEAR_MS).length;
  return {
    code: code?.code ?? null,
    friendDays: PROMO_TRIAL_DAYS,
    perYear: PER_YEAR,
    friendsJoined: code ? db.users.filter((u) => u.promoCodeId === code.id && u.emailVerified !== false).length : 0,
    friendsPaid: rewards.length,
    monthsEarned: given.length,
    monthsLeftThisYear: Math.max(0, PER_YEAR - thisYear),
  };
}

export function registerReferralRoutes() {
  route('GET', '/api/users/referral', () => ok({ referral: referralView(ownCode()) }));

  route('POST', '/api/users/referral', () => {
    const had = ownCode();
    if (had) return ok({ referral: referralView(had) });
    const db = getDb();
    db.promoCodes = db.promoCodes || [];
    let code = referralCodeFor(me().name);
    while (db.promoCodes.some((p) => p.code === code)) code = referralCodeFor(me().name);
    const promo = { id: newId(), code, label: 'A member’s invite code', active: true, maxUses: null, endsAt: null, freePlan: null, ownerId: me().id, createdById: null, createdAt: new Date().toISOString() };
    db.promoCodes.push(promo);
    return ok({ referral: referralView(promo) }, 201);
  });
}
