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
    const heads = [...draw().querySelectorAll('[data-string-pins] > path')];
    expect(heads).toHaveLength(2);
    // FR, JP, IT, AQ, AR: five pins, each a zero-length round-capped stroke
    expect(heads[1].getAttribute('d').match(/h0/g)).toHaveLength(5);
    expect(heads[0].getAttribute('class')).toContain('stroke-map-edge');
    expect(heads[1].getAttribute('class')).toContain('stroke-map-string');
  });

  // Two colours twisted together, as baker's twine (25 Nov 2026, the user's wish): the
  // strands are always there, shown only by a design's tokens (mapDesign.js stringVars)
  it('lays four strands of the second colour along each string, hidden unless a design twists one in', () => {
    const svg = draw({ zoom: 2 });
    const string = svg.querySelector('[data-string="FR-IT"]');
    expect(string.getAttribute('class')).toContain('[opacity:var(--map-string-alpha,1)]');
    const thread = string.querySelector('path');
    expect(thread.getAttribute('class')).toContain('[stroke-width:var(--map-string-width,1.8px)]');
    const strands = [...string.querySelectorAll('[data-string-strand]')];
    expect(strands).toHaveLength(4);
    for (const strand of strands) {
      expect(strand.getAttribute('d')).toBe(thread.getAttribute('d'));
      expect(strand.getAttribute('class')).toContain('stroke-map-string-2');
      expect(strand.getAttribute('class')).toContain('[display:var(--map-string-twist,none)]');
      expect(strand.getAttribute('stroke-dasharray')).toBe('3 3');
    }
    // Side by side across the string, each a little further along than the one before
    expect(strands.map((s) => Number(s.getAttribute('stroke-dashoffset')))).toEqual([-1.215, -0.405, 0.405, 1.215]);
    expect(strands[0].getAttribute('transform')).not.toBe(strands[3].getAttribute('transform'));
    // Pins wear the strings' opacity too
    expect(svg.querySelector('[data-string-pins]').getAttribute('class')).toContain('[opacity:var(--map-string-alpha,1)]');
  });

  it('keeps the strands the same few pixels apart at any zoom', () => {
    const across = (zoom) => {
      const svg = draw({ zoom });
      const [first, , , last] = svg.querySelectorAll('[data-string="FR-IT"] [data-string-strand]');
      const move = (el) => el.getAttribute('transform').match(/-?[\d.]+/g).map(Number);
      const [x1, y1] = move(first);
      const [x2, y2] = move(last);
      return Math.hypot(x2 - x1, y2 - y1);
    };
    // Twice the zoom, half the map units: the same 3 pixels on screen
    expect(across(4)).toBeCloseTo(across(2) / 2, 3);
  });

  // Planned strings (25 Nov 2026, the user's wish): their own colours, under the visited ones
  it('draws the planned strings in their own colours, under the visited ones, with their own pins', () => {
    const svg = render(
      <svg>
        <MapStrings strings={[...STRINGS, { id: 'p1', kind: 'PLANNED', from: 'IS', to: 'JP' }]} />
      </svg>,
    ).container;
    const groups = [...svg.querySelectorAll('[data-string]')];
    expect(groups.map((g) => g.getAttribute('data-string-kind'))).toEqual(['PLANNED', 'VISITED', 'VISITED', 'VISITED']);
    const planned = groups[0];
    expect(planned.getAttribute('data-string')).toBe('IS-JP');
    expect(planned.getAttribute('class')).toContain('[opacity:var(--map-plan-string-alpha,1)]');
    expect(planned.querySelector('path').getAttribute('class')).toContain('stroke-map-plan-string');
    expect(planned.querySelector('[data-string-strand]').getAttribute('class')).toContain('stroke-map-plan-string-2 [display:var(--map-plan-string-twist,none)]');
    // Each kind's pins in its colour, the planned first
    expect([...svg.querySelectorAll('[data-string-pins]')].map((g) => g.getAttribute('data-string-pins'))).toEqual(['PLANNED', 'VISITED']);
    expect(svg.querySelector('[data-string-pins="PLANNED"] path:last-child').getAttribute('class')).toContain('stroke-map-plan-string');
  });

  it('in string mode, lets only the strings of the kind being tied be taken off', () => {
    const svg = render(
      <svg>
        <MapStrings strings={[...STRINGS, { id: 'p1', kind: 'PLANNED', from: 'IS', to: 'JP' }]} onRemove={vi.fn()} removeKind='PLANNED' startCode='BR' startKind='PLANNED' />
      </svg>,
    ).container;
    expect([...svg.querySelectorAll('[data-string-press]')].map((p) => p.closest('[data-string]').getAttribute('data-string'))).toEqual(['IS-JP']);
    expect(svg.querySelector('[data-string-start]').getAttribute('class')).toContain('stroke-map-plan-string');
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
