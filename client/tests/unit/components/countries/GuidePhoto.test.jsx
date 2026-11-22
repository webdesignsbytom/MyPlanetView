import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import GuidePhoto from '@/components/countries/GuidePhoto';

const photo = (overrides = {}) => ({
  avif: '/media/landmarkPhotos/tower-480.avif',
  webp: '/media/landmarkPhotos/tower-480.webp',
  width: 480,
  height: 360,
  author: 'Jane Doe',
  licence: 'CC BY-SA 4.0',
  licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
  source: 'https://commons.wikimedia.org/wiki/File:Tower.jpg',
  ...overrides,
});

describe('GuidePhoto', () => {
  it('draws the photo as AVIF with a WebP fallback, lazily, at its own size, sending no referrer', () => {
    const { container } = render(<GuidePhoto photo={photo()} />);
    expect(container.querySelector('source').getAttribute('type')).toBe('image/avif');
    expect(container.querySelector('source').getAttribute('srcset')).toBe('/media/landmarkPhotos/tower-480.avif');
    const img = container.querySelector('img');
    expect(img.getAttribute('src')).toBe('/media/landmarkPhotos/tower-480.webp');
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('width')).toBe('480');
    expect(img.getAttribute('height')).toBe('360');
    expect(img.getAttribute('loading')).toBe('lazy');
    expect(img.getAttribute('referrerpolicy')).toBe('no-referrer');
  });

  it('loads at once when eager, and takes its alt text, frame and tilt', () => {
    const { container } = render(<GuidePhoto photo={photo()} alt='The tower at dusk' eager frameClass='aspect-[16/9]' tilt='rotate-1' />);
    const img = screen.getByAltText('The tower at dusk');
    expect(img.getAttribute('loading')).toBe('eager');
    const frame = container.querySelector('figure > div');
    expect(frame.className).toContain('aspect-[16/9]');
    expect(frame.className).toContain('rotate-1');
  });

  it('credits the author, linked to the Commons page, and the licence, linked to its text', () => {
    const { container } = render(<GuidePhoto photo={photo()} />);
    const caption = container.querySelector('figcaption');
    expect(caption.textContent).toBe('Photo: Jane Doe, CC BY-SA 4.0');
    const [author, licence] = caption.querySelectorAll('a');
    expect(author.getAttribute('href')).toBe('https://commons.wikimedia.org/wiki/File:Tower.jpg');
    expect(author.getAttribute('target')).toBe('_blank');
    expect(author.getAttribute('rel')).toBe('noopener noreferrer');
    expect(licence.getAttribute('href')).toBe('https://creativecommons.org/licenses/by-sa/4.0');
    expect(licence.getAttribute('rel')).toBe('noopener noreferrer license');
  });

  it('names a licence with no link as plain words, and leaves it out when there is none', () => {
    const { container, rerender } = render(<GuidePhoto photo={photo({ licence: 'Public domain', licenceUrl: null })} />);
    expect(container.querySelector('figcaption').textContent).toBe('Photo: Jane Doe, Public domain');
    expect(container.querySelectorAll('figcaption a').length).toBe(1);
    rerender(<GuidePhoto photo={photo({ licence: '', licenceUrl: null })} />);
    expect(container.querySelector('figcaption').textContent).toBe('Photo: Jane Doe');
  });

  it('puts a caption above the credit', () => {
    const { container } = render(<GuidePhoto photo={photo()} caption='Eiffel Tower' />);
    const parts = container.querySelector('figcaption').children;
    expect(parts[0].textContent).toBe('Eiffel Tower');
    expect(parts[1].textContent).toContain('Photo: Jane Doe');
  });
});
