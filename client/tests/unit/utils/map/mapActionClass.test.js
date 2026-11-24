// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { mapActionClass } from '@/utils/map/mapActionClass';

describe('mapActionClass', () => {
  it('is the compact poster button by default', () => {
    const classes = mapActionClass();
    expect(classes).toContain('btn-poster');
    expect(classes).toContain('[--btn-size:1.0625rem]');
    expect(classes).toContain('[--btn-pad-y:0.25rem]');
  });

  it('is parchment when quiet and red when it deletes, the same size each time', () => {
    expect(mapActionClass({ quiet: true })).toContain('btn-paper');
    expect(mapActionClass({ danger: true })).toContain('btn-danger');
    expect(mapActionClass({ quiet: true, danger: true })).toContain('btn-danger');
    const size = (c) => c.replace(/btn-(poster|paper|danger)/, '');
    expect(size(mapActionClass({ quiet: true }))).toBe(size(mapActionClass()));
    expect(size(mapActionClass({ danger: true }))).toBe(size(mapActionClass()));
  });
});
