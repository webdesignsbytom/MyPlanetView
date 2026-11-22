import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import LandmarkStamp from '@/components/passport/LandmarkStamp';
import { STAMP_SHAPES, stampLook } from '@/utils/passport/passportBook';
import { STAMP_GEOMETRY } from '@/utils/passport/stampShapes';

const idWithShape = (shape) => {
  for (let i = 0; i < 500; i++) if (stampLook(`lm-${i}`).shape === shape) return `lm-${i}`;
  throw new Error(`No id found for ${shape}`);
};

const stampOf = (over = {}) => ({
  landmarkId: idWithShape('circle'),
  name: 'Eiffel Tower',
  stampedOn: '2019-04-12',
  isUnesco: false,
  photo: { id: 'p1', thumbUrl: 'https://photos.test/eiffel-thumb.jpg' },
  ...over,
});

const draw = (stamp) => render(<LandmarkStamp stamp={stamp} />).container.querySelector('svg');

describe('LandmarkStamp', () => {
  it('is decorative, in the shape, tilt and ink its landmark’s id gives', () => {
    const stamp = stampOf();
    const { tilt, ink } = stampLook(stamp.landmarkId);
    const svg = draw(stamp);
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('viewBox')).toBe('0 0 200 200');
    expect(svg.getAttribute('class')).toContain(ink);
    expect(svg.style.transform).toBe(`rotate(${tilt}deg)`);
  });

  it.each(STAMP_SHAPES)('draws the %s shape’s borders and photo frame', (shape) => {
    const g = STAMP_GEOMETRY[shape];
    const svg = draw(stampOf({ landmarkId: idWithShape(shape) }));
    expect(svg.getAttribute('viewBox')).toBe(`0 0 ${g.width} ${g.height}`);
    const borders = svg.querySelector('g[fill="none"]').children;
    expect([...borders].map((el) => [el.tagName, el.getAttribute('stroke-width')])).toEqual([
      [g.outer.tag, '5'],
      [g.inner.tag, '1.5'],
    ]);
  });

  it('sets the name on its curve, in capitals, and the date as a rubber stamp prints it', () => {
    const svg = draw(stampOf());
    const [name, date] = svg.querySelectorAll('textPath');
    expect(name.textContent).toBe('EIFFEL TOWER');
    expect(date.textContent).toBe('12 APR 2019');
    // Each runs along its own path in the stamp's defs
    const namePath = svg.querySelector(`path[id="${name.getAttribute('href').slice(1)}"]`);
    expect(namePath.getAttribute('d')).toBe(STAMP_GEOMETRY.circle.name.d);
  });

  it('leaves the date out when the stamp has none', () => {
    const svg = draw(stampOf({ stampedOn: null }));
    expect(svg.querySelectorAll('textPath').length).toBe(1);
  });

  it('cuts a name too long for the curve with an ellipsis', () => {
    const svg = draw(stampOf({ name: 'The Historic Centre of a Very Long Named Old Town by the Great River' }));
    expect(svg.querySelector('textPath').textContent.endsWith('…')).toBe(true);
  });

  it('puts the photo in the frame, clipped to its shape', () => {
    const svg = draw(stampOf());
    const image = svg.querySelector('image');
    expect(image.getAttribute('href')).toBe('https://photos.test/eiffel-thumb.jpg');
    const clipId = image.getAttribute('clip-path').match(/^url\(#(.+)\)$/)[1];
    expect(svg.querySelector(`clipPath[id="${clipId}"]`)).not.toBeNull();
    // A round frame: the picture fills the square round it
    expect(['x', 'y', 'width', 'height'].map((a) => image.getAttribute(a))).toEqual(['56', '56', '88', '88']);
  });

  it('fills a rectangular frame’s own box', () => {
    const svg = draw(stampOf({ landmarkId: idWithShape('rectangle') }));
    const image = svg.querySelector('image');
    expect(['x', 'y', 'width', 'height'].map((a) => image.getAttribute(a))).toEqual(['70', '50', '80', '62']);
  });

  it('fills an oval frame’s box', () => {
    const svg = draw(stampOf({ landmarkId: idWithShape('oval') }));
    const image = svg.querySelector('image');
    expect(['x', 'y', 'width', 'height'].map((a) => image.getAttribute(a))).toEqual(['78', '52', '84', '60']);
  });

  it('draws an empty frame when the photo has no thumbnail', () => {
    const svg = draw(stampOf({ photo: { id: 'p1', thumbUrl: null } }));
    expect(svg.querySelector('image')).toBeNull();
  });

  it('carries the temple only for a UNESCO World Heritage Site, at each of its shape’s marks', () => {
    expect(draw(stampOf()).querySelectorAll('g[transform^="translate"]').length).toBe(0);
    const rectangle = draw(stampOf({ landmarkId: idWithShape('rectangle'), isUnesco: true }));
    expect(rectangle.querySelectorAll('g[transform^="translate"]').length).toBe(2);
    const circle = draw(stampOf({ isUnesco: true }));
    expect(circle.querySelector('g[transform^="translate"]').getAttribute('transform')).toBe('translate(93 146)');
  });
});
