import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import FooterNavSection from '@/components/footer/FooterNavSection';
import FooterContactSection from '@/components/footer/FooterContactSection';
import FooterCopyrightSection from '@/components/footer/FooterCopyrightSection';
import FooterLogoSection from '@/components/footer/FooterLogoSection';
import { openCookieSettings } from '@/utils/analytics/consent';
import { CompanyEmailAddress, CompanyName, CompanyTagLine, DEVELOPER_URL } from '@/utils/constants/constants';

vi.mock('@/utils/analytics/consent', () => ({ openCookieSettings: vi.fn() }));

// The footer with the country guides checked or not: its link groups are built when the data
// module loads, so each case loads it afresh
const loadFooter = async (checked) => {
  vi.resetModules();
  vi.doMock('@/utils/countries/countryPages', () => ({ HAS_CHECKED_COUNTRY_PAGES: checked }));
  const { default: FooterComponent } = await import('@/components/footer/FooterComponent');
  const { AuthContext } = await import('@/auth/AuthContext');
  const { MemoryRouter: Router } = await import('react-router-dom');
  return (user = null) =>
    render(
      <AuthContext.Provider value={{ user }}>
        <Router>
          <FooterComponent />
        </Router>
      </AuthContext.Provider>,
    );
};

const linksOf = (id) => [...document.querySelector(`nav[aria-labelledby="${id}"]`).querySelectorAll('li')].map((li) => li.textContent);

describe('FooterComponent', () => {
  it('is the site’s contentinfo, with Sign up and Log in for a visitor', { timeout: 20000 }, async () => {
    const show = await loadFooter(false);
    show();
    const footer = document.querySelector('footer');
    expect(footer.getAttribute('role')).toBe('contentinfo');
    expect(footer.getAttribute('aria-label')).toBe(`${CompanyName} site footer`);
    expect(linksOf('footer-explore')).toEqual(['Home', 'About', 'FAQ', 'Pricing', 'Contact']);
    expect(linksOf('footer-account')).toEqual(['Sign up', 'Log in']);
    expect(linksOf('footer-legal')).toEqual(['Terms', 'Privacy', 'Cookie settings']);
  });

  it('links My map, Challenges and Account for someone signed in', { timeout: 20000 }, async () => {
    const show = await loadFooter(false);
    show({ email: 'sam@example.com' });
    expect(linksOf('footer-account')).toEqual(['My map', 'Challenges', 'Account']);
  });

  it('adds Countries once a country guide is checked', { timeout: 20000 }, async () => {
    const show = await loadFooter(true);
    show();
    expect(linksOf('footer-explore')).toEqual(['Home', 'About', 'FAQ', 'Pricing', 'Countries', 'Contact']);
  });
});

describe('FooterNavSection', () => {
  it('lists its links under its heading, and makes "Cookie settings" a button that opens the cookie choice', () => {
    render(
      <MemoryRouter>
        <FooterNavSection
          id='legal'
          title='Legal'
          links={[
            { name: 'Terms', route: '/terms' },
            { name: 'Cookie settings', action: 'cookie-settings' },
          ]}
        />
      </MemoryRouter>,
    );
    const nav = document.querySelector('nav');
    expect(nav.getAttribute('aria-labelledby')).toBe('legal');
    expect(document.getElementById('legal').textContent).toBe('Legal');
    expect(screen.getByText('Terms').getAttribute('href')).toBe('/terms');
    const settings = screen.getByText('Cookie settings');
    expect(settings.tagName).toBe('BUTTON');
    expect(settings.getAttribute('type')).toBe('button');
    fireEvent.click(settings);
    expect(openCookieSettings).toHaveBeenCalledTimes(1);
  });
});

describe('FooterContactSection', () => {
  it('links the address, which may wrap after the @, and says who runs the site', () => {
    render(<FooterContactSection />);
    const link = screen.getByLabelText(`Email ${CompanyName}`);
    expect(link.getAttribute('href')).toBe(`mailto:${CompanyEmailAddress}`);
    expect(link.textContent).toBe(CompanyEmailAddress);
    expect(link.querySelector('wbr')).toBeTruthy();
    expect(screen.getByText(/^Run by /).textContent).toMatch(/Devon\.$/);
    expect(document.querySelector('section').getAttribute('aria-labelledby')).toBe('footer-contact');
  });
});

describe('FooterCopyrightSection', () => {
  it('says the build’s year in the pre-render and this year in the browser', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2031-03-01T12:00:00Z'));
    try {
      expect(renderToString(<FooterCopyrightSection />)).toContain(`2026<!-- --> <!-- -->${CompanyName}`);
      render(<FooterCopyrightSection />);
      expect(screen.getByText(`© 2031 ${CompanyName}`)).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('credits the developer in a new tab, not followed', () => {
    render(<FooterCopyrightSection />);
    const link = document.querySelector(`a[href="${DEVELOPER_URL}"]`);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer nofollow');
  });
});

describe('FooterLogoSection', () => {
  it('names the site for screen readers beside the decorative logo, with its tagline', () => {
    render(<FooterLogoSection />);
    const heading = document.getElementById('footer-brand');
    expect(heading.textContent).toBe(CompanyName);
    expect(heading.className).toContain('sr-only');
    expect(document.querySelector('img').getAttribute('alt')).toBe('');
    expect(screen.getByText(CompanyTagLine)).toBeTruthy();
  });
});
