import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppErrorScreen from '@/components/utils/AppErrorScreen';
import AppPageHead from '@/components/utils/AppPageHead';
import BackToTopButton from '@/components/utils/BackToTopButton';
import CountrySelect from '@/components/utils/CountrySelect';
import { HelmetItem } from '@/components/utils/HelmetItem';
import LoadingScreen from '@/components/utils/LoadingScreen';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import OfflineNotice from '@/components/utils/OfflineNotice';
import { CompanyName, FULL_BUSINESS_URL } from '@/utils/constants/constants';
import { HOME_PAGE_URL, ACCOUNT_PAGE_URL } from '@/utils/constants/routes';
import { helmetData } from '@/utils/data/helmetData';

vi.mock('@/components/nav/Navbar', () => ({ default: () => <nav data-test-nav>Nav</nav> }));
// react-head's tags need its provider and portal: stand-ins drawn where they are, to read back
vi.mock('react-head', () => ({
  Title: ({ children }) => <span data-head-title>{children}</span>,
  Meta: (props) => <meta data-head {...props} />,
  Link: (props) => <link data-head {...props} />,
}));
const HeadProvider = ({ children }) => children;

const offline = (value) => vi.spyOn(Navigator.prototype, 'onLine', 'get').mockReturnValue(!value);

afterEach(() => {
  vi.useRealTimers();
});

const headTitle = () => document.querySelector('[data-head-title]')?.textContent;

describe('AppErrorScreen', () => {
  it('says something went wrong, focuses its heading and offers a reload and the home page', () => {
    offline(false);
    render(<AppErrorScreen />);
    const main = document.querySelector('main');
    expect(main.id).toBe('main-content');
    expect(document.querySelectorAll('main').length).toBe(1);
    const heading = document.getElementById('app-error-heading');
    expect(heading.textContent).toBe('Something went wrong');
    expect(main.getAttribute('aria-labelledby')).toBe('app-error-heading');
    expect(document.activeElement).toBe(heading);
    expect(screen.getByText(/couldn’t be drawn/)).toBeTruthy();
    expect(screen.getByText('Reload the page').tagName).toBe('BUTTON');
    // a plain link: it sits outside the router
    expect(screen.getByText('Back to the home page').getAttribute('href')).toBe(HOME_PAGE_URL);
    expect(screen.getByText('Flight')).toBeTruthy();
  });

  it('says so when offline, and reloads by itself once back online', () => {
    offline(true);
    const add = vi.spyOn(window, 'addEventListener');
    const { unmount } = render(<AppErrorScreen />);
    expect(document.getElementById('app-error-heading').textContent).toBe('You’re offline');
    expect(screen.getByText(/needs a connection/)).toBeTruthy();
    expect(screen.getByText('signal')).toBeTruthy();
    const call = add.mock.calls.find(([type]) => type === 'online');
    expect(call[2]).toEqual({ once: true });
    const remove = vi.spyOn(window, 'removeEventListener');
    unmount();
    expect(remove).toHaveBeenCalledWith('online', call[1]);
  });
});

describe('OfflineNotice', () => {
  it('shows nothing while online', () => {
    offline(false);
    const { container } = render(<OfflineNotice />);
    expect(container.innerHTML).toBe('');
  });

  it('says "You’re offline" as a status, and goes when the connection is back', () => {
    const spy = offline(true);
    render(<OfflineNotice />);
    expect(screen.getByRole('status').textContent).toContain('You’re offline.');
    spy.mockReturnValue(true);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(screen.queryByRole('status')).toBeNull();
  });
});

describe('BackToTopButton', () => {
  it('shows only once the page has scrolled, then scrolls up and focuses the main', () => {
    vi.useFakeTimers();
    const scrollTo = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);
    render(
      <>
        <main tabIndex={-1}>Page</main>
        <BackToTopButton />
      </>,
    );
    const button = screen.getByLabelText('Back to top of page');
    expect(button.className).toContain('opacity-0');
    act(() => {
      window.scrollY = 400;
      window.dispatchEvent(new Event('scroll'));
    });
    expect(button.className).toContain('opacity-100');
    fireEvent.click(button);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(document.activeElement.tagName).toBe('MAIN');
    act(() => {
      window.scrollY = 0;
      window.dispatchEvent(new Event('scroll'));
    });
    expect(button.className).toContain('opacity-0');
  });
});

describe('CountrySelect', () => {
  it('offers the most chosen countries, then all of them', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const onChange = vi.fn();
    render(<CountrySelect value='United Kingdom' onChange={onChange} required ariaInvalid ariaDescribedBy='e' />);
    const select = screen.getByLabelText('Select your country');
    expect(select.id).toBe('country');
    expect(select.name).toBe('country');
    expect([...select.querySelectorAll('optgroup')].map((g) => g.label)).toEqual(['Most chosen', 'All countries']);
    expect(select.querySelector('optgroup').textContent).toBe('United KingdomUnited States');
    expect(select.getAttribute('title')).toBe('United Kingdom');
    expect(select.required).toBe(true);
    expect(select.getAttribute('aria-invalid')).toBe('true');
    expect(select.getAttribute('aria-describedby')).toBe('e');
  });
});

