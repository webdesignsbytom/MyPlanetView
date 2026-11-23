import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import MapStrings from '@/components/map/MapStrings';
import { pinOf } from '@/utils/map/mapStrings';

const STRINGS = [
  { id: 's1', from: 'FR', to: 'JP' },
  { id: 's2', from: 'FR', to: 'IT' },
  { id: 's3', from: 'AQ', to: 'AR' },
];

const draw = (props = {}) =>
  render(
    <svg>
      <MapStrings strings={STRINGS} {...props} />
    </svg>,
  ).container;

describe('MapStrings', () => {
  it('draws each string as thread between two pins, out of the way of presses', () => {
    const svg = draw();
    const layer = svg.querySelector('[data-map-strings]');
    expect(layer.getAttribute('class')).toContain('pointer-events-none');
    expect([...svg.querySelectorAll('[data-string]')].map((g) => g.getAttribute('data-string'))).toEqual(['FR-JP', 'FR-IT', 'AQ-AR']);
    const thread = svg.querySelector('[data-string="FR-JP"] path');
    expect(thread.getAttribute('class')).toContain('stroke-map-string');
    expect(thread.getAttribute('fill')).toBe('none');
    const { x, y } = pinOf('FR');
    expect(thread.getAttribute('d').startsWith(`M${Math.round(x * 10) / 10} ${Math.round(y * 10) / 10}Q`)).toBe(true);
    // No press lines outside string mode
    expect(svg.querySelector('[data-string-press]')).toBeNull();
  });

  it('pins each end once, a head over a rim', () => {
    const heads = [...draw().querySelectorAll('[data-map-strings] > path')];
    expect(heads).toHaveLength(2);
    // FR, JP, IT, AQ, AR: five pins, each a zero-length round-capped stroke
    expect(heads[1].getAttribute('d').match(/h0/g)).toHaveLength(5);
    expect(heads[0].getAttribute('class')).toContain('stroke-map-edge');
    expect(heads[1].getAttribute('class')).toContain('stroke-map-string');
  });

  it('leaves out the far south while Antarctica is hidden', () => {
    const svg = draw({ showAntarctica: false });
    expect(svg.querySelector('[data-string="AQ-AR"]')).toBeNull();
    expect(svg.querySelectorAll('[data-string]')).toHaveLength(2);
  });

  it('in string mode, takes a string off when it’s pressed, through afterTap', () => {
    const onRemove = vi.fn();
    const afterTap = vi.fn((action) => action());
    const svg = draw({ onRemove, afterTap });
    const press = svg.querySelector('[data-string="FR-IT"] [data-string-press]');
    expect(press.querySelector('title').textContent).toBe('Take off the string from France to Italy');
    expect(press.getAttribute('class')).toContain('pointer-events-auto');
    fireEvent.click(press);
    expect(afterTap).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ id: 's2', from: 'FR', to: 'IT' }));
  });

  it('marks the place chosen first, even before any string', () => {
    const svg = render(
      <svg>
        <MapStrings strings={[]} startCode='BR' />
      </svg>,
    ).container;
    const start = svg.querySelector('[data-string-start]');
    expect(start.getAttribute('data-string-start')).toBe('BR');
    const { x, y } = pinOf('BR');
    expect(start.getAttribute('d')).toBe(`M${x} ${y}h0`);
  });

  it('draws nothing with no strings and no start', () => {
    const svg = render(
      <svg>
        <MapStrings strings={[]} />
      </svg>,
    ).container;
    expect(svg.querySelector('[data-map-strings]')).toBeNull();
  });
});
