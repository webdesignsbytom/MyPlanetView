import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import VerifyFirstNote from '@/components/map/VerifyFirstNote';
import LuggageTag from '@/components/map/LuggageTag';
import StatTile from '@/components/map/StatTile';
import UnplacedPhotosButton from '@/components/map/UnplacedPhotosButton';
import PanelEmptyState from '@/components/map/PanelEmptyState';
import PosterPlaceholder from '@/components/map/PosterPlaceholder';
import PosterImage from '@/components/map/PosterImage';
import MapBanner from '@/components/map/MapBanner';
import MapActionButton from '@/components/map/MapActionButton';
import MapKeyboardHint from '@/components/map/MapKeyboardHint';
import MapRoundButton from '@/components/map/MapRoundButton';
import MapZoomControls from '@/components/map/MapZoomControls';
import PressedStamp from '@/components/map/PressedStamp';
import { LOADING_STAMPS } from '@/components/common/passportStampArt';

// The map's small presentational pieces

describe('VerifyFirstNote', () => {
  it('finishes its sentence with the action', () => {
    const { container } = render(<VerifyFirstNote action='delete a map' />);
    expect(container.textContent).toBe('Verify your email address to delete a map. The link is in the email we sent you.');
  });

  it('says "make changes" by default', () => {
    expect(render(<VerifyFirstNote />).container.textContent).toContain('to make changes.');
  });
});

describe('LuggageTag', () => {
  it('is a div by default, passing on its props and class', () => {
    const { container } = render(
      <LuggageTag aria-label='Key' className='text-xs'>
        <span>Inside</span>
      </LuggageTag>,
    );
    const tag = container.firstChild;
    expect(tag.tagName).toBe('DIV');
    expect(tag.getAttribute('aria-label')).toBe('Key');
    expect(tag.getAttribute('class')).toContain('paper-aged');
    expect(tag.getAttribute('class')).toContain('text-xs');
    expect(tag.textContent).toBe('Inside');
  });

  it('takes another element with `as`', () => {
    const onClick = vi.fn();
    const { container } = render(
      <LuggageTag as='button' type='button' onClick={onClick}>
        Open
      </LuggageTag>,
    );
    fireEvent.click(container.querySelector('button'));
    expect(onClick).toHaveBeenCalled();
  });
});

describe('StatTile', () => {
  const tile = (props) => {
    const { container } = render(
      <dl>
        <StatTile label='Continents' {...props} />
      </dl>,
    );
    return container;
  };

  it('shows its label and number', () => {
    const c = tile({ value: 3 });
    expect(c.querySelector('dt').textContent).toBe('Continents');
    expect(c.querySelector('dd').textContent).toBe('3');
    expect(c.querySelector('dd').getAttribute('class')).toContain('text-3xl');
  });

  it('shows 0 for no value, then the unit, the most there can be and a note', () => {
    const c = tile({ value: null, unit: 'km', outOf: 7, note: 'About 0 miles' });
    const [value, note] = c.querySelectorAll('dd');
    expect(value.textContent).toBe('0 km of 7');
    expect(note.textContent).toBe('About 0 miles');
  });

  it('sets a word smaller than a number', () => {
    expect(tile({ value: 'New Zealand', compact: true }).querySelector('dd').getAttribute('class')).toContain('text-xl');
  });
});

describe('UnplacedPhotosButton', () => {
  it('shows nothing without photos', () => {
    expect(render(<UnplacedPhotosButton count={0} onOpen={() => {}} />).container.firstChild).toBeNull();
  });

  it('counts them in one string, with a plus when there are more', () => {
    const onOpen = vi.fn();
    render(<UnplacedPhotosButton count={30} more onOpen={onOpen} />);
    fireEvent.click(screen.getByText('Unplaced photos (30+)'));
    expect(onOpen).toHaveBeenCalled();
    render(<UnplacedPhotosButton count={2} onOpen={onOpen} />);
    expect(screen.getByText('Unplaced photos (2)')).toBeTruthy();
  });
});

