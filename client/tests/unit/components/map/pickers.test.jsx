import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import MapStylePicker from '@/components/map/MapStylePicker';
import MapTypePicker from '@/components/map/MapTypePicker';
import LandmarkPinsPicker from '@/components/map/LandmarkPinsPicker';
import MapSettingsToggles from '@/components/map/MapSettingsToggles';
import VisitStatusSelect from '@/components/map/VisitStatusSelect';
import CountryStatusControl from '@/components/map/CountryStatusControl';
import CountryListItem from '@/components/map/CountryListItem';
import { DEFAULT_MAP_SETTINGS } from '@/utils/map/mapSettings';

// Settings' pickers and the visit status controls

describe('MapStylePicker', () => {
  it('offers the five styles as cards, each in its own colours', () => {
    const { container } = render(<MapStylePicker value='starry' onChange={() => {}} />);
    const cards = [...container.querySelectorAll('label[data-map-style]')];
    expect(cards.map((c) => c.getAttribute('data-map-style'))).toEqual(['animated', 'mono', 'old-map', 'starry', 'engraved']);
    expect(screen.getByLabelText('Starry night').checked).toBe(true);
    // The hidden radio stays inside its card (a far ancestor scrolled the page)
    for (const card of cards) expect(card.getAttribute('class')).toContain('relative');
    // Each previewed by its picture, or the plain sea where it has none
    for (const card of cards) expect(card.querySelector('img') || card.querySelector('span.bg-map-sea')).not.toBeNull();
    expect(cards[3].querySelector('img')).not.toBeNull();
    // The engraved ocean's card shows its waves (25 Nov 2026)
    expect(cards[4].querySelector('img').getAttribute('src')).toContain('engraved-ocean');
    expect(screen.getByLabelText('Engraved ocean')).toBeTruthy();
  });

  it('calls back with the style picked, and shows a note when given one', () => {
    const onChange = vi.fn();
    render(<MapStylePicker value='animated' onChange={onChange} note='Everyone sees this style.' />);
    fireEvent.click(screen.getByLabelText('Old map'));
    expect(onChange).toHaveBeenCalledWith('old-map');
    expect(screen.getByText('Everyone sees this style.')).toBeTruthy();
  });
});

describe('MapTypePicker', () => {
  it('offers Regular and Detailed, with what each shows', () => {
    const onChange = vi.fn();
    const { container } = render(<MapTypePicker value='regular' onChange={onChange} />);
    expect(screen.getByLabelText(/Regular/).checked).toBe(true);
    expect(screen.getByText('Names and lines everywhere')).toBeTruthy();
    for (const card of container.querySelectorAll('label')) expect(card.getAttribute('class')).toContain('relative');
    fireEvent.click(screen.getByLabelText(/Detailed/));
    expect(onChange).toHaveBeenCalledWith('detailed');
  });
});

describe('LandmarkPinsPicker', () => {
  it('offers the four modes, the chosen one ticked', () => {
    const onChange = vi.fn();
    render(<LandmarkPinsPicker value='stamped' onChange={onChange} />);
    expect(screen.getByLabelText('Only the landmarks in your passport').checked).toBe(true);
    expect(screen.getByLabelText('When zoomed in').checked).toBe(false);
    fireEvent.click(screen.getByLabelText('Off'));
    expect(onChange).toHaveBeenCalledWith('off');
  });
});

