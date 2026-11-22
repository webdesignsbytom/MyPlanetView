// The map's small helpers: hoverPoint (a held finger's place for the hover postcard),
// pointerFocus (a press marks the map's SVG), valueStore (a value a few components follow),
// travellerNames (names as a sentence), and the constants of quickFill, mapPhotoLists and
// mapTypes.
import { describe, expect, it, vi } from 'vitest';
import { setHoverPoint, takeHoverPoint } from '@/utils/map/hoverPoint';
import { clearPointerFocus, markPointerFocus } from '@/utils/map/pointerFocus';
import { createValueStore } from '@/utils/map/valueStore';
import { joinNames } from '@/utils/map/travellerNames';
import { QUICK_FILL_MAX_VISITS, QUICK_FILL_SHOWN_KEY } from '@/utils/map/quickFill';
import { MAP_PHOTOS, UNPLACED_PHOTOS } from '@/utils/map/mapPhotoLists';
import { MAP_TYPES, MAP_TYPE_IDS } from '@/utils/map/mapTypes';

describe('hoverPoint', () => {
  it('hands the finger’s point over once, then forgets it', () => {
    setHoverPoint({ x: 120, y: 340 });
    expect(takeHoverPoint()).toEqual({ x: 120, y: 340 });
    expect(takeHoverPoint()).toBeNull();
  });

  it('gives nothing when no finger is waiting, and the newest point when several were set', () => {
    expect(takeHoverPoint()).toBeNull();
    setHoverPoint({ x: 1, y: 1 });
    setHoverPoint({ x: 2, y: 2 });
    expect(takeHoverPoint()).toEqual({ x: 2, y: 2 });
  });
});

describe('pointerFocus', () => {
  it('marks the SVG on a press and clears the mark when it loses focus', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    markPointerFocus({ currentTarget: svg });
    expect(svg.getAttribute('data-pointer-focus')).toBe('');
    clearPointerFocus({ currentTarget: svg });
    expect(svg.hasAttribute('data-pointer-focus')).toBe(false);
  });

  it('marks the element the handler is on, not the one pressed inside it', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.appendChild(path);
    markPointerFocus({ currentTarget: svg, target: path });
    expect(path.hasAttribute('data-pointer-focus')).toBe(false);
    expect(svg.hasAttribute('data-pointer-focus')).toBe(true);
  });
});

describe('createValueStore', () => {
  it('starts with its first value, or null', () => {
    expect(createValueStore().get()).toBeNull();
    expect(createValueStore('FR').get()).toBe('FR');
  });

  it('tells every listener of a change', () => {
    const store = createValueStore();
    const one = vi.fn();
    const two = vi.fn();
    store.subscribe(one);
    store.subscribe(two);
    store.set('JP');
    expect(store.get()).toBe('JP');
    expect(one).toHaveBeenCalledTimes(1);
    expect(two).toHaveBeenCalledTimes(1);
  });

  it('tells nobody when the value stays the same', () => {
    const store = createValueStore('FR');
    const listener = vi.fn();
    store.subscribe(listener);
    store.set('FR');
    expect(listener).not.toHaveBeenCalled();
    // NaN is the same value as NaN (Object.is)
    store.set(Number.NaN);
    store.set(Number.NaN);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('stops telling a listener once it unsubscribes', () => {
    const store = createValueStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.set('IT');
    expect(listener).not.toHaveBeenCalled();
  });

  it('keeps each store’s value to itself', () => {
    const a = createValueStore();
    const b = createValueStore();
    a.set('ES');
    expect(b.get()).toBeNull();
  });
});

describe('joinNames', () => {
  it('reads names as a sentence', () => {
    expect(joinNames(['Sarah'])).toBe('Sarah');
    expect(joinNames(['Sarah', 'Tom'])).toBe('Sarah and Tom');
    expect(joinNames(['Sarah', 'Tom', 'Lily'])).toBe('Sarah, Tom and Lily');
    expect(joinNames(['A', 'B', 'C', 'D'])).toBe('A, B, C and D');
  });

  it('is empty for nobody', () => {
    expect(joinNames([])).toBe('');
  });
});

describe('the map’s constants', () => {
  it('offers “Where have you been?” on a map with three countries at most, once a visit', () => {
    expect(QUICK_FILL_MAX_VISITS).toBe(3);
    expect(QUICK_FILL_SHOWN_KEY).toBe('mpv:quickFillShown');
  });

  it('asks for the photo lists a page at a time, with their screen-sized copies', () => {
    expect(UNPLACED_PHOTOS).toEqual({ unplaced: true, limit: 60, display: true });
    expect(MAP_PHOTOS).toEqual({ limit: 60, display: true });
  });

  it('has the Regular and Detailed map types, each with its preview', () => {
    expect(MAP_TYPE_IDS).toEqual(['regular', 'detailed']);
    expect(MAP_TYPES.every((type) => type.label && type.preview === type.id)).toBe(true);
  });
});
