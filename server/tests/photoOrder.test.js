import { describe, it, expect } from 'vitest';
import { POSITION_STEP, positionBetween, positionFirst } from '../src/utils/photoOrder.js';

describe('positionFirst', () => {
  it('starts an empty gallery at 0', () => {
    expect(positionFirst(null)).toBe(0);
    expect(positionFirst(undefined)).toBe(0);
  });

  it('goes a step in front of the current first photo', () => {
    expect(positionFirst(1024)).toBe(1024 - POSITION_STEP);
    expect(positionFirst(-2048)).toBe(-2048 - POSITION_STEP);
  });
});

describe('positionBetween', () => {
  it('takes the halfway point between two neighbours', () => {
    expect(positionBetween(1024, 2048)).toBe(1536);
    expect(positionBetween(-1024, 0)).toBe(-512);
  });

  it('goes a step past the last photo, or before the first', () => {
    expect(positionBetween(2048, null)).toBe(2048 + POSITION_STEP);
    expect(positionBetween(null, 1024)).toBe(1024 - POSITION_STEP);
  });

  it('is 0 in an empty gallery', () => {
    expect(positionBetween(null, null)).toBe(0);
  });

  it('asks for a renumbering when the neighbours are equal (two photos saved at once)', () => {
    expect(positionBetween(1024, 1024)).toBeNull();
  });

  it('asks for a renumbering once a gap has been halved as far as it goes', () => {
    let before = 0;
    let after = POSITION_STEP;
    let moves = 0;
    // Always dropping a photo straight after the same one halves the same gap
    for (;;) {
      const position = positionBetween(before, after);
      if (position === null) break;
      expect(position).toBeGreaterThan(before);
      expect(position).toBeLessThan(after);
      after = position;
      moves += 1;
    }
    // Doubles give plenty of room: dozens of moves into one gap before a renumbering
    expect(moves).toBeGreaterThan(40);
  });
});