describe('PanelEmptyState', () => {
  it('shows its title, text, steps and buttons over faint stamps', () => {
    const { container } = render(
      <PanelEmptyState icon={<i data-icon='' />} title='Nothing yet' text='Add a trip.' steps={[{ icon: <b />, text: 'Open Trips.' }]}>
        <button type='button'>Go</button>
      </PanelEmptyState>,
    );
    expect(container.querySelector('h3').textContent).toBe('Nothing yet');
    expect(screen.getByText('Add a trip.')).toBeTruthy();
    expect(container.querySelectorAll('ol li').length).toBe(1);
    expect(screen.getByText('Open Trips.')).toBeTruthy();
    expect(screen.getByText('Go')).toBeTruthy();
    expect(container.querySelector('[data-icon]').parentElement.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
  });

  it('leaves out the steps and buttons when there are none', () => {
    const { container } = render(<PanelEmptyState icon={null} title='T' text='X' />);
    expect(container.querySelector('ol')).toBeNull();
    expect(container.querySelector('button')).toBeNull();
  });
});

describe('PosterPlaceholder', () => {
  it('is an image named for its place, with the name on poster paper', () => {
    const { container } = render(<PosterPlaceholder countryName='Wales' />);
    const card = container.querySelector('[role="img"]');
    expect(card.getAttribute('aria-label')).toBe('Wales: travel poster coming soon');
    expect(screen.getByText('Wales').getAttribute('class')).toContain('text-4xl');
    expect(screen.getByText('Poster coming soon')).toBeTruthy();
  });

  it('steps the compact name down with its longest word', () => {
    const size = (name) => {
      const { container, unmount } = render(<PosterPlaceholder countryName={name} compact />);
      const cls = container.querySelector('[lang="en"]').getAttribute('class');
      unmount();
      return cls;
    };
    expect(size('North Pole')).toContain('text-sm');
    expect(size('Herzegovina')).toContain('text-xs');
    expect(size('Liechtenstein')).toContain('text-[0.625rem]');
  });
});

describe('PosterImage', () => {
  it('draws the poster as AVIF with a WebP fallback, at its own shape', () => {
    const { container } = render(<PosterImage poster={{ name: 'fr-paris', ratio: '1024/1536' }} alt='Paris' />);
    const img = container.querySelector('img');
    expect(img.getAttribute('src')).toMatch(/visitCountryPosters\/fr-paris-800\.webp$/);
    expect(img.getAttribute('alt')).toBe('Paris');
    expect(container.querySelector('source').getAttribute('srcset')).toMatch(/fr-paris-800\.avif$/);
    expect(container.querySelector('source').getAttribute('type')).toBe('image/avif');
  });
});

describe('MapBanner', () => {
  it('shows the map’s name alone between two stars', () => {
    const { container } = render(<MapBanner map={{ name: 'Charlie & Alex’s travels' }} />);
    const banner = container.querySelector('section');
    expect(banner.getAttribute('aria-label')).toBe('Map banner');
    expect(banner.querySelector('p').textContent).toBe('Charlie & Alex’s travels');
    expect([...banner.querySelectorAll('span[aria-hidden="true"]')].filter((s) => s.textContent === '★').length).toBe(2);
    expect(banner.querySelector('[data-supporter-badge]')).toBeNull();
  });

  // The supporter badge (24 Nov 2026, the user's wish): a paying member's plan under the band
  it('hangs a paying member’s badge under it: a link to the plans, in a new tab', () => {
    const { container } = render(<MapBanner map={{ name: 'Our travels' }} supporter={{ plan: 'PREMIUM', name: 'First Class', shown: true }} />);
    const badge = container.querySelector('section [data-supporter-badge]');
    expect(badge.getAttribute('data-supporter-badge')).toBe('PREMIUM');
    expect(badge.tagName).toBe('A');
    expect(badge.getAttribute('href')).toBe('/pricing');
    expect(badge.getAttribute('target')).toBe('_blank');
    expect(badge.getAttribute('rel')).toBe('noopener');
    expect(badge.getAttribute('aria-label')).toBe('First Class member. About our plans (opens in a new tab)');
    expect(badge.textContent).toContain('First Class member');
    // Cut from the First Class passport's cover
    expect(badge.getAttribute('class')).toContain('passport-first');
  });

  it('gives Business its own, cut from the navy cover', () => {
    const { container } = render(<MapBanner map={{ name: 'Our travels' }} supporter={{ plan: 'REGULAR', name: 'Business', shown: true }} />);
    const badge = container.querySelector('[data-supporter-badge]');
    expect(badge.textContent).toContain('Business member');
    expect(badge.getAttribute('class')).toContain('passport-business');
  });
});

describe('MapActionButton', () => {
  it('is a poster button that calls back', () => {
    const onClick = vi.fn();
    render(<MapActionButton onClick={onClick}>Save</MapActionButton>);
    const button = screen.getByText('Save');
    expect(button.getAttribute('type')).toBe('button');
    expect(button.getAttribute('class')).toContain('btn-poster');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalled();
  });

  it('is quiet, danger, a submit button, or busy and disabled', () => {
    render(<MapActionButton quiet>Q</MapActionButton>);
    render(<MapActionButton danger>D</MapActionButton>);
    render(<MapActionButton type='submit' busy>B</MapActionButton>);
    render(<MapActionButton disabled>X</MapActionButton>);
    expect(screen.getByText('Q').getAttribute('class')).toContain('btn-paper');
    expect(screen.getByText('D').getAttribute('class')).toContain('btn-danger');
    const busy = screen.getByText('B');
    expect(busy.getAttribute('type')).toBe('submit');
    expect(busy.disabled).toBe(true);
    expect(busy.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByText('X').disabled).toBe(true);
    expect(screen.getByText('X').hasAttribute('aria-busy')).toBe(false);
  });
});

describe('MapKeyboardHint', () => {
  it('is the map’s description, shown only for keyboard focus (no pointer press)', () => {
    const { container } = render(<MapKeyboardHint id='hint-1'>Use the arrow keys.</MapKeyboardHint>);
    const hint = container.querySelector('p');
    expect(hint.id).toBe('hint-1');
    expect(hint.textContent).toBe('Use the arrow keys.');
    expect(hint.getAttribute('class')).toContain('opacity-0');
    expect(hint.getAttribute('class')).toContain('peer-[:focus-visible:not([data-pointer-focus])]:opacity-100');
    expect(hint.getAttribute('class')).toContain('pointer-events-none');
  });
});

describe('MapRoundButton', () => {
  it('is named by its label, with the label as its title', () => {
    render(
      <MapRoundButton label='Zoom in' onClick={() => {}}>
        +
      </MapRoundButton>,
    );
    const button = screen.getByLabelText('Zoom in');
    expect(button.getAttribute('title')).toBe('Zoom in');
    expect(button.hasAttribute('aria-pressed')).toBe(false);
    expect(button.hasAttribute('aria-describedby')).toBe(false);
  });

  it('says whether its panel is open, and reads its description', () => {
    render(
      <MapRoundButton label='Stats' pressed description='8 countries' onClick={() => {}}>
        S
      </MapRoundButton>,
    );
    const button = screen.getByLabelText('Stats');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    const described = document.getElementById(button.getAttribute('aria-describedby'));
    expect(described.textContent).toBe('8 countries');
    expect(described.hidden).toBe(true);
    expect(button.getAttribute('class')).toContain('bg-poster-red-deep');
  });

  it('lets go of focus after a click, but keeps it for Enter or Space', () => {
    const onClick = vi.fn();
    render(
      <MapRoundButton label='Go' onClick={onClick}>
        G
      </MapRoundButton>,
    );
    const button = screen.getByLabelText('Go');
    button.focus();
    fireEvent.click(button, { detail: 0 });
    expect(document.activeElement).toBe(button);
    fireEvent.click(button, { detail: 1 });
    expect(document.activeElement).not.toBe(button);
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('runs onIntent on hover, focus and press', () => {
    const onIntent = vi.fn();
    render(
      <MapRoundButton label='Go' onIntent={onIntent} onClick={() => {}}>
        G
      </MapRoundButton>,
    );
    const button = screen.getByLabelText('Go');
    fireEvent.pointerEnter(button);
    fireEvent.focus(button);
    fireEvent.pointerDown(button);
    expect(onIntent.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('can be disabled', () => {
    render(
      <MapRoundButton label='Up' disabled onClick={() => {}}>
        U
      </MapRoundButton>,
    );
    expect(screen.getByLabelText('Up').disabled).toBe(true);
  });
});

describe('MapZoomControls', () => {
  const viewport = () => ({ zoomIn: vi.fn(), zoomOut: vi.fn(), reset: vi.fn() });

  it('zooms out, in, and shows the whole world, in that order', () => {
    const vp = viewport();
    const { container } = render(<MapZoomControls viewport={vp} />);
    expect(container.firstChild.getAttribute('role')).toBe('group');
    expect(container.firstChild.getAttribute('aria-label')).toBe('Zoom');
    expect([...container.querySelectorAll('button')].map((b) => b.getAttribute('aria-label'))).toEqual(['Zoom out', 'Zoom in', 'Show the whole world']);
    fireEvent.click(screen.getByLabelText('Zoom out'));
    fireEvent.click(screen.getByLabelText('Zoom in'));
    fireEvent.click(screen.getByLabelText('Show the whole world'));
    expect(vp.zoomOut).toHaveBeenCalled();
    expect(vp.zoomIn).toHaveBeenCalled();
    expect(vp.reset).toHaveBeenCalled();
  });

  it('shows a country instead on its own map', () => {
    const vp = viewport();
    const onReset = vi.fn();
    render(<MapZoomControls viewport={vp} resetLabel='Show all of France' onReset={onReset} />);
    fireEvent.click(screen.getByLabelText('Show all of France'));
    expect(onReset).toHaveBeenCalled();
    expect(vp.reset).not.toHaveBeenCalled();
  });
});

describe('PressedStamp', () => {
  it('draws its stamp where it landed, at its tilt and size, with its own arc', () => {
    const stamp = { key: 1, design: 0, left: 25, top: 40, rotate: 12, scale: 0.9 };
    const { container } = render(<PressedStamp stamp={stamp} arcId='arc-1' />);
    const svg = container.querySelector('svg');
    expect(svg.style.left).toBe('25%');
    expect(svg.style.top).toBe('40%');
    expect(svg.getAttribute('class')).toContain('motion-safe:animate-stamp-in');
    expect(container.querySelector('path#arc-1')).not.toBeNull();
    expect(container.querySelector('g[transform="scale(0.9)"]')).not.toBeNull();
    expect(LOADING_STAMPS.length).toBeGreaterThan(0);
  });
});
