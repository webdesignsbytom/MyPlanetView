import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '@/components/nav/Navbar';
import MenuStampButton from '@/components/nav/MenuStampButton';
import { NAV_TRIAL_STYLES, navTrialClass } from '@/components/nav/navStyleTrial';
import { AuthContext } from '@/auth/AuthContext';
import { prefetchRoute } from '@/utils/navigation/prefetchRoute';
import { CompanyName } from '@/utils/constants/constants';
import { CHALLENGES_PAGE_URL, COUNTRIES_PAGE_URL, MAP_PAGE_URL } from '@/utils/constants/routes';

// Whether a country guide is checked: read when the nav's links are built
const guides = vi.hoisted(() => ({ checked: false }));
vi.mock('@/utils/countries/countryPages', () => ({
  get HAS_CHECKED_COUNTRY_PAGES() {
    return guides.checked;
  },
}));
vi.mock('@/utils/navigation/prefetchRoute', () => ({ prefetchRoute: vi.fn() }));

const draw = ({ user = null, logout = vi.fn(), variant, path = '/' } = {}) => {
  const view = render(
    <AuthContext.Provider value={{ user, logout }}>
      <MemoryRouter initialEntries={[path]}>
        <Navbar variant={variant} />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
  const nav = view.container.querySelector('nav');
  // The desktop and phone lists draw the same links
  const desktop = nav.querySelector('section.lg\\:grid');
  const labels = () => [...desktop.querySelectorAll(':scope > ul > li')].map((li) => li.textContent);
  return { nav, desktop, labels, logout, ...view };
};

describe('Navbar', () => {
  it('signed out: Home, the public pages, Login and Sign Up, no Challenges or My map', () => {
    guides.checked = false;
    const { labels } = draw();
    expect(labels()).toEqual(['Home', 'About', 'FAQ', 'Pricing', 'Contact', 'Login', 'Sign Up']);
  });

  it('shows "Countries" after Home only once a guide is checked', () => {
    guides.checked = true;
    const { labels, desktop } = draw();
    expect(labels().slice(0, 2)).toEqual(['Home', 'Countries']);
    expect(desktop.querySelector(`a[href="${COUNTRIES_PAGE_URL}"]`)).toBeTruthy();
    guides.checked = false;
  });

  it('signed in: My map and Challenges first, Account and Logout last', () => {
    guides.checked = false;
    const { labels, desktop } = draw({ user: { email: 'sam@example.com', role: 'USER' } });
    expect(labels()).toEqual(['My map', 'Challenges', 'Home', 'About', 'FAQ', 'Pricing', 'Contact', 'Account', 'Logout']);
    expect(desktop.querySelector(`a[href="${MAP_PAGE_URL}"]`)).toBeTruthy();
    expect(desktop.querySelector(`a[href="${CHALLENGES_PAGE_URL}"]`)).toBeTruthy();
  });

  it('gives admins an Admin menu that opens on a press and shuts on Escape or a press outside', () => {
    const { desktop } = draw({ user: { email: 'a@example.com', role: 'ADMIN' } });
    const toggle = desktop.querySelector('button[aria-haspopup="true"]');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    const submenu = document.getElementById(toggle.getAttribute('aria-controls'));
    const items = [...submenu.querySelectorAll('li')].map((li) => li.textContent);
    expect(items).toEqual(['Dashboard', 'Contact Forms', 'Users', 'Promo Codes', 'Travel Offers', 'Photo Themes']);
    fireEvent.keyDown(toggle, { key: 'Escape' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(toggle);
    fireEvent.mouseDown(document.body);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('adds the audit log for developers', () => {
    const { desktop } = draw({ user: { email: 'd@example.com', role: 'DEVELOPER' } });
    fireEvent.click(desktop.querySelector('button[aria-haspopup="true"]'));
    expect(desktop.textContent).toContain('Audit Log');
  });

  it('marks the current page and prefetches a page on intent', () => {
    const { desktop } = draw({ path: '/about' });
    const about = desktop.querySelector('a[href="/about"]');
    expect(about.getAttribute('aria-current')).toBe('page');
    expect(about.getAttribute('aria-label')).toBe('About page navigation tab');
    fireEvent.mouseEnter(about);
    fireEvent.focus(about);
    expect(prefetchRoute).toHaveBeenCalledWith('/about');
  });

  it('has a skip link, two home links named for the site and its links as structured data', () => {
    const { nav } = draw();
    expect(nav.getAttribute('aria-label')).toBe('Main Navigation');
    expect(screen.getByText('Skip to main content').getAttribute('href')).toBe('#main-content');
    expect(nav.querySelectorAll(`a[aria-label="${CompanyName} homepage"]`).length).toBe(2);
    const ld = JSON.parse(nav.querySelector('script[type="application/ld+json"]').textContent);
    expect(ld['@graph'][0]).toEqual({ '@type': 'SiteNavigationElement', name: 'Home', url: '/' });
  });

  it('is the column on the poster frame, a bar elsewhere', () => {
    expect(draw({ variant: 'column' }).nav.className).toContain('lg:top-2');
    expect(draw().nav.className).not.toContain('lg:top-2');
  });

  it('logs out, then says so', async () => {
    const logout = vi.fn().mockResolvedValue({ ok: true });
    const { desktop } = draw({ user: { email: 'sam@example.com' }, logout });
    const button = desktop.querySelector('[data-analytics-action="logout"]');
    expect(button.getAttribute('aria-label')).toBe(`Log out sam@example.com from ${CompanyName}`);
    await act(async () => {
      fireEvent.click(button);
    });
    expect(logout).toHaveBeenCalledTimes(1);
    expect(document.getElementById('nav-live').textContent).toBe('You have been logged out.');
  });

  it('says why when logging out fails, and still counts them signed in', async () => {
    const logout = vi.fn().mockResolvedValue({ ok: false, error: 'You’re still logged in.' });
    const { desktop } = draw({ user: { email: 'sam@example.com' }, logout });
    fireEvent.click(desktop.querySelector('[data-analytics-action="logout"]'));
    await waitFor(() => expect(desktop.querySelector('[data-logout-error]')).toBeTruthy());
    const error = desktop.querySelector('[data-logout-error]');
    expect(error.textContent).toBe('You’re still logged in.');
    expect(error.getAttribute('role')).toBe('alert');
    expect(document.getElementById('nav-live').textContent).toBe('');
  });

  it('on phones, keeps the menu inert until the MENU stamp opens it', () => {
    const { nav } = draw();
    const panel = nav.querySelector('#mobile-nav');
    const toggle = nav.querySelector('button[aria-controls="mobile-nav"]');
    expect(panel.hasAttribute('inert')).toBe(true);
    expect(toggle.getAttribute('aria-label')).toBe('Open navigation menu');
    fireEvent.click(toggle);
    expect(panel.hasAttribute('inert')).toBe(false);
    expect(toggle.getAttribute('aria-label')).toBe('Close navigation menu');
    expect(panel.querySelector('a[href="/faq"]')).toBeTruthy();
  });

  it('on phones, opens the Admin submenu in place', () => {
    const { nav } = draw({ user: { email: 'a@example.com', role: 'ADMIN' } });
    const toggle = nav.querySelector('[aria-label="Admin submenu toggle"]');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById('mobile-submenu-Admin').textContent).toContain('Users');
  });

  it('on phones, closes the menu after logging out', async () => {
    const logout = vi.fn().mockResolvedValue({ ok: true });
    const { nav } = draw({ user: { email: 'sam@example.com' }, logout });
    const toggle = nav.querySelector('button[aria-controls="mobile-nav"]');
    fireEvent.click(toggle);
    await act(async () => {
      fireEvent.click(nav.querySelector('#mobile-nav [data-analytics-action="logout"]'));
    });
    expect(nav.querySelector('#mobile-nav').hasAttribute('inert')).toBe(true);
    expect(document.activeElement).toBe(toggle);
  });
});

describe('MenuStampButton', () => {
  it('reads MENU closed and CLOSE open, saying what it controls', () => {
    const onClick = vi.fn();
    const { rerender } = render(<MenuStampButton open={false} onClick={onClick} controls='mobile-nav' />);
    const button = screen.getByLabelText('Open navigation menu');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(button.getAttribute('aria-controls')).toBe('mobile-nav');
    expect(button.textContent).toBe('Menu');
    expect(button.className).toContain('-rotate-12');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalled();
    rerender(<MenuStampButton open onClick={onClick} controls='mobile-nav' />);
    const open = screen.getByLabelText('Close navigation menu');
    expect(open.textContent).toBe('Close');
    expect(open.getAttribute('aria-expanded')).toBe('true');
  });
});

describe('navTrialClass', () => {
  it('gives each place in the list its own look, round again after ten, active or not', () => {
    expect(NAV_TRIAL_STYLES.length).toBe(10);
    expect(navTrialClass(0)).toContain(NAV_TRIAL_STYLES[0].base);
    expect(navTrialClass(0, true)).toContain(NAV_TRIAL_STYLES[0].active);
    expect(navTrialClass(12)).toBe(navTrialClass(2));
    expect(navTrialClass(3)).toContain('font-travel');
  });
});
