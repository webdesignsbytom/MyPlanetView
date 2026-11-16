// Mock mode only: influencer codes (docs/API.md, "Promo codes"). The public check before
// signing up, and the admin's list, new code and changes (ADMIN or DEVELOPER; switch roles
// from the mock badge, or open a page with ?mockRole=ADMIN). The sign-up itself is in
// handlers/account.js; the free month is a trial on the first paid Checkout (handlers/billing.js).
import { fail, ok, route } from '../mockAdapter';
import { getDb, me, newId, session } from '../store';
import { PROMO_MESSAGES, parsePromoCodeInput, promoCodeView, usablePromoCode } from '../promoCodes';
import { PROMO_TRIAL_DAYS } from '@/utils/plans/promoCodes';

const isAdmin = () => session.signedIn && ['ADMIN', 'DEVELOPER'].includes(me().role);
const forbidden = () => (session.signedIn ? fail(403, 'Admins only.') : fail(401, 'No valid session. Please sign in.'));
const newestFirst = (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) || String(b.id).localeCompare(String(a.id));

export function registerPromoCodeRoutes() {
  // Anyone: a usable code and its offer, the same for every code (no label), else 404
  route('GET', '/api/promo-codes/:code', ({ params }) => {
    const promo = usablePromoCode(params.code);
    if (!promo) return fail(404, PROMO_MESSAGES.invalid);
    return ok({ promoCode: { code: promo.code, trialDays: PROMO_TRIAL_DAYS } });
  });

  route('GET', '/api/users/admin/promo-codes', () => {
    if (!isAdmin()) return forbidden();
    const db = getDb();
    return ok({ promoCodes: [...(db.promoCodes || [])].sort(newestFirst).map(promoCodeView) });
  });

  route('POST', '/api/users/admin/promo-codes', ({ body }) => {
    if (!isAdmin()) return forbidden();
    const parsed = parsePromoCodeInput(body);
    if (!parsed.ok) return fail(400, PROMO_MESSAGES[parsed.message]);
    const db = getDb();
    db.promoCodes = db.promoCodes || [];
    if (db.promoCodes.some((p) => p.code === parsed.data.code)) return fail(409, PROMO_MESSAGES.taken);
    const promo = {
      id: newId(),
      active: true,
      maxUses: null,
      endsAt: null,
      ...parsed.data,
      createdById: me().id,
      createdAt: new Date().toISOString(),
    };
    db.promoCodes.push(promo);
    return ok({ promoCode: promoCodeView(promo) }, 201);
  });

  // The code itself never changes (it's in people's posts); `active: false` turns it off
  route('PATCH', '/api/users/admin/promo-codes/:promoCodeId', ({ params, body }) => {
    if (!isAdmin()) return forbidden();
    const promo = (getDb().promoCodes || []).find((p) => p.id === params.promoCodeId);
    if (!promo) return fail(404, PROMO_MESSAGES.notFound);
    const parsed = parsePromoCodeInput(body, { existing: promo });
    if (!parsed.ok) return fail(400, PROMO_MESSAGES[parsed.message]);
    Object.assign(promo, parsed.data);
    // As the server, the reply carries no counts
    const { signUps: _s, verified: _v, trials: _t, paying: _p, ...view } = promoCodeView(promo);
    return ok({ promoCode: view });
  });
}
