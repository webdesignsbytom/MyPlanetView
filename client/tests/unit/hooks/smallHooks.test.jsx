// The small hooks: contexts, confirming an action, hydration, navigation, a remembered
// promo code, and the verified-email lock
import React from 'react';
import { renderToString } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { AuthContext } from '@/auth/AuthContext';
import useConfirmAction from '@/hooks/useConfirmAction';
import useHydrated from '@/hooks/useHydrated';
import useLandmarkMarks, { LandmarkMarksContext } from '@/hooks/useLandmarkMarks';
import useMustVerifyEmail from '@/hooks/useMustVerifyEmail';
import useNavigateToPage from '@/hooks/useNavigateToPage';
import useRememberPromoCode from '@/hooks/useRememberPromoCode';
import useSplitUk, { SplitUkProvider } from '@/hooks/useSplitUk';

describe('useConfirmAction', () => {
  it('opens the modal with its words, and runs the action only once confirmed', () => {
    const action = vi.fn();
    const { result } = renderHook(() => useConfirmAction());
    expect(result.current.modalOpen).toBe(false);
    act(() => result.current.confirmAction({ action, header: 'Delete the map?', message: 'It can’t be undone.' }));
    expect(result.current.modalOpen).toBe(true);
    expect(result.current.modalContent).toEqual({ header: 'Delete the map?', message: 'It can’t be undone.' });
    expect(action).not.toHaveBeenCalled();
    act(() => result.current.handleModalConfirm());
    expect(action).toHaveBeenCalledTimes(1);
    expect(result.current.modalOpen).toBe(false);
  });

  it('closes without running anything when cancelled', () => {
    const action = vi.fn();
    const { result } = renderHook(() => useConfirmAction());
    act(() => result.current.confirmAction({ action, header: 'H', message: 'M' }));
    act(() => result.current.setModalOpen(false));
    expect(result.current.modalOpen).toBe(false);
    expect(action).not.toHaveBeenCalled();
  });

  it('confirms safely with nothing waiting', () => {
    const { result } = renderHook(() => useConfirmAction());
    act(() => result.current.handleModalConfirm());
    expect(result.current.modalOpen).toBe(false);
  });
});

describe('useHydrated', () => {
  function Probe() {
    return <span>{useHydrated() ? 'browser' : 'first render'}</span>;
  }

  it('is false in the server render a pre-rendered page is drawn from', () => {
    expect(renderToString(<Probe />)).toContain('first render');
  });

  it('is true in the browser', () => {
    expect(renderHook(() => useHydrated()).result.current).toBe(true);
  });
});

describe('useLandmarkMarks', () => {
  it('has no marks and no toggle outside the map page', () => {
    const { result } = renderHook(() => useLandmarkMarks());
    expect(result.current.stamped.size).toBe(0);
    expect(result.current.ticked.size).toBe(0);
    expect(result.current.onToggle).toBeNull();
  });

  it('gives what the map page provides', () => {
    const value = { stamped: new Set(['l1']), ticked: new Set(['l2']), onToggle: vi.fn() };
    const wrapper = ({ children }) => <LandmarkMarksContext.Provider value={value}>{children}</LandmarkMarksContext.Provider>;
    expect(renderHook(() => useLandmarkMarks(), { wrapper }).result.current).toBe(value);
  });
});

describe('useSplitUk', () => {
  it('is false outside a map: the UK is one country', () => {
    expect(renderHook(() => useSplitUk()).result.current).toBe(false);
  });

  it('follows the map that provides it', () => {
    const wrapper = ({ children }) => <SplitUkProvider value>{children}</SplitUkProvider>;
    expect(renderHook(() => useSplitUk(), { wrapper }).result.current).toBe(true);
  });
});

describe('useMustVerifyEmail', () => {
  const withUser = (user) => ({ children }) => <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;

  it.each([
    ['an unverified account', { id: 'u1', emailVerified: false }, true],
    ['a verified account', { id: 'u1', emailVerified: true }, false],
    ['nobody signed in', null, false],
    ['an account whose state isn’t known', { id: 'u1' }, false],
  ])('for %s is %s', (_who, user, expected) => {
    expect(renderHook(() => useMustVerifyEmail(), { wrapper: withUser(user) }).result.current).toBe(expected);
  });
});

describe('useNavigateToPage', () => {
  let location;
  function Where() {
    location = useLocation();
    return null;
  }
  const wrapper = ({ children }) => (
    <MemoryRouter initialEntries={['/account']}>
      {children}
      <Where />
    </MemoryRouter>
  );

  beforeEach(() => vi.stubGlobal('scrollTo', vi.fn()));

  it('scrolls to the top, then goes to the page a moment later with its state', async () => {
    const { result } = renderHook(() => useNavigateToPage(), { wrapper });
    act(() => result.current('/map', { from: 'account' }));
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    expect(location.pathname).toBe('/account');
    await waitFor(() => expect(location.pathname).toBe('/map'));
    expect(location.state).toEqual({ post: { from: 'account' } });
  });
});

describe('useRememberPromoCode', () => {
  const at = (entry) => ({ children }) => <MemoryRouter initialEntries={[entry]}>{children}</MemoryRouter>;

  it('keeps a ?code= for the visit, so the sign-up form still has it', () => {
    renderHook(() => useRememberPromoCode(), { wrapper: at('/pricing?code=SamTravels') });
    expect(sessionStorage.getItem('mpv:promoCode')).toBe('SamTravels');
  });

  it('keeps nothing without one', () => {
    renderHook(() => useRememberPromoCode(), { wrapper: at('/pricing?plan=REGULAR') });
    expect(sessionStorage.getItem('mpv:promoCode')).toBeNull();
  });
});
