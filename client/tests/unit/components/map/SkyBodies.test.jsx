import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import SkyBodies from '@/components/map/SkyBodies';
import { REFERENCE_PX_PER_UNIT, projectToMap } from '@/utils/map/projection';
import { sunAndMoonAt } from '@/utils/map/skyPositions';

const draw = (zoom = 1) => {
  const result = render(
    <svg>
      <SkyBodies zoom={zoom} />
    </svg>,
  );
  const sun = result.container.querySelector('[data-sky-body="sun"]');
  const moon = result.container.querySelector('[data-sky-body="moon"]');
  return { ...result, sun, moon };
};

describe('SkyBodies', () => {
  afterEach(() => vi.useRealTimers());

  it('puts the sun and the moon over where each is overhead now', () => {
    vi.useFakeTimers();
    const now = new Date('2026-06-21T12:00:00Z');
    vi.setSystemTime(now);
    const { sun, moon, container } = draw();
    const sky = sunAndMoonAt(now);
    const sunAt = projectToMap(sky.sun.latitude, sky.sun.longitude);
    const moonAt = projectToMap(sky.moon.latitude, sky.moon.longitude);
    expect(Number(sun.getAttribute('cx'))).toBeCloseTo(sunAt.x);
    expect(Number(sun.getAttribute('cy'))).toBeCloseTo(sunAt.y);
    expect(Number(moon.getAttribute('cx'))).toBeCloseTo(moonAt.x);
    // Each wears its own glow
    expect(sun.getAttribute('fill')).toMatch(/^url\(#.+-sun\)$/);
    expect(moon.getAttribute('fill')).toMatch(/^url\(#.+-moon\)$/);
    expect(container.querySelectorAll('radialGradient').length).toBe(2);
    expect(container.querySelector('g').getAttribute('aria-hidden')).toBe('true');
  });

  it('stays the same size on screen at any zoom', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-21T12:00:00Z'));
    const { sun } = draw(1);
    expect(Number(sun.getAttribute('r'))).toBeCloseTo(34 / REFERENCE_PX_PER_UNIT);
    const { moon } = draw(4);
    expect(Number(moon.getAttribute('r'))).toBeCloseTo(20 / (4 * REFERENCE_PX_PER_UNIT));
  });

  it('moves once a minute', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-21T12:00:00Z'));
    const { sun } = draw();
    const before = sun.getAttribute('cx');
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(sun.getAttribute('cx')).not.toBe(before);
  });
});
