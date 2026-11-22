import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import EntryStamp from '@/components/passport/EntryStamp';
import { stampLook } from '@/utils/passport/passportBook';

const texts = (container) => [...container.querySelectorAll('text')].map((t) => t.textContent);

describe('EntryStamp', () => {
  it('says the country was entered, with its name in capitals and the date', () => {
    const { container } = render(<EntryStamp countryCode='FR' status='VISITED' enteredOn='2019-04-12' />);
    expect(texts(container)).toEqual(['MY PLANET VIEW · ADMITTED', 'FRANCE', '12 APR 2019']);
  });

  it('is a residence stamp for a country lived in', () => {
    const { container } = render(<EntryStamp countryCode='FR' status='LIVED' enteredOn='2019-04-12' />);
    expect(texts(container)[0]).toBe('MY PLANET VIEW · RESIDENT');
  });

  it('is a plain entry stamp for a country only stamped from photos', () => {
    const { container } = render(<EntryStamp countryCode='FR' status={null} enteredOn={null} />);
    expect(texts(container)).toEqual(['MY PLANET VIEW · ENTRY', 'FRANCE', 'DATE NOT KNOWN']);
  });

  it('sets a short name at the largest size and shrinks a long one to fit', () => {
    const short = render(<EntryStamp countryCode='FR' status='VISITED' />).container.querySelectorAll('text')[1];
    expect(short.getAttribute('font-size')).toBe('28');
    const long = render(<EntryStamp countryCode='CF' status='VISITED' />).container.querySelectorAll('text')[1];
    expect(long.textContent).toBe('CENTRAL AFRICAN REPUBLIC');
    expect(Number(long.getAttribute('font-size'))).toBeCloseTo(236 / (24 * 0.74), 5);
  });

  it('is decorative, tilted and inked as the country’s code decides', () => {
    const { tilt, ink } = stampLook('entry-JP');
    const svg = render(<EntryStamp countryCode='JP' status='VISITED' />).container.querySelector('svg');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('class')).toContain(ink);
    expect(svg.style.transform).toBe(`rotate(${tilt}deg)`);
  });
});
