import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import AirportStamp from '@/components/flights/AirportStamp';
import { stampLook } from '@/utils/passport/passportBook';

// 25 Nov 2026, the user's wish: "a bit more style on the stamps"
const stamp = (airport, firstFlownOn) => render(<AirportStamp airport={airport} firstFlownOn={firstFlownOn} />).container.querySelector('svg');

describe('AirportStamp', () => {
  it('prints the code, the city on a curve and the first day flown on another, decoratively', () => {
    const svg = stamp({ code: 'VCE', city: 'Venezia (VE)' }, '2026-02-13');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.querySelector('text').textContent).toBe('VCE');
    expect([...svg.querySelectorAll('textPath')].map((t) => t.textContent)).toEqual(['VENEZIA', '13 FEB 2026']);
    // Each curve is its own: two stamps on a page never share an id
    const ids = [...svg.querySelectorAll('defs path')].map((p) => p.id);
    expect(new Set(ids).size).toBe(2);
    for (const textPath of svg.querySelectorAll('textPath')) expect(ids).toContain(textPath.getAttribute('href').slice(1));
  });

  it('leaves the date off when it isn’t known', () => {
    const svg = stamp({ code: 'LHR', city: 'London' }, '');
    expect([...svg.querySelectorAll('textPath')].map((t) => t.textContent)).toEqual(['LONDON']);
  });

  it('is tilted and inked as the passport’s stamps are, by the code, so it always looks the same', () => {
    const { tilt, ink } = stampLook('airport-DUB');
    const svg = stamp({ code: 'DUB', city: 'Dublin' }, '2014-06-20');
    expect(svg.getAttribute('class')).toContain(ink);
    expect(svg.style.transform).toBe(`rotate(${tilt}deg)`);
    expect(stamp({ code: 'DUB', city: 'Dublin' }).outerHTML.replace(/id="[^"]*"|href="[^"]*"/g, '')).toBe(
      stamp({ code: 'DUB', city: 'Dublin' }).outerHTML.replace(/id="[^"]*"|href="[^"]*"/g, ''),
    );
  });

  it('has a plain or a scalloped edge, both among the airports', () => {
    const edges = new Set(['AGP', 'AKL', 'AMM', 'AMS', 'ATH', 'BCN', 'BGO', 'CDG', 'CPT', 'DEL', 'DUB', 'FCO'].map((code) => stamp({ code, city: code }).dataset.airportStamp));
    expect(edges).toEqual(new Set(['round', 'scalloped']));
  });

  it('sets a long city smaller, so it stays on its curve', () => {
    const size = (city) => Number(stamp({ code: 'XXX', city }).querySelector('textPath').parentElement.getAttribute('font-size'));
    expect(size('Rome')).toBe(10);
    expect(size('Saint Petersburg Pulkovo Somewhere')).toBeLessThan(5);
  });
});
