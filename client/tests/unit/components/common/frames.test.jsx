import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PosterFrame from '@/components/common/PosterFrame';
import BrassCorner from '@/components/common/BrassCorner';
import BrassCorners from '@/components/common/BrassCorners';
import AppPageShell from '@/components/common/AppPageShell';
import PublicPageLayout from '@/components/common/PublicPageLayout';
import BrandWordmark from '@/components/common/BrandWordmark';
import StampBackdrop from '@/components/common/StampBackdrop';
import { LOADING_STAMPS, PASSPORT_STAMPS, drawStamp, INK } from '@/components/common/passportStampArt';

// The nav and footer have their own tests: here they're stand-ins
vi.mock('@/components/nav/Navbar', () => ({ default: ({ variant }) => <nav data-test-nav={variant}>Nav</nav> }));
vi.mock('@/components/footer/FooterComponent', () => ({ default: () => <footer data-test-footer>Footer</footer> }));

describe('BrassCorner and BrassCorners', () => {
  it('draws a decorative corner in its place, with ids of its own', () => {
    const { container } = render(
      <svg>
        <BrassCorner position='br' />
        <BrassCorner />
      </svg>,
    );
    const [br, tl] = container.querySelectorAll('svg svg');
    expect(br.getAttribute('aria-hidden')).toBe('true');
    expect(br.getAttribute('class')).toContain('rotate-180');
    expect(tl.getAttribute('class')).toContain('left-0 top-0');
    expect(br.querySelectorAll('circle').length).toBe(3);
    const ids = [...container.querySelectorAll('linearGradient')].map((g) => g.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('puts one in each corner', () => {
    const { container } = render(
      <div>
        <BrassCorners />
      </div>,
    );
    const classes = [...container.querySelectorAll('svg')].map((svg) => svg.getAttribute('class'));
    expect(classes.length).toBe(4);
    expect(classes.some((c) => c.includes('-rotate-90'))).toBe(true);
    expect(classes.some((c) => c.includes(' rotate-90'))).toBe(true);
  });
});

describe('PosterFrame', () => {
  it('holds the nav and content in the red frame, with corners for both layouts', () => {
    const { container } = render(
      <PosterFrame nav={<nav data-mine>Nav</nav>}>
        <p>Content</p>
      </PosterFrame>,
    );
    const frame = container.firstChild;
    expect(frame.className).toContain('bg-poster-red');
    expect(frame.className).toContain('isolate');
    expect(frame.querySelector('[data-mine]')).toBeTruthy();
    expect(screen.getByText('Content')).toBeTruthy();
    expect(frame.querySelectorAll('svg').length).toBe(8);
  });

  it('draws a backdrop under everything else only when given one', () => {
    const { container, rerender } = render(<PosterFrame backdrop={<span data-backdrop />}>x</PosterFrame>);
    const layer = container.querySelector('[data-backdrop]').parentElement;
    expect(layer.className).toContain('-z-10');
    expect(layer.className).toContain('pointer-events-none');
    rerender(<PosterFrame>x</PosterFrame>);
    expect(container.querySelector('.-z-10')).toBeNull();
  });
});

describe('AppPageShell', () => {
  it('has exactly one main, #main-content, focusable from code, with the page’s props', () => {
    render(
      <AppPageShell width='max-w-3xl' mainProps={{ 'aria-labelledby': 'heading', 'aria-busy': 'true' }} backdrop={<span data-backdrop />}>
        <h1 id='heading'>Account</h1>
      </AppPageShell>,
    );
    const mains = document.querySelectorAll('main');
    expect(mains.length).toBe(1);
    expect(mains[0].id).toBe('main-content');
    expect(mains[0].getAttribute('tabindex')).toBe('-1');
    expect(mains[0].getAttribute('aria-labelledby')).toBe('heading');
    expect(mains[0].getAttribute('aria-busy')).toBe('true');
    expect(screen.getByText('Account').parentElement.className).toContain('max-w-3xl');
    expect(document.querySelector('[data-test-nav]').getAttribute('data-test-nav')).toBe('column');
    expect(document.querySelector('[data-test-footer]')).toBeTruthy();
    expect(document.querySelector('[data-backdrop]')).toBeTruthy();
  });
});

describe('PublicPageLayout', () => {
  it('has one main and the footer, which a page can leave out', () => {
    const { rerender } = render(
      <PublicPageLayout mainProps={{ 'aria-labelledby': 'h' }}>
        <h1 id='h'>About</h1>
      </PublicPageLayout>,
    );
    expect(document.querySelectorAll('main').length).toBe(1);
    const main = document.getElementById('main-content');
    expect(main.getAttribute('tabindex')).toBe('-1');
    expect(main.getAttribute('aria-labelledby')).toBe('h');
    expect(document.querySelector('[data-test-footer]')).toBeTruthy();
    rerender(
      <PublicPageLayout footer={false}>
        <h1>About</h1>
      </PublicPageLayout>,
    );
    expect(document.querySelector('[data-test-footer]')).toBeNull();
  });
});

describe('BrandWordmark', () => {
  it('is a decorative picture with AVIF and WebP at the size asked for', () => {
    const { container, rerender } = render(<BrandWordmark />);
    const img = container.querySelector('img');
    expect(img.getAttribute('alt')).toBe('');
    expect(container.querySelector('picture').className).toContain('w-28');
    const types = [...container.querySelectorAll('source')].map((s) => s.getAttribute('type'));
    expect(types).toEqual(['image/avif', 'image/webp']);
    expect(container.querySelector('source').getAttribute('sizes')).toBe('7rem');
    rerender(<BrandWordmark size='lg' />);
    expect(container.querySelector('picture').className).toContain('w-48');
    expect(container.querySelector('source').getAttribute('sizes')).toBe('12rem');
  });
});

describe('StampBackdrop and the stamp art', () => {
  it('repeats the passport stamps as two decorative pattern layers', () => {
    const { container } = render(<StampBackdrop />);
    const svg = container.querySelector('svg');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    const patterns = svg.querySelectorAll('pattern');
    expect(patterns.length).toBe(2);
    expect(patterns[1].getAttribute('patternTransform')).toContain('rotate(-9)');
    const rects = svg.querySelectorAll(':scope > rect');
    expect(rects[0].getAttribute('fill')).toBe(`url(#${patterns[1].id})`);
    expect(rects[0].getAttribute('opacity')).toBe('0.45');
    expect(rects[1].getAttribute('fill')).toBe(`url(#${patterns[0].id})`);
    // one group per stamp on the tile
    const stamps = svg.querySelector('defs > g');
    expect(stamps.children.length).toBe(PASSPORT_STAMPS.length);
    expect(svg.textContent).toContain('TOKYO');
  });

  it('places and inks each stamp, with a fade and ink of its own when asked', () => {
    const stamp = PASSPORT_STAMPS[0];
    const { container, rerender } = render(<svg>{drawStamp(stamp, 'arc')}</svg>);
    const g = container.querySelector('svg > g');
    expect(g.getAttribute('transform')).toBe(`translate(${stamp.x} ${stamp.y}) rotate(${stamp.rotate})`);
    expect(g.getAttribute('class')).toBe(INK[stamp.ink].fade);
    rerender(<svg>{drawStamp(stamp, 'arc', 'opacity-10', 'deep')}</svg>);
    const faded = container.querySelector('svg > g');
    expect(faded.getAttribute('class')).toBe('opacity-10');
    expect(faded.innerHTML).toContain('stroke-poster-red-deep');
  });

  it('draws every loading stamp’s shape, each country once, in the four inks in turn', () => {
    const countries = LOADING_STAMPS.map((s) => s.country).filter(Boolean);
    expect(new Set(countries).size).toBe(countries.length);
    const { container } = render(<svg>{LOADING_STAMPS.map((s, i) => <React.Fragment key={i}>{drawStamp({ x: 0, y: 0, rotate: 0, ...s }, 'arc')}</React.Fragment>)}</svg>);
    expect(container.querySelectorAll('svg > g').length).toBe(LOADING_STAMPS.length);
    expect(LOADING_STAMPS.every((s) => INK[s.loadingInk])).toBe(true);
    // San Francisco keeps its green
    expect(LOADING_STAMPS.find((s) => s.place === 'SAN FRANCISCO').loadingInk).toBe('green');
  });
});
