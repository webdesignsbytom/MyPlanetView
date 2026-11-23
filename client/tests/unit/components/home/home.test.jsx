import React from 'react';
import { describe, expect, it } from 'vitest';
import HomeHeroArtwork from '@/components/home/HomeHeroArtwork';
import HomePageHeader from '@/components/home/HomePageHeader';
import HomePageMainContainer from '@/components/home/HomePageMainContainer';
import HomeStartButton from '@/components/home/HomeStartButton';
import { homeHero } from '@/utils/data/homeData';
import { onlyMain, renderPage, signedIn } from '../../pages/renderPage';

describe('HomeStartButton', () => {
  it('sends a visitor to sign up', () => {
    const { container } = renderPage(<HomeStartButton />);
    const link = container.querySelector('a');
    expect(link.textContent).toBe('Start your map');
    expect(link.getAttribute('href')).toBe('/sign-up');
  });

  it('opens the map for someone signed in', () => {
    const { container } = renderPage(<HomeStartButton />, { auth: signedIn() });
    const link = container.querySelector('a');
    expect(link.textContent).toBe('Open your map');
    expect(link.getAttribute('href')).toBe('/map');
  });
});

describe('HomeHeroArtwork', () => {
  it('serves the phone, tablet and desktop artwork, decorative, the desktop one as the fallback', () => {
    const { container } = renderPage(<HomeHeroArtwork />);
    const sources = [...container.querySelectorAll('picture source')];
    expect(sources.map((source) => source.getAttribute('type'))).toEqual(['image/avif', 'image/webp', 'image/avif', 'image/webp', 'image/avif']);
    expect(sources[0].getAttribute('media')).toBe('(max-width: 767px) and (orientation: portrait)');
    expect(sources[2].getAttribute('media')).toBe('(max-width: 1279px) and (orientation: portrait)');
    // The last source has no media: it's the desktop's
    expect(sources[4].getAttribute('media')).toBeNull();
    const img = container.querySelector('img');
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('fetchpriority')).toBe('high');
  });

  it('preloads each shape’s artwork for its own screens only', () => {
    renderPage(<HomeHeroArtwork />);
    const preloads = [...document.head.querySelectorAll('link[rel="preload"][as="image"]')];
    expect(preloads.length).toBe(3);
    expect(preloads.map((link) => link.getAttribute('media'))).toEqual([
      '(max-width: 767px) and (orientation: portrait)',
      '(min-width: 768px) and (max-width: 1279px) and (orientation: portrait)',
      '(orientation: landscape), (min-width: 1280px)',
    ]);
  });
});

describe('HomePageHeader and HomePageMainContainer', () => {
  it('gives the page one main, named by the hidden h1, with the start button', () => {
    const { container } = renderPage(<HomePageMainContainer />);
    const { count, main, id } = onlyMain(container);
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('tabindex')).toBe('-1');
    expect(main.getAttribute('aria-labelledby')).toBe('home-heading');
    const h1 = container.querySelector('h1#home-heading');
    expect(h1.textContent).toBe(homeHero.title);
    expect(h1.className).toContain('sr-only');
    expect(container.textContent).toContain(homeHero.tagline);
    expect(container.querySelector('a').getAttribute('href')).toBe('/sign-up');
  });

  it('the header is a section named by the h1', () => {
    const { container } = renderPage(<HomePageHeader />);
    expect(container.querySelector('section').getAttribute('aria-labelledby')).toBe('home-heading');
  });
});
