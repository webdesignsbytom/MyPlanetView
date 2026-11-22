// A test helper, never hot-reloaded: the fast-refresh rule doesn't apply
/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import { vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { HeadProvider } from 'react-head';
import { AuthContext } from '@/auth/AuthContext';

// The auth context as AuthProvider gives it: signed out and settled unless told otherwise
export const authValue = (overrides = {}) => ({
  user: null,
  loading: false,
  isAuthenticated: false,
  refresh: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  resetPassword: vi.fn(),
  verifyEmail: vi.fn(),
  resendVerificationEmail: vi.fn(),
  changeEmail: vi.fn(),
  changePassword: vi.fn(),
  updateName: vi.fn(),
  updateAvatar: vi.fn(),
  removeAvatar: vi.fn(),
  revokeOtherSessions: vi.fn(),
  deleteAccount: vi.fn(),
  logout: vi.fn().mockResolvedValue({ ok: true }),
  ...overrides,
});

export const signedIn = (user = {}) =>
  authValue({
    user: { id: 'user-1', name: 'Charlie Reid', email: 'test@myplanetview.local', emailVerified: true, role: 'USER', ...user },
    isAuthenticated: true,
  });

// Where a redirect or a link went: the address and the state it carried
function Elsewhere() {
  const location = useLocation();
  return (
    <div data-elsewhere={`${location.pathname}${location.search}`} data-from={location.state?.from ?? ''}>
      {JSON.stringify(location.state ?? null)}
    </div>
  );
}

// The location of the page itself, so a test can read its address after it changes it
function Here() {
  const location = useLocation();
  return <span hidden data-here={`${location.pathname}${location.search}`} />;
}

/**
 * Renders `element` at `at` (an address, or { pathname, search, state }) under `path`, with
 * the head provider, the auth context and a catch-all route that shows where any redirect
 * or link went (`[data-elsewhere]`, `[data-from]`).
 */
export function renderPage(element, { path = '/', at = path, auth = authValue(), extraRoutes = null } = {}) {
  const result = render(
    <HeadProvider>
      <AuthContext.Provider value={auth}>
        <MemoryRouter initialEntries={[at]}>
          <Routes>
            <Route
              path={path}
              element={
                <>
                  {element}
                  <Here />
                </>
              }
            />
            {extraRoutes}
            <Route path='*' element={<Elsewhere />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </HeadProvider>,
  );
  return result;
}

// The page's one <main>, checked
export function onlyMain(container = document) {
  const mains = container.querySelectorAll('main');
  return { count: mains.length, main: mains[0] ?? null, id: mains[0]?.id ?? null };
}

// The page's <h1>s' text
export const headings = (container = document) => [...container.querySelectorAll('h1')].map((h) => h.textContent.trim());

// Where the router went, if anywhere
export const elsewhere = () => document.querySelector('[data-elsewhere]');
export const here = () => document.querySelector('[data-here]')?.getAttribute('data-here') ?? null;
