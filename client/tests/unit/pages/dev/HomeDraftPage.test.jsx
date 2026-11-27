import React from 'react';
import { describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import HomeDraftPage from '@/pages/dev/HomeDraftPage';
import { DEV_HOME_DRAFT_PAGE_URL, HOME_PAGE_URL, LOGIN_PAGE_URL, MAP_PAGE_URL, SIGN_UP_PAGE_URL } from '@/utils/constants/routes';
import { getNavLinkItemsArray } from '@/utils/data/navData';
import { authValue, headings, onlyMain, renderPage, signedIn } from '../renderPage';

// jsdom loads no pictures, so the globe is never drawn here: the page's bar, cards and dialog
// still work (the e2e test, homeDraft.spec.js, sees the globe)
const open = (auth = authValue()) => renderPage(<HomeDraftPage />, { path: DEV_HOME_DRAFT_PAGE_URL, auth });
const cardIds = () => [...document.querySelectorAll('[data-destination]')].map((card) => card.getAttribute('data-destination'));
const dialog = () => document.querySelector('dialog');
const isOpen = () => dialog().hasAttribute('open');
const nav = () => within(screen.getByRole('navigation', { name: 'Main' }));
const navLinks = () => [...document.querySelectorAll('#home-draft-nav a')].map((link) => [link.textContent, link.getAttribute('href')]);

describe('HomeDraftPage (dev server only)', () => {
  it('has one main, labelled by its h1, and is never indexed', async () => {
    open();
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('home-draft-heading');
    expect(headings()).toEqual(['Picture Your Travel']);
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]').getAttribute('content')).toBe('noindex,nofollow'));
  });

  it('has the site’s real links, signed out', () => {
    open();
    expect(navLinks()).toEqual(getNavLinkItemsArray(null).map(({ label, path }) => [label, path]));
    expect(nav().getByText('Login').getAttribute('href')).toBe(LOGIN_PAGE_URL);
    expect(nav().queryByText('Logout')).toBeNull();
    // The draft stands in for the home page: Home is drawn as the page you're on
    expect(nav().getByText('Home').className).toBe('current');
    expect(nav().getByText('Home').getAttribute('href')).toBe(HOME_PAGE_URL);
    expect(screen.getByLabelText('My Planet View homepage').getAttribute('href')).toBe(HOME_PAGE_URL);
    expect(screen.getByText('Skip to main content').getAttribute('href')).toBe('#main-content');
  });

  it('has the account’s links signed in, and logs out', async () => {
    const auth = signedIn();
    open(auth);
    const user = { id: 'user-1', name: 'Charlie Reid', email: 'test@myplanetview.local', emailVerified: true, role: 'USER' };
    expect(navLinks()).toEqual(getNavLinkItemsArray(user).map(({ label, path }) => [label, path]));
    expect(nav().getByText('My map').getAttribute('href')).toBe(MAP_PAGE_URL);
    fireEvent.click(nav().getByText('Logout'));
    await waitFor(() => expect(auth.logout).toHaveBeenCalled());
  });

  it('says so when logging out fails', async () => {
    const auth = signedIn();
    auth.logout.mockResolvedValue({ ok: false, error: 'Could not log out. Try again.' });
    open(auth);
    fireEvent.click(nav().getByText('Logout'));
    expect((await screen.findByRole('alert')).textContent).toBe('Could not log out. Try again.');
  });

  it('opens and closes the menu (shown below 1200px), Escape too', () => {
    open();
    const toggle = screen.getByRole('button', { name: 'Menu' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-controls')).toBe('home-draft-nav');
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.textContent).toBe('Close');
    expect(document.querySelector('#home-draft-nav').hasAttribute('data-open')).toBe(true);
    fireEvent.keyDown(nav().getByText('About'), { key: 'Escape' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle);
    // Choosing a link closes it too
    fireEvent.click(toggle);
    fireEvent.click(nav().getByText('About'));
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('lists the admin’s pages for an admin', () => {
    open(signedIn({ role: 'ADMIN' }));
    const admin = nav().getByText('Admin').closest('details');
    expect(within(admin).getByText('Users')).toBeTruthy();
  });

  it('starts a map: sign up signed out, your map signed in', () => {
    open();
    expect(screen.getByText('Start Your Travel Map').closest('a').getAttribute('href')).toBe(SIGN_UP_PAGE_URL);
  });

  it('opens your map from the button once signed in', () => {
    open(signedIn());
    expect(screen.getByText('Open Your Travel Map').closest('a').getAttribute('href')).toBe(MAP_PAGE_URL);
  });

  it('says what the site is, then shows the features, three destination cards and no pause button', () => {
    open();
    const lede = screen.getByText('One map for a lifetime of travel: every country, photo and trip, kept private.');
    expect(lede.previousElementSibling.textContent).toBe('Map · Collect · Plan · Share');
    const features = screen.getByLabelText('Travel map features');
    expect([...features.querySelectorAll('li')].map((item) => item.textContent)).toEqual([
      'BuildYour Map',
      'AddYour Photos',
      'PlanYour Trips',
      'Take OnChallenges',
    ]);
    expect(cardIds()).toEqual(['392', '764', '036']);
    expect(screen.queryByLabelText(/rotation/)).toBeNull();
  });

  it('opens a destination from its card, and closes it', () => {
    open();
    expect(isOpen()).toBe(false);
    fireEvent.click(document.querySelector('[data-destination="392"]'));
    expect(isOpen()).toBe(true);
    const box = within(dialog());
    expect(box.getByRole('heading', { level: 2 }).textContent).toBe('Japan');
    expect(box.getByRole('heading', { level: 3 }).textContent).toBe('Mount Fuji');
    expect(box.getByText('A solitary volcanic peak above Honshu.')).toBeTruthy();
    expect(box.getByAltText('Mount Fuji')).toBeTruthy();
    fireEvent.click(box.getByLabelText('Close'));
    expect(isOpen()).toBe(false);
  });
});
