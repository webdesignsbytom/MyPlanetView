// What a Stripe subscription means for the Subscription row (docs/API.md, "Plans and
// billing"). Pure: `priceKind(priceId)` (services/billing/stripe.js) says what each
// line is, so the env-configured price ids stay out of here.

// Statuses whose subscription still exists in Stripe: an account with one changes it
// (change-plan, extra-maps) rather than starting another
const ENDED_STATUSES = Object.freeze(['canceled', 'incomplete_expired']);

/** Does this Subscription row hold a subscription that hasn't ended? */
export const hasLiveSubscription = (row) =>
  Boolean(row?.stripeSubscriptionId && row.status && !ENDED_STATUSES.includes(row.status));

export const isEndedStatus = (status) => ENDED_STATUSES.includes(status);

const idOf = (value) => (typeof value === 'string' ? value : value?.id ?? null);
const seconds = (value) => (Number.isFinite(value) ? new Date(value * 1000) : null);

/**
 * The row's fields from a Stripe subscription object: the plan line's plan and interval
 * (FREE when there's none), the extra-map line's quantity, status, period end and the
 * cancel flag. Since API 2025-03-31 the period end is on each item; the latest is used.
 * `deleted` (customer.subscription.deleted): plan FREE, no extra maps, status canceled.
 */
export function subscriptionStateFrom(sub, priceKind, { deleted = false } = {}) {
  let plan = 'FREE';
  let interval = null;
  let extraMaps = 0;
  let periodEnd = Number.isFinite(sub?.current_period_end) ? sub.current_period_end : null;
  for (const item of sub?.items?.data ?? []) {
    const kind = priceKind(idOf(item.price));
    if (!kind) continue;
    if (kind.kind === 'plan') {
      plan = kind.plan;
      interval = kind.interval;
    } else {
      extraMaps += Math.max(0, Number(item.quantity) || 0);
      interval ??= kind.interval;
    }
    if (Number.isFinite(item.current_period_end)) periodEnd = Math.max(periodEnd ?? 0, item.current_period_end);
  }
  const base = { stripeSubscriptionId: sub.id, interval, currentPeriodEnd: seconds(periodEnd) };
  if (deleted) return { ...base, plan: 'FREE', extraMaps: 0, status: 'canceled', cancelAtPeriodEnd: false };
  return {
    ...base,
    plan,
    extraMaps,
    status: typeof sub.status === 'string' ? sub.status : null,
    // The portal may set a cancel date instead of the flag
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end || sub.cancel_at),
  };
}

/**
 * Should an event about subscription `sub` be applied to this row? Not when the row's
 * current subscription is another live one and this one has ended (a late event about
 * an old subscription), nor when this subscription was already recorded as canceled
 * (Stripe can't revive one, so a late update can't undo it).
 */
export function shouldApplySubscriptionEvent(row, sub, { deleted = false } = {}) {
  if (!row) return true;
  const sameSubscription = row.stripeSubscriptionId === sub.id;
  if (!sameSubscription && hasLiveSubscription(row) && (deleted || isEndedStatus(sub.status))) return false;
  if (sameSubscription && row.status === 'canceled' && !deleted) return false;
  return true;
}

export { idOf as stripeIdOf };
