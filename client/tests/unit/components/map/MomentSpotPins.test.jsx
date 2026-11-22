import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import MomentSpotPins, { MomentSpotIcon } from '@/components/map/MomentSpotPins';
import { badgeRadius } from '@/utils/map/badges';
import { projectToMap } from '@/utils/map/projection';

const SPOTS = [
  { id: 's1', title: 'Engaged', countryCode: 'FR', latitude: 48.8584, longitude: 2.2945 },
  { id: 's2', title: 'Base camp', countryCode: 'AQ', latitude: -77.8, longitude: 166.7 },
];

const draw = (props) => {
  const { container } = render(
    <svg>
      <MomentSpotPins spots={SPOTS} zoom={1} {...props} />
    </svg>,
  );
  return container.querySelector('[data-moment-spots]');
};

describe('MomentSpotIcon', () => {
  it('draws the pin for the map key', () => {
    const { container } = render(<MomentSpotIcon />);
    expect(container.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('path').getAttribute('class')).toContain('fill-poster-red');
  });
});

describe('MomentSpotPins', () => {
  it('puts a pin with its tip on each spot, titled by its moment', () => {
    const group = draw();
    expect(group.getAttribute('data-moment-spots')).toBe('2');
    const pin = group.querySelector('[data-moment-spot="s1"]');
    expect(pin.getAttribute('data-spot-country')).toBe('FR');
    expect(pin.querySelector('title').textContent).toBe('Engaged');
    const at = projectToMap(48.8584, 2.2945);
    const r = badgeRadius(1) * 0.75;
    expect(pin.getAttribute('transform')).toBe(`translate(${at.x} ${at.y}) scale(${r})`);
  });

  it('sizes the pins by zoom', () => {
    const pin = draw({ zoom: 4 }).querySelector('[data-moment-spot="s1"]');
    expect(pin.getAttribute('transform')).toContain(`scale(${badgeRadius(4) * 0.75})`);
  });

  it('leaves Antarctica’s pins out while it is hidden', () => {
    const group = draw({ showAntarctica: false });
    expect(group.querySelector('[data-moment-spot="s2"]')).toBeNull();
    expect(group.querySelector('[data-moment-spot="s1"]')).not.toBeNull();
  });

  it('skips a spot that has no place on the map', () => {
    const group = draw({ spots: [{ id: 'bad', title: 'Nowhere', countryCode: 'FR', latitude: 200, longitude: 0 }] });
    expect(group.querySelector('[data-moment-spot]')).toBeNull();
  });

  it('opens the pin’s country through afterTap, and stops the click reaching the map', () => {
    const onSelectCountry = vi.fn();
    const afterTap = vi.fn((run) => run());
    const outer = vi.fn();
    const { container } = render(
      <svg onClick={outer}>
        <MomentSpotPins spots={SPOTS} zoom={1} onSelectCountry={onSelectCountry} afterTap={afterTap} />
      </svg>,
    );
    const pin = container.querySelector('[data-moment-spot="s1"]');
    expect(pin.getAttribute('class')).toBe('cursor-pointer');
    fireEvent.click(pin.querySelector('path'));
    expect(afterTap).toHaveBeenCalledTimes(1);
    expect(onSelectCountry).toHaveBeenCalledWith('FR');
    expect(outer).not.toHaveBeenCalled();
  });

  it('opens straight away without afterTap, and ignores clicks off the pins', () => {
    const onSelectCountry = vi.fn();
    const group = draw({ onSelectCountry });
    fireEvent.click(group);
    expect(onSelectCountry).not.toHaveBeenCalled();
    fireEvent.click(group.querySelector('[data-moment-spot="s2"] circle'));
    expect(onSelectCountry).toHaveBeenCalledWith('AQ');
  });

  it('does nothing on a press when it can’t open countries', () => {
    const group = draw();
    expect(group.querySelector('[data-moment-spot="s1"]').getAttribute('class')).toBeNull();
    expect(() => fireEvent.click(group.querySelector('[data-moment-spot="s1"] path'))).not.toThrow();
  });
});
