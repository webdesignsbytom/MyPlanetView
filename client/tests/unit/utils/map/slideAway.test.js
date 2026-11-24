// @vitest-environment node
// The map's menus slid out of the way (src/utils/map/slideAway.js; 25 Nov 2026, the user's
// wish): each leaves by its closest side.
import { describe, expect, it } from 'vitest';
import { exitOffset } from '@/utils/map/slideAway';

const VIEW = { width: 1920, height: 1080 };
const box = (left, top, width, height) => ({ left, top, right: left + width, bottom: top + height, width, height });

describe('exitOffset', () => {
  it('sends the toolbar on the right edge out to the right, its shadow’s room past the edge', () => {
    expect(exitOffset(box(1848, 12, 60, 800), VIEW)).toEqual({ side: 'right', distance: 72, x: 96, y: 0 });
  });

  it('sends the zoom stamps in the bottom corner down, the nearer way out', () => {
    const exit = exitOffset(box(1750, 960, 158, 108), VIEW);
    expect(exit.side).toBe('bottom');
    expect(exit.y).toBe(1080 - 960 + 24);
  });

  it('sends a short column of tags at the top left up, a tall one left', () => {
    expect(exitOffset(box(12, 12, 340, 100), VIEW).side).toBe('top');
    expect(exitOffset(box(12, 12, 340, 600), VIEW)).toMatchObject({ side: 'left', x: -(352 + 24) });
  });

  it('can be told its side and its margin: the toolbar goes right by its own width, the tab stays', () => {
    expect(exitOffset(box(1848, 12, 60, 800), VIEW, { toward: 'right', margin: 0 })).toEqual({ side: 'right', distance: 72, x: 72, y: 0 });
    expect(exitOffset(box(800, 400, 300, 200), VIEW, { toward: 'top' }).side).toBe('top');
  });

  it('takes the first of left, right, top, bottom on a tie, and ignores a side it doesn’t know', () => {
    // In a tall window left and right are nearest, 600 each
    expect(exitOffset(box(400, 900, 200, 200), { width: 1000, height: 2000 }).side).toBe('left');
    expect(exitOffset(box(1848, 12, 60, 800), VIEW, { toward: 'sideways' }).side).toBe('right');
  });
});
