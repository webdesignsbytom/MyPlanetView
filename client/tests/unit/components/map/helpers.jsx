import React from 'react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '@/auth/AuthContext';

// Shared by the map components' tests

// jsdom has no PointerEvent, so pointerType and pointerId never reach a handler: a stand-in
// built on MouseEvent (clientX and clientY), for fireEvent.pointer*()
class TestPointerEvent extends MouseEvent {
  constructor(type, init = {}) {
    super(type, init);
    this.pointerType = init.pointerType ?? 'mouse';
    this.pointerId = init.pointerId ?? 1;
  }
}

export function stubPointerEvents() {
  vi.stubGlobal('PointerEvent', TestPointerEvent);
  if (window.PointerEvent !== TestPointerEvent) window.PointerEvent = TestPointerEvent;
}

/**
 * window.matchMedia for the phone and wide switches: `matches(query)` says which queries
 * match. Returns the stub, whose `change(matches)` tells every listener of a new answer.
 */
export function stubMatchMedia(matches = () => false) {
  const listeners = new Set();
  let decide = matches;
  const matchMedia = vi.fn((query) => ({
    get matches() {
      return Boolean(decide(query));
    },
    media: query,
    addEventListener: (_type, fn) => listeners.add(fn),
    removeEventListener: (_type, fn) => listeners.delete(fn),
    addListener: (fn) => listeners.add(fn),
    removeListener: (fn) => listeners.delete(fn),
  }));
  vi.stubGlobal('matchMedia', matchMedia);
  window.matchMedia = matchMedia;
  matchMedia.change = (next) => {
    decide = next;
    for (const fn of [...listeners]) fn();
  };
  return matchMedia;
}

/** The phone's query (utils/layout/phone.js PHONE_QUERY) matching, the rest not. */
export const phoneQueries = (query) => query.includes('max-width') || query.includes('max-height');

/** The auth context's value, with a signed-in user unless given `user: null`. */
export function authValue(overrides = {}) {
  return {
    user: { id: 'user-1', name: 'Charlie Reid', email: 'charlie@example.com', emailVerified: true },
    resendVerificationEmail: vi.fn(async () => ({ ok: true })),
    ...overrides,
  };
}

/** A router (and the auth context when given) round a component. */
export function withProviders(ui, { auth = null, route = '/', state } = {}) {
  const entries = [state === undefined ? route : { pathname: route, state }];
  const routed = <MemoryRouter initialEntries={entries}>{ui}</MemoryRouter>;
  return auth ? <AuthContext.Provider value={auth}>{routed}</AuthContext.Provider> : routed;
}