describe('MapSettingsToggles', () => {
  it('lists the switches in their four groups, each on or off as set', () => {
    const { container } = render(<MapSettingsToggles settings={{ ...DEFAULT_MAP_SETTINGS, showMoments: false }} onChange={() => {}} />);
    expect([...container.querySelectorAll('legend')].map((l) => l.textContent)).toEqual([
      'Show on the map',
      'Map details',
      'Sea, sky and hover',
      'Help',
    ]);
    expect(container.querySelector('#setting-showMoments').checked).toBe(false);
    expect(container.querySelector('#setting-showVisited').checked).toBe(true);
  });

  // 24 Nov 2026, the user's wish: the tips' own toolbar stamp moved here
  it('ends Help with “Show the tips”, where it’s given', () => {
    const onShowTips = vi.fn();
    const { container, unmount } = render(<MapSettingsToggles settings={DEFAULT_MAP_SETTINGS} onChange={() => {}} onShowTips={onShowTips} />);
    const help = [...container.querySelectorAll('fieldset')].find((f) => f.querySelector('legend').textContent === 'Help');
    fireEvent.click(help.querySelector('button'));
    expect(help.querySelector('button').textContent).toBe('Show the tips');
    expect(onShowTips).toHaveBeenCalled();
    unmount();
    render(<MapSettingsToggles settings={DEFAULT_MAP_SETTINGS} onChange={() => {}} />);
    expect(screen.queryByText('Show the tips')).toBeNull();
  });

  it('says which setting changed and how', () => {
    const onChange = vi.fn();
    const { container } = render(<MapSettingsToggles settings={DEFAULT_MAP_SETTINGS} onChange={onChange} />);
    fireEvent.click(container.querySelector('#setting-animatedSea'));
    expect(onChange).toHaveBeenCalledWith('animatedSea', false);
  });

  it('locks the label switch while the lines are off', () => {
    const { container } = render(<MapSettingsToggles settings={{ ...DEFAULT_MAP_SETTINGS, showGrid: false }} onChange={() => {}} />);
    expect(container.querySelector('#setting-showGridLabels').disabled).toBe(true);
  });

  it('locks the Detailed map’s lines and names on, with a note saying why', () => {
    const { container } = render(
      <MapSettingsToggles settings={{ ...DEFAULT_MAP_SETTINGS, mapType: 'detailed', showGrid: false, showCountryNames: false }} onChange={() => {}} />,
    );
    const names = container.querySelector('#setting-showCountryNames');
    expect(names.checked).toBe(true);
    expect(names.disabled).toBe(true);
    const note = document.getElementById(names.getAttribute('aria-describedby'));
    expect(note.textContent).toContain('The Detailed map always shows these');
    expect(container.querySelector('#setting-showGrid').checked).toBe(true);
  });

  it('hides the banner’s switch below wide screens', () => {
    const { container } = render(<MapSettingsToggles settings={DEFAULT_MAP_SETTINGS} onChange={() => {}} />);
    expect(container.querySelector('#setting-showUserBanner').closest('.max-lg\\:hidden')).not.toBeNull();
  });

  // 25 Nov 2026, the user's wish: switches for the next trip's countdown and the map key,
  // which phones never show, so its switch isn't there either
  it('switches the next trip’s countdown and the map key, the key’s hidden on phones', () => {
    const onChange = vi.fn();
    const { container } = render(<MapSettingsToggles settings={{ ...DEFAULT_MAP_SETTINGS, showMapKey: false }} onChange={onChange} />);
    const countdown = container.querySelector('#setting-showTripCountdown');
    const key = container.querySelector('#setting-showMapKey');
    expect(countdown.checked).toBe(true);
    expect(key.checked).toBe(false);
    expect(countdown.closest('.phone\\:hidden')).toBeNull();
    expect(key.closest('.phone\\:hidden')).not.toBeNull();
    fireEvent.click(countdown);
    expect(onChange).toHaveBeenCalledWith('showTripCountdown', false);
    fireEvent.click(key);
    expect(onChange).toHaveBeenCalledWith('showMapKey', true);
  });
});

