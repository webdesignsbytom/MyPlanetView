// The admin's promo code form (docs/API.md, "Promo codes"): its fields as the inputs hold
// them, and the body the server takes, checked first as the server checks it
// (server/src/utils/promoCodes.js), with a message per field. Every code gives the same
// offer (PROMO_TRIAL_DAYS), so there's nothing to set for it.
import { serverText } from '@/utils/regex/regex';
import { toDateInput } from '@/utils/functions/dates';
import { PROMO_LABEL_MAX, PROMO_MAX_USES_MAX, normalisePromoCode } from './promoCodes';

export const emptyPromoForm = () => ({ code: '', label: '', maxUses: '', lastDay: '' });

/** A stored code as the form's fields (for changing it). */
export const promoFormFrom = (promo) => ({
  code: promo.code,
  label: promo.label || '',
  maxUses: promo.maxUses != null ? String(promo.maxUses) : '',
  lastDay: toDateInput(promo.endsAt),
});

const wholeNumber = (text) => (/^\d+$/.test(String(text).trim()) ? Number(String(text).trim()) : NaN);

/**
 * The form -> `{ ok: true, body }` for POST (no `existing`) or PATCH (`existing` is the
 * stored code; the code itself never changes), or `{ ok: false, errors }` by field.
 * The last day is sent as its last moment (UTC), so the code works all that day; it's only
 * sent on a change when the day itself changed.
 */
export function promoBodyFrom(form, { existing = null } = {}) {
  const errors = {};
  const body = {};

  if (!existing) {
    const code = normalisePromoCode(form.code);
    if (code) body.code = code;
    else errors.code = 'A code is 3 to 24 letters and numbers.';
  }

  const label = serverText(form.label).slice(0, PROMO_LABEL_MAX);
  if (label) body.label = label;
  else errors.label = 'Give it a label: who it’s for, and when.';

  if (String(form.maxUses).trim()) {
    const max = wholeNumber(form.maxUses);
    if (max >= 1 && max <= PROMO_MAX_USES_MAX) body.maxUses = max;
    else errors.maxUses = 'A whole number of sign-ups, or leave it empty for no limit.';
  } else {
    body.maxUses = null;
  }

  const lastDay = String(form.lastDay).trim();
  if (lastDay && !/^\d{4}-\d{2}-\d{2}$/.test(lastDay)) errors.lastDay = 'Pick a day, or leave it empty for no end date.';
  else if (!existing || lastDay !== toDateInput(existing.endsAt)) body.endsAt = lastDay ? `${lastDay}T23:59:59.999Z` : null;

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, body };
}

/** Where a code stands: on, off, past its last day, or used up. */
export function promoState(promo, now = Date.now()) {
  if (!promo.active) return { key: 'off', label: 'Off' };
  if (promo.endsAt && new Date(promo.endsAt).getTime() <= now) return { key: 'ended', label: 'Ended' };
  if (promo.maxUses != null && (promo.signUps ?? 0) >= promo.maxUses) return { key: 'used', label: 'Used up' };
  return { key: 'on', label: 'On' };
}
