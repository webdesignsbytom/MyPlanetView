import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import AppImage from '@/components/common/AppImage';
import ResponsiveImage from '@/components/common/ResponsiveImage';
import { getImageSets } from '@/lib/media/imageManifest';

vi.mock('@/lib/media/imageManifest', () => ({ getImageSets: vi.fn() }));
// react-head's tags need its provider: a stand-in that shows what it was given
vi.mock('react-head', () => ({ Link: (props) => <link data-head-link {...props} /> }));

describe('AppImage', () => {
  it('lazy-loads by default, blurred until it has loaded', () => {
    render(<AppImage src='/a.jpg' alt='A beach' width={400} height={300} />);
    const img = screen.getByAltText('A beach');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('decoding')).toBe('async');
    expect(img.getAttribute('referrerpolicy')).toBe('no-referrer');
    expect(img.getAttribute('fetchpriority')).toBeNull();
    expect(img.className).toContain('blur-sm');
    // the box keeps the picture's shape before it loads
    expect(img.parentElement.style.aspectRatio).toBe('400 / 300');
    fireEvent.load(img);
    expect(img.className).toContain('blur-0');
  });

  it('loads at once and first when it has priority', () => {
    render(<AppImage src='/a.jpg' alt='Hero' priority ratio='16:9' />);
    const img = screen.getByAltText('Hero');
    expect(img.getAttribute('loading')).toBe('eager');
    expect(img.getAttribute('fetchpriority')).toBe('high');
    expect(img.parentElement.style.aspectRatio).toBe('16/9');
  });

  it('falls back to its fallback when the picture fails', () => {
    const onError = vi.fn();
    render(<AppImage src='/missing.avif' fallbackSrc='/fallback.jpg' alt='Poster' onError={onError} />);
    const img = screen.getByAltText('Poster');
    fireEvent.error(img);
    expect(img.getAttribute('src')).toBe('/fallback.jpg');
    expect(onError).toHaveBeenCalled();
  });

  it('offers its sources in a picture', () => {
    const { container } = render(
      <AppImage src='/a.jpg' alt='' sources={[{ type: 'image/avif', srcSet: '/a.avif 400w', sizes: '50vw' }, { media: '(min-width: 1px)', srcSet: '/b.webp' }]} />,
    );
    const sources = container.querySelectorAll('picture source');
    expect(sources.length).toBe(2);
    expect(sources[0].getAttribute('type')).toBe('image/avif');
    expect(sources[0].getAttribute('sizes')).toBe('50vw');
    expect(sources[1].getAttribute('media')).toBe('(min-width: 1px)');
  });

  it('is a figure described by its caption', () => {
    const { container } = render(<AppImage src='/a.jpg' alt='Rome' caption='The Colosseum at dusk' />);
    const figure = container.querySelector('figure');
    const caption = figure.querySelector('figcaption');
    expect(caption.textContent).toBe('The Colosseum at dusk');
    expect(screen.getByAltText('Rome').getAttribute('aria-describedby')).toBe(caption.id);
  });

  it('wraps itself in a link when given one', () => {
    render(<AppImage src='/a.jpg' alt='Linked' linkTo='https://example.com' target='_blank' />);
    const link = screen.getByAltText('Linked').closest('a');
    expect(link.getAttribute('href')).toBe('https://example.com');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });
});

describe('ResponsiveImage', () => {
  const sets = {
    avifSet: '/x-400.avif 400w, /x-800.avif 800w',
    webpSet: '/x-400.webp 400w',
    jpgSet: '/x-400.jpg 400w',
    pick: (ext, width) => `/x-${width}.${ext}`,
  };

  it('builds its sources from the image set of the folder and name', () => {
    getImageSets.mockReturnValue(sets);
    const { container } = render(<ResponsiveImage folder='pages/home' name='hero' alt='Hero' sizes='100vw' />);
    expect(getImageSets).toHaveBeenCalledWith('hero', { dir: '/src/assets/images/pages/home' });
    const img = screen.getByAltText('Hero');
    // AVIF first for the <img>, then the JPEGs as its srcset
    expect(img.getAttribute('src')).toBe('/x-1200.avif');
    expect(img.getAttribute('srcset')).toBe(sets.jpgSet);
    const types = [...container.querySelectorAll('source')].map((s) => s.getAttribute('type'));
    expect(types).toEqual(['image/avif', 'image/webp']);
    expect(container.querySelector('[data-head-link]')).toBeNull();
  });

  it('preloads its AVIF set when it has priority', () => {
    getImageSets.mockReturnValue(sets);
    const { container } = render(<ResponsiveImage folder='f' name='n' alt='' priority />);
    const preload = container.querySelector('[data-head-link]');
    expect(preload.getAttribute('rel')).toBe('preload');
    expect(preload.getAttribute('type')).toBe('image/avif');
    expect(preload.getAttribute('imagesrcset')).toBe(sets.avifSet);
    expect(preload.getAttribute('imagesizes')).toBe('100vw');
  });

  it('looks nothing up without a folder and name', () => {
    getImageSets.mockClear();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<ResponsiveImage alt='Nothing' />);
    expect(getImageSets).not.toHaveBeenCalled();
    expect(screen.getByAltText('Nothing').getAttribute('src')).toBeNull();
  });
});