describe('VisitStatusSelect', () => {
  it('names itself for the country unless a visible label does', () => {
    const { container } = render(<VisitStatusSelect id='s' countryName='France' status='VISITED' onChange={() => {}} />);
    const select = container.querySelector('select');
    expect(select.getAttribute('aria-label')).toBe('Status for France');
    expect(select.value).toBe('VISITED');
    expect([...select.querySelectorAll('option')].map((o) => o.textContent)).toEqual(['Not yet', 'Visited', 'Lived there', 'Want to go']);
    const { container: labelled } = render(<VisitStatusSelect id='t' countryName='France' labelled onChange={() => {}} />);
    expect(labelled.querySelector('select').hasAttribute('aria-label')).toBe(false);
    expect(labelled.querySelector('select').value).toBe('');
  });

  it('gives the status chosen, or null for "Not yet"', () => {
    const onChange = vi.fn();
    const { container } = render(<VisitStatusSelect id='s' countryName='Peru' status='LIVED' onChange={onChange} />);
    const select = container.querySelector('select');
    fireEvent.change(select, { target: { value: 'WANT_TO_GO' } });
    fireEvent.change(select, { target: { value: '' } });
    expect(onChange.mock.calls).toEqual([['WANT_TO_GO'], [null]]);
  });
});

describe('CountryStatusControl', () => {
  it('is a stamp button naming the country and its status', () => {
    render(<CountryStatusControl code='FR' countryName='France' status='VISITED' onChange={() => {}} />);
    const stamp = screen.getByLabelText('Status for France: Visited');
    expect(stamp.tagName).toBe('BUTTON');
    expect(stamp.getAttribute('aria-haspopup')).toBe('listbox');
    expect(stamp.textContent).toContain('Visited');
    render(<CountryStatusControl code='PE' countryName='Peru' onChange={() => {}} />);
    expect(screen.getByLabelText('Status for Peru: Not yet')).toBeTruthy();
  });

  it('swaps in the real dropdown, focused, and opens it where it can', () => {
    const showPicker = vi.fn();
    HTMLSelectElement.prototype.showPicker = showPicker;
    try {
      const onChange = vi.fn();
      const { container } = render(<CountryStatusControl code='FR' countryName='France' status={null} onChange={onChange} />);
      fireEvent.click(screen.getByLabelText('Status for France: Not yet'));
      const select = container.querySelector('select#status-FR');
      expect(document.activeElement).toBe(select);
      expect(showPicker).toHaveBeenCalled();
      fireEvent.change(select, { target: { value: 'LIVED' } });
      expect(onChange).toHaveBeenCalledWith('FR', 'LIVED');
      // Once focus leaves it, it's a stamp again
      fireEvent.blur(select);
      expect(container.querySelector('select')).toBeNull();
      expect(container.querySelector('button')).not.toBeNull();
    } finally {
      delete HTMLSelectElement.prototype.showPicker;
    }
  });

  it('still opens where showPicker throws (Safari)', () => {
    HTMLSelectElement.prototype.showPicker = () => {
      throw new Error('not allowed');
    };
    try {
      const { container } = render(<CountryStatusControl code='FR' countryName='France' onChange={() => {}} />);
      fireEvent.click(container.querySelector('button'));
      expect(document.activeElement).toBe(container.querySelector('select'));
    } finally {
      delete HTMLSelectElement.prototype.showPicker;
    }
  });
});

describe('CountryListItem', () => {
  const country = { code: 'JP', name: 'Japan' };

  it('opens the country from its name', () => {
    const onShow = vi.fn();
    render(
      <ul>
        <CountryListItem country={country} status='VISITED' canEdit={false} onChangeStatus={() => {}} onShow={onShow} />
      </ul>,
    );
    fireEvent.click(screen.getByText('Japan'));
    expect(onShow).toHaveBeenCalledWith('JP');
  });

  it('shows the status in words for someone who can’t change it', () => {
    const { container } = render(
      <ul>
        <CountryListItem country={country} canEdit={false} onChangeStatus={() => {}} onShow={() => {}} />
      </ul>,
    );
    expect(container.querySelectorAll('button').length).toBe(1);
    expect(screen.getByText('Not yet').tagName).toBe('SPAN');
  });

  it('gives an editor the status stamp', () => {
    render(
      <ul>
        <CountryListItem country={country} status='WANT_TO_GO' canEdit onChangeStatus={() => {}} onShow={() => {}} />
      </ul>,
    );
    expect(screen.getByLabelText('Status for Japan: Want to go')).toBeTruthy();
  });
});
