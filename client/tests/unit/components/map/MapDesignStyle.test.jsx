// A map's design and its visited look as one style sheet (src/components/map/MapDesignStyle.jsx;
// 25 Nov 2026: the visited look is the map's, in every style, so it's drawn without a design too)
import React from 'react';
import { describe, expect, it } from 'vitest';
import { act, render } from '@testing-library/react';
import MapDesignStyle from '@/components/map/MapDesignStyle';
import { createValueStore } from '@/utils/map/valueStore';

const css = (container) => container.querySelector('style')?.textContent ?? null;

describe('MapDesignStyle', () => {
  it('draws the visited look with no design at all, as every style wears it', () => {
    const { container } = render(<MapDesignStyle design={null} visited={{ visitedLook: 'COLOUR', visitedColour: '#7c3aed' }} />);
    expect(css(container)).toContain('[data-map-page]{--map-visited:#7c3aed}');
    expect(css(container)).not.toContain('[data-map-design]');
  });

  it('puts the design’s rules first, then the visited look’s', () => {
    const { container } = render(<MapDesignStyle design={{ names: '#000000' }} visited={{ visitedLook: 'BOTH' }} />);
    const text = css(container);
    expect(text.indexOf('[data-map-design]{--map-names:#000000}')).toBe(0);
    expect(text).toContain('[data-map-page] svg [data-been="true"]');
  });

  it('draws nothing with neither', () => {
    expect(render(<MapDesignStyle design={null} visited={{ visitedLook: 'BADGE' }} />).container.innerHTML).toBe('');
  });

  it('follows Settings’ change to the visited look before it’s saved', () => {
    const visitedPreview = createValueStore(null);
    const { container } = render(<MapDesignStyle visited={{ visitedLook: 'BADGE' }} visitedPreview={visitedPreview} />);
    expect(css(container)).toBeNull();
    act(() => visitedPreview.set({ visitedLook: 'COLOUR', visitedFinish: 'GOLD' }));
    expect(css(container)).toContain('fill:var(--medal-gold)');
    act(() => visitedPreview.set(null));
    expect(css(container)).toBeNull();
  });
});
