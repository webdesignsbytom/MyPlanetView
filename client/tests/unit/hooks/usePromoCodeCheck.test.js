import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import usePromoCodeCheck from '@/hooks/usePromoCodeCheck';
import { checkPromoCode } from '@/api/promoApi';
import { PROMO_CODE_INVALID } from '@/utils/plans/promoCodes';

vi.mock('@/api/promoApi', () => ({ checkPromoCode: vi.fn() }));

const wait = (ms) => act(async () => vi.advanceTimersByTimeAsync(ms));
const notFound = (message) => Object.assign(new Error('x'), { friendlyMessage: message, response: { status: 404 } });
const typing = (value = '') => renderHook(({ value: v }) => usePromoCodeCheck(v), { initialProps: { value } });

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  checkPromoCode.mockImplementation(async (code) => ({ promoCode: { code, freePlan: null, trialDays: 30 } }));
});

afterEach(() => vi.useRealTimers());

describe('usePromoCodeCheck', () => {
  it('is idle while the field is empty', () => {
    expect(typing('').result.current.result).toEqual({ status: 'idle' });
    expect(typing('   ').result.current.result).toEqual({ status: 'idle' });
  });

  it('checks a code 600 ms after typing pauses, written as it is stored', async () => {
    const { result } = typing('sam-travels');
    expect(result.current.result).toEqual({ status: 'pending' });
    await wait(599);
    expect(checkPromoCode).not.toHaveBeenCalled();
    await wait(1);
    expect(checkPromoCode).toHaveBeenCalledWith('SAMTRAVELS');
    expect(result.current.result).toEqual({ status: 'valid', code: 'SAMTRAVELS', freePlan: null, trialDays: 30, fromFriend: null });
  });

  it('says what a member’s invite code and a code for life give', async () => {
    checkPromoCode.mockResolvedValueOnce({ promoCode: { code: 'JO1234', fromFriend: 'Jo' } });
    const { result, rerender } = typing('jo1234');
    await wait(600);
    expect(result.current.result).toMatchObject({ status: 'valid', fromFriend: 'Jo', freePlan: null, trialDays: null });
    checkPromoCode.mockResolvedValueOnce({ promoCode: { code: 'FOREVER', freePlan: 'PREMIUM' } });
    rerender({ value: 'FOREVER' });
    await wait(600);
    expect(result.current.result).toMatchObject({ status: 'valid', freePlan: 'PREMIUM' });
  });

  it('turns a code that can’t be one away without asking', async () => {
    const { result } = typing('ab');
    await wait(600);
    expect(result.current.result).toEqual({ status: 'invalid', message: PROMO_CODE_INVALID });
    expect(checkPromoCode).not.toHaveBeenCalled();
  });

  it('asks about each code once, valid or not', async () => {
    checkPromoCode.mockImplementation(async (code) => {
      if (code === 'NOPE') throw notFound('That code isn’t valid.');
      return { promoCode: { code } };
    });
    const { result, rerender } = typing('NOPE');
    await wait(600);
    expect(result.current.result).toEqual({ status: 'invalid', code: 'NOPE', message: 'That code isn’t valid.' });
    rerender({ value: 'SAMTRAVELS' });
    await wait(600);
    rerender({ value: 'NOPE' });
    await wait(600);
    rerender({ value: 'SAMTRAVELS' });
    await wait(600);
    expect(result.current.result.status).toBe('valid');
    expect(checkPromoCode).toHaveBeenCalledTimes(2);
  });

  it('says it couldn’t check when the lookup fails, and asks again later', async () => {
    checkPromoCode.mockRejectedValueOnce(Object.assign(new Error('x'), { response: { status: 429 } }));
    const { result, rerender } = typing('SAMTRAVELS');
    await wait(600);
    expect(result.current.result.status).toBe('unknown');
    expect(result.current.result.message).toMatch(/checked again when you do/);
    rerender({ value: 'SAMTRAVELS ' });
    await wait(600);
    expect(result.current.result.status).toBe('valid');
    expect(checkPromoCode).toHaveBeenCalledTimes(2);
  });

  it('checks at once when the field is left, and not again once answered', async () => {
    const { result } = typing('SAMTRAVELS');
    await act(async () => result.current.checkNow());
    expect(checkPromoCode).toHaveBeenCalledTimes(1);
    expect(result.current.result.status).toBe('valid');
    await act(async () => result.current.checkNow());
    await wait(600);
    expect(checkPromoCode).toHaveBeenCalledTimes(1);
  });

  it('drops an answer for a code that was typed over meanwhile', async () => {
    let answer;
    checkPromoCode.mockReturnValueOnce(new Promise((resolve) => (answer = resolve)));
    const { result, rerender } = typing('FIRSTCODE');
    await wait(600);
    expect(result.current.result).toEqual({ status: 'checking', code: 'FIRSTCODE' });
    rerender({ value: 'SECONDCODE' });
    expect(result.current.result).toEqual({ status: 'pending' });
    await act(async () => answer({ promoCode: { code: 'FIRSTCODE' } }));
    expect(result.current.result).toEqual({ status: 'pending' });
  });

  it('goes back to idle when the field is emptied', async () => {
    const { result, rerender } = typing('SAMTRAVELS');
    await wait(600);
    rerender({ value: '' });
    expect(result.current.result).toEqual({ status: 'idle' });
  });
});
