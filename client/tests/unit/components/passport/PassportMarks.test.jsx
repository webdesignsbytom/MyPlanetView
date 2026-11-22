import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import PassportChipMark from '@/components/passport/PassportChipMark';
import UnescoMark from '@/components/passport/UnescoMark';
import StampOutline from '@/components/passport/StampOutline';
import PassportCrest from '@/components/passport/PassportCrest';
import { STAMP_SHAPES, stampLook } from '@/utils/passport/passportBook';
import { STAMP_GEOMETRY } from '@/utils/passport/stampShapes';

// A landmark id whose stamp has the given shape (the look is hashed from the id)
const idWithShape = (shape) => {
  for (let i = 0; i < 500; i++) if (stampLook(`lm-${i}`).shape === shape) return `lm-${i}`;
  throw new Error(`No id found for ${shape}`);
};

describe('PassportChipMark', () => {
  it('is a decorative frame with a circle between two lines, in the text colour', () => {
    const { container } = render(<PassportChipMark className='w-10' />);
    const svg = container.querySelector('svg');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
    expect(svg.getAttribute('stroke')).toBe('currentColor');
    expect(svg.getAttribute('class')).toBe('w-10');
    expect(svg.querySelectorAll('rect').length).toBe(1);
    expect(svg.querySelectorAll('circle').length).toBe(1);
    expect(svg.querySelector('path').getAttribute('d')).toBe('M2.5 14H57.5M2.5 26H57.5');
  });
});

describe('UnescoMark', () => {
  it('draws the temple centred on x, y in the stamp’s ink', () => {
    const { container } = render(
      <svg>
        <UnescoMark x={100} y={152} />
      </svg>,
    );
    const g = container.querySelector('g');
    // The pictogram is 14 wide and 12 tall, so its corner is 7 left and 6 up
    expect(g.getAttribute('transform')).toBe('translate(93 146)');
    expect(g.getAttribute('fill')).toBe('currentColor');
    // A roof, a lintel, three columns and a step
    expect(g.querySelectorAll('path').length).toBe(1);
    expect(g.querySelectorAll('rect').length).toBe(5);
  });
});

describe('StampOutline', () => {
  it.each(STAMP_SHAPES)('draws a %s stamp still to collect as the stamp’s own shape, dotted and tilted', (shape) => {
    const id = idWithShape(shape);
    const { tilt } = stampLook(id);
    const { width, height, outer } = STAMP_GEOMETRY[shape];
    const { container } = render(<StampOutline landmarkId={id} />);
    const svg = container.querySelector('svg');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('viewBox')).toBe(`-6 -6 ${width + 12} ${height + 12}`);
    expect(svg.style.transform).toBe(`rotate(${tilt}deg)`);
    const drawn = svg.firstElementChild;
    expect(drawn.tagName).toBe(outer.tag);
    expect(drawn.getAttribute('fill')).toBe('none');
    expect(drawn.getAttribute('stroke')).toBe('currentColor');
    expect(drawn.getAttribute('stroke-dasharray')).toBe('2 22');
  });

  it('always draws the same landmark the same way', () => {
    const first = render(<StampOutline landmarkId='lm-7' />).container.innerHTML;
    const second = render(<StampOutline landmarkId='lm-7' />).container.innerHTML;
    expect(second).toBe(first);
  });
});

describe('PassportCrest', () => {
  it('is decoration only', () => {
    const { container } = render(<PassportCrest className='w-40' />);
    const svg = container.querySelector('svg');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('viewBox')).toBe('0 0 240 240');
    expect(svg.getAttribute('class')).toBe('w-40');
  });

  it('fills the crest with its own foil gradient and raises it with its own lighting filter', () => {
    const { container } = render(<PassportCrest />);
    const gradient = container.querySelector('linearGradient');
    const filter = container.querySelector('filter');
    const crest = container.querySelector('g[filter]');
    expect(crest.getAttribute('fill')).toBe(`url(#${gradient.id})`);
    expect(crest.getAttribute('stroke')).toBe(`url(#${gradient.id})`);
    expect(crest.getAttribute('filter')).toBe(`url(#${filter.id})`);
    expect(filter.querySelector('feSpecularLighting')).not.toBeNull();
    // The ids are usable in url(#…): letters, digits, dashes and underscores only
    expect(gradient.id).toMatch(/^[a-zA-Z0-9_-]+$/);
  });

  it('gives two crests on one page different ids', () => {
    const { container } = render(
      <>
        <PassportCrest />
        <PassportCrest />
      </>,
    );
    const ids = [...container.querySelectorAll('linearGradient')].map((g) => g.id);
    expect(ids.length).toBe(2);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it('draws a wreath of two mirrored branches, a globe, the compass rose and a star', () => {
    const { container } = render(<PassportCrest />);
    const branches = container.querySelectorAll('g[filter] > g:not([fill="none"]):not([stroke-width])');
    expect(branches.length).toBe(2);
    expect(branches[1].getAttribute('transform')).toBe('translate(240 0) scale(-1 1)');
    // Eleven pairs of leaves on each branch
    expect(container.querySelectorAll('ellipse[rx="9"]').length).toBe(44);
    // The globe: its rim and two meridian ellipses
    expect(container.querySelector('circle[r="54"]')).not.toBeNull();
    expect(container.querySelectorAll('ellipse[ry="54"]').length).toBe(2);
    // Eight points, each two triangles
    const rose = container.querySelector('g[stroke-width="1.4"]');
    expect(rose.querySelectorAll(':scope > g').length).toBe(8);
    expect(rose.querySelectorAll(':scope > g > path').length).toBe(16);
    // The star: ten corners
    const star = container.querySelector('g[filter] > path[stroke="none"]');
    expect(star.getAttribute('d').split('L').length).toBe(10);
  });
});
