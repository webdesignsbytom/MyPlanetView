import { useCallback, useEffect, useRef, useState } from 'react';
// Api
import { checkPromoCode } from '@/api/promoApi';
// Utils
import { PROMO_CODE_INVALID, normalisePromoCode } from '@/utils/plans/promoCodes';

// How long typing pauses before the code is checked (leaving the field checks at once)
const CHECK_DELAY_MS = 600;
const NOT_CHECKED =
  'The code couldn’t be checked just now. You can still sign up: it’s checked again when you do.';

/**
 * The sign-up form's promo code, checked with the server (GET /promo-codes/:code) after a
 * pause in typing and when the field is left, so the person sees what it gives before
 * signing up. Each code is asked about once (the lookup is rate limited per address).
 * -> { result, checkNow }. `result.status`: 'idle' (empty), 'pending' (typed, not checked
 * yet), 'checking', 'valid' ({ code, trialDays }), 'invalid' ({ message }) or 'unknown' (the
 * check failed: the server decides at sign-up).
 */
export default function usePromoCodeCheck(value) {
  const [result, setResult] = useState({ status: 'idle' });
  const known = useRef(new Map()); // code -> a 'valid' or 'invalid' result
  const latest = useRef(0);
  const timer = useRef(null);

  const check = useCallback(async (typed) => {
    clearTimeout(timer.current);
    const ticket = ++latest.current;
    if (!String(typed || '').trim()) return setResult({ status: 'idle' });
    const code = normalisePromoCode(typed);
    if (!code) return setResult({ status: 'invalid', message: PROMO_CODE_INVALID });
    if (known.current.has(code)) return setResult(known.current.get(code));

    setResult({ status: 'checking', code });
    let next;
    try {
      const { promoCode } = await checkPromoCode(code);
      next = { status: 'valid', code: promoCode.code, trialDays: promoCode.trialDays ?? null };
      known.current.set(code, next);
    } catch (err) {
      if (err?.response?.status === 404) {
        next = { status: 'invalid', code, message: err.friendlyMessage || PROMO_CODE_INVALID };
        known.current.set(code, next);
      } else {
        next = { status: 'unknown', code, message: NOT_CHECKED };
      }
    }
    if (ticket === latest.current) setResult(next);
    return undefined;
  }, []);

  // Typing: the old answer goes at once, and the new code is checked after a pause
  useEffect(() => {
    clearTimeout(timer.current);
    latest.current += 1;
    if (!value.trim()) {
      setResult({ status: 'idle' });
      return undefined;
    }
    setResult((current) => (current.status === 'idle' || current.code !== normalisePromoCode(value) ? { status: 'pending' } : current));
    timer.current = setTimeout(() => check(value), CHECK_DELAY_MS);
    return () => clearTimeout(timer.current);
  }, [value, check]);

  // Leaving the field: now, unless this code already has its answer
  const checkNow = useCallback(() => {
    const code = normalisePromoCode(value);
    if (code && code === result.code && result.status !== 'pending') return;
    check(value);
  }, [value, result, check]);

  return { result, checkNow };
}
