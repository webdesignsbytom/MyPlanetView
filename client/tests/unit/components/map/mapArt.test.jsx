import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import SeaDepths from '@/components/map/SeaDepths';
import MonoPictureFilter from '@/components/map/MonoPictureFilter';
import Postmark from '@/components/map/Postmark';
import { MAP_BOTTOM, MAP_TOP, MAP_WIDTH } from '@/utils/map/projection';

// The map's small decorative pieces
describe('SeaDepths', () => {
  it('lays the depth tint over the whole map, pole line to pole line', () => {
    const { container } = render(
      <svg>
        <SeaDepths />
      </svg>,
    );
    const image = container.querySelector('image');
    expect(image.getAttribute('href')).toMatch(/sea-depths/);
    expect(Number(image.getAttribute('x'))).toBe(0);
    expect(Number(image.getAttribute('y'))).toBe(MAP_TOP);
    expect(Number(image.getAttribute('width'))).toBe(MAP_WIDTH);
    expect(Number(image.getAttribute('height'))).toBeCloseTo(MAP_BOTTOM - MAP_TOP);
    expect(image.getAttribute('preserveAspectRatio')).toBe('none');
    expect(image.getAttribute('aria-hidden')).toBe('true');
    expect(image.getAttribute('class')).toContain('pointer-events-none');
  });
});

describe('MonoPictureFilter', () => {
  it('defines the greyscale filter index.css names', () => {
    const { container } = render(<MonoPictureFilter />);
    const filter = container.querySelector('filter#mpv-mono-pictures');
    expect(filter).not.toBeNull();
    expect(filter.getAttribute('color-interpolation-filters')).toBe('sRGB');
    const matrix = filter.querySelector('feColorMatrix');
    expect(matrix.getAttribute('type')).toBe('saturate');
    expect(matrix.getAttribute('values')).toBe('0');
    expect(container.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
  });
});

describe('Postmark', () => {
  it('inks its words in a round double ring', () => {
    const { container } = render(<Postmark>Visited</Postmark>);
    const mark = container.querySelector('span');
    expect(mark.textContent).toBe('Visited');
    expect(mark.getAttribute('class')).toContain('rounded-full');
    expect(mark.getAttribute('class')).toContain('border-double');
  });
});
