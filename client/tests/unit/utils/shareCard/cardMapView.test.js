// @vitest-environment node
// Where a share card's map looks close up (src/utils/shareCard/cardMapView.js; 24 Nov 2026, the
// user's wish: a one-country trip on that country's own map, not a speck on the world).
import { describe, expect, it } from 'vitest';
import { MAP_WIDTH, WORLD_VIEW, cardMapKind, cardMapView, placeBox } from '@/utils/shareCard/cardMapView';
import { DETAIL_SHAPE_BOUNDS } from '@/utils/map/detailShapeBounds';

const inside = (inner, [x, y, w, h]) => inner[0] >= x && inner[1] >= y && inner[2] <= x + w && inner[3] <= y + h;

describe('placeBox', () => {
  it('takes a place’s biggest stretch of land: metropolitan France, not its islands', () => {
    const france = placeBox('FR');
    expect(DETAIL_SHAPE_BOUNDS.FR.length).toBeGreaterThan(1);
    expect(france).toEqual(DETAIL_SHAPE_BOUNDS.FR.reduce((a, b) => ((b[2] - b[0]) * (b[3] - b[1]) > (a[2] - a[0]) * (a[3] - a[1]) ? b : a)));
    expect(france[2] - france[0]).toBeLessThan(100);
  });

  it('gives a micro-state drawn as a dot a small box round its pin, and nothing for no place', () => {
    const monaco = placeBox('MC');
    expect(monaco[2] - monaco[0]).toBeLessThanOrEqual(12);
    expect(placeBox('ZZ')).toBeNull();
  });
});

describe('cardMapView', () => {
  it('puts one country on its own map', () => {
    expect(cardMapView(['IT'])).toEqual({ kind: 'country', code: 'IT' });
    expect(cardMapView(['IT', 'IT'])).toEqual({ kind: 'country', code: 'IT' });
  });

  it('counts a region as its country, and gives a UK nation its own map', () => {
    expect(cardMapView(['XB'])).toEqual({ kind: 'country', code: 'ID' });
    expect(cardMapView(['ID', 'XB'])).toEqual({ kind: 'country', code: 'ID' });
    expect(cardMapView(['XE'])).toEqual({ kind: 'country', code: 'XE' });
  });

  it('crops the world round neighbours, with room round them', () => {
    const view = cardMapView(['ES', 'PT']);
    expect(view.kind).toBe('crop');
    expect(inside(placeBox('ES'), view.view)).toBe(true);
    expect(inside(placeBox('PT'), view.view)).toBe(true);
    expect(view.view[2]).toBeLessThan(MAP_WIDTH * 0.2);
  });

  it('never crops closer than a few countries’ span', () => {
    const view = cardMapView(['BE', 'LU']);
    expect(view.kind).toBe('crop');
    expect(view.view[2]).toBeGreaterThanOrEqual(140);
    expect(view.view[3]).toBeGreaterThanOrEqual(90);
  });

  it('zooms out to take in places on two continents near each other: Spain and Mexico', () => {
    const view = cardMapView(['ES', 'MX']);
    expect(view.kind).toBe('crop');
    expect(inside(placeBox('ES'), view.view) && inside(placeBox('MX'), view.view)).toBe(true);
    expect(view.view[2]).toBeGreaterThan(MAP_WIDTH * 0.3);
  });

  it('keeps the whole world for places far apart, Antarctica or a pole, or nothing', () => {
    expect(cardMapView(['US', 'JP'])).toBe(WORLD_VIEW);
    expect(cardMapView(['AR', 'AQ'])).toBe(WORLD_VIEW);
    expect(cardMapView(['XN'])).toBe(WORLD_VIEW);
    expect(cardMapView([])).toBe(WORLD_VIEW);
    expect(cardMapView(['ZZ'])).toBe(WORLD_VIEW);
  });
});

describe('cardMapKind', () => {
  it('is the close-up’s kind for a card that asks for one, else the world; a medal has no map', () => {
    expect(cardMapKind({ mapView: 'fit', highlight: ['IT'] })).toBe('country');
    expect(cardMapKind({ mapView: 'fit', highlight: ['FR', 'IT'] })).toBe('crop');
    expect(cardMapKind({ mapView: 'world', highlight: ['IT'] })).toBe('world');
    expect(cardMapKind({ highlight: ['IT'] })).toBe('world');
    expect(cardMapKind({ mapView: 'fit', medal: 'gold', highlight: [] })).toBe('world');
  });
});