describe('HelmetItem', () => {
  const meta = (key) =>
    document.querySelector(`meta[name="${key}"]`)?.getAttribute('content') ??
    document.querySelector(`meta[property="${key}"]`)?.getAttribute('content');

  it('writes the title, robots, description, canonical and social tags', () => {
    render(
      <HeadProvider>
        <HelmetItem PageName='About' desc='About us.' canonicalPath='/about/' />
      </HeadProvider>,
    );
    expect(headTitle()).toBe(`About | ${CompanyName}`);
    expect(meta('robots')).toBe('index,follow');
    expect(meta('description')).toBe('About us.');
    expect(document.querySelector('link[rel="canonical"]').getAttribute('href')).toBe(`${FULL_BUSINESS_URL}/about`);
    expect(meta('og:title')).toBe(`About | ${CompanyName}`);
    expect(meta('og:url')).toBe(`${FULL_BUSINESS_URL}/about`);
    expect(meta('og:site_name')).toBe(CompanyName);
    expect(meta('twitter:card')).toBe('summary_large_image');
  });

  it('a page with no description gets the home page’s, never the starter template’s', () => {
    render(
      <HeadProvider>
        <HelmetItem PageName='New page' canonicalPath='/new/' />
      </HeadProvider>,
    );
    expect(meta('description')).toBe(helmetData[HOME_PAGE_URL].desc);
    expect(meta('og:description')).toBe(helmetData[HOME_PAGE_URL].desc);
    expect(meta('description')).not.toMatch(/web development/i);
  });

  it('lets a full title, noindex, an image and its own social tags win, and adds structured data', () => {
    const { container } = render(
      <HeadProvider>
        <HelmetItem
          title='My Planet View: your travel map'
          indexing='noindex,nofollow'
          ogImage='https://img.example/og.jpg'
          additionalMeta={[{ property: 'og:type', content: 'article' }]}
          structuredData={[{ '@type': 'Organization' }, null]}
        />
      </HeadProvider>,
    );
    expect(headTitle()).toBe('My Planet View: your travel map');
    expect(meta('robots')).toBe('noindex,nofollow');
    expect(meta('og:image')).toBe('https://img.example/og.jpg');
    expect(document.querySelectorAll('meta[property="og:type"]').length).toBe(1);
    expect(meta('og:type')).toBe('article');
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBe(1);
    expect(JSON.parse(scripts[0].textContent)['@type']).toBe('Organization');
  });
});

describe('AppPageHead', () => {
  it('uses the route’s entry, a title of its own, and the address as canonical', () => {
    render(
      <HeadProvider>
        <MemoryRouter initialEntries={['/maps/abc']}>
          <AppPageHead route={ACCOUNT_PAGE_URL} title='Our travels' />
        </MemoryRouter>
      </HeadProvider>,
    );
    expect(headTitle()).toContain('Our travels');
    expect(document.querySelector('meta[name="robots"]').getAttribute('content')).toBe(helmetData[ACCOUNT_PAGE_URL].indexing);
    expect(document.querySelector('link[rel="canonical"]').getAttribute('href')).toBe(`${FULL_BUSINESS_URL}/maps/abc`);
  });

  it('falls back to the page’s own name', () => {
    render(
      <HeadProvider>
        <MemoryRouter initialEntries={[ACCOUNT_PAGE_URL]}>
          <AppPageHead route={ACCOUNT_PAGE_URL} />
        </MemoryRouter>
      </HeadProvider>,
    );
    expect(headTitle()).toContain(helmetData[ACCOUNT_PAGE_URL].pageName);
  });
});

describe('LoadingScreen and LoadingSpinner', () => {
  it('announces that the page is loading, under the nav', () => {
    render(<LoadingScreen />);
    const screenEl = document.getElementById('loading-screen');
    expect(screenEl.getAttribute('aria-busy')).toBe('true');
    expect(screenEl.getAttribute('aria-labelledby')).toBe('loading-description');
    expect(document.getElementById('loading-description').textContent).toContain('loading');
    expect(document.querySelector('[data-test-nav]')).toBeTruthy();
    expect(screenEl.querySelector('svg').getAttribute('class')).toContain('w-12');
  });

  it('spins at the size asked for, with words for screen readers', () => {
    const { container, unmount } = render(<LoadingSpinner xs />);
    expect(container.querySelector('svg').getAttribute('class')).toContain('w-6 h-6');
    expect(screen.getByText('Loading...').className).toBe('sr-only');
    unmount();
    const large = render(<LoadingSpinner lg />);
    expect(large.container.querySelector('svg').getAttribute('class')).toContain('w-20 h-20');
    large.unmount();
    const plain = render(<LoadingSpinner />);
    expect(plain.container.querySelector('svg').getAttribute('class')).toContain('w-8 h-8');
    expect(plain.container.querySelector('svg').getAttribute('class')).toContain('animate-spin');
  });
});
