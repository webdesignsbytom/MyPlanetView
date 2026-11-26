// A react-icons icon as shapes a canvas can draw (utils/shareCard/iconShape.js)
import { describe, expect, it } from 'vitest';
import { FaGlobe, FaPaw } from 'react-icons/fa';
import { iconShape } from '@/utils/shareCard/iconShape';

describe('iconShape', () => {
  it('hands over the icon’s viewBox and its paths', () => {
    const globe = iconShape(FaGlobe);
    expect(globe.viewBox).toEqual([0, 0, 496, 512]);
    expect(globe.paths.length).toBeGreaterThan(0);
    for (const d of globe.paths) expect(d).toMatch(/^M/);
    expect(iconShape(FaPaw).paths.join('')).not.toBe(globe.paths.join(''));
  });

  it('finds paths inside groups', () => {
    const Grouped = () => ({
      props: {
        attr: { viewBox: '0 0 24 24' },
        children: [{ type: 'g', props: { children: [{ type: 'path', props: { d: 'M1 1h2' } }, null] } }, { type: 'path', props: { d: 'M3 3h4' } }],
      },
    });
    expect(iconShape(Grouped)).toEqual({ viewBox: [0, 0, 24, 24], paths: ['M1 1h2', 'M3 3h4'] });
  });

  it('is null for anything that isn’t an icon with paths', () => {
    expect(iconShape(null)).toBeNull();
    expect(iconShape('FaGlobe')).toBeNull();
    expect(iconShape(() => ({ props: { attr: { viewBox: '0 0 24 24' }, children: [] } }))).toBeNull();
    expect(iconShape(() => ({ props: { attr: {}, children: [{ type: 'path', props: { d: 'M0 0' } }] } }))).toBeNull();
    expect(
      iconShape(() => {
        throw new Error('needs a context');
      }),
    ).toBeNull();
  });
});
