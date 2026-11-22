import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import MomentMarks from '@/components/map/MomentMarks';
import { MomentMarkIcon, MomentMarkSymbol } from '@/components/map/MomentMark';
import { MOMENT_MARK_ID, momentMarkPlace } from '@/utils/map/badges';
import { COUNTRY_BY_CODE } from '@/utils/map/countries';

const draw = (props) => {
  const { container } = render(
    <svg>
      <MomentMarks zoom={1} {...props} />
    </svg>,
  );
  return container.querySelector('g');
};
const marked = (group) => [...group.querySelectorAll('[data-moment-mark]')].map((use) => use.getAttribute('data-moment-mark'));

describe('MomentMark', () => {
  it('defines the pinned note once as a symbol', () => {
    const { container } = render(
      <svg>
        <MomentMarkSymbol />
      </svg>,
    );
    const symbol = container.querySelector(`symbol#${MOMENT_MARK_ID}`);
    expect(symbol).not.toBeNull();
    // The paper, three lines of ink and the pin
    expect(symbol.querySelectorAll('line').length).toBe(3);
    expect(symbol.querySelector('circle').getAttribute('class')).toContain('fill-poster-red');
  });

  it('draws the same note in HTML for the key, hidden from screen readers', () => {
    const { container } = render(<MomentMarkIcon className='h-3 w-3' />);
    const svg = container.querySelector('svg');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('class')).toBe('h-3 w-3');
    expect(svg.querySelectorAll('line').length).toBe(3);
  });
});

describe('MomentMarks', () => {
  it('marks every place with moments, beside its badge', () => {
    const group = draw({ counts: { FR: 2, JP: 1 } });
    expect(marked(group).sort()).toEqual(['FR', 'JP']);
    const fr = COUNTRY_BY_CODE.FR;
    const place = momentMarkPlace(fr.pinX, fr.pinY, 1);
    const use = group.querySelector('[data-moment-mark="FR"]');
    expect(use.getAttribute('href')).toBe(`#${MOMENT_MARK_ID}`);
    expect(Number(use.getAttribute('x'))).toBeCloseTo(place.x);
    expect(Number(use.getAttribute('y'))).toBeCloseTo(place.y);
    expect(Number(use.getAttribute('height'))).toBeCloseTo(place.height);
  });

  it('never takes a click', () => {
    const group = draw({ counts: { FR: 1 } });
    expect(group.getAttribute('class')).toContain('pointer-events-none');
    expect(group.getAttribute('aria-hidden')).toBe('true');
  });

  it('skips zero counts and unknown codes', () => {
    expect(marked(draw({ counts: { FR: 0, ZZ: 3, PE: 1 } }))).toEqual(['PE']);
  });

  it('drops Antarctica’s places while it is hidden', () => {
    expect(marked(draw({ counts: { AQ: 1, FR: 1 }, showAntarctica: false }))).toEqual(['FR']);
    expect(marked(draw({ counts: { AQ: 1, FR: 1 } })).length).toBe(2);
  });

  it('gets smaller as the map zooms in', () => {
    const near = draw({ counts: { FR: 1 }, zoom: 16 }).querySelector('use');
    expect(Number(near.getAttribute('height'))).toBeCloseTo(momentMarkPlace(0, 0, 16).height);
  });
});
