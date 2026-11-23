import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CountryFlag from '@/components/countryMap/CountryFlag';
import CountryMapList from '@/components/countryMap/CountryMapList';
import CountryMapLoading from '@/components/countryMap/CountryMapLoading';
import StatePopover from '@/components/countryMap/StatePopover';

describe('CountryFlag', () => {
  it('shows the flag only once its file has loaded', () => {
    render(<CountryFlag code='FR' name='France' />);
    const img = screen.getByAltText('Flag of France');
    expect(img.getAttribute('src')).toBe('/flags/fr.svg');
    expect(img.className).toContain('hidden');
    fireEvent.load(img);
    expect(img.className).not.toContain('hidden');
    fireEvent.error(img);
    expect(img.className).toContain('hidden');
  });

  it('uses the UK nations’ own files', () => {
    render(<CountryFlag code='XC' name='Scotland' />);
    expect(screen.getByAltText('Flag of Scotland').getAttribute('src')).toBe('/flags/xc.svg');
  });
});

describe('CountryMapLoading', () => {
  it('says which country is opening, over the stamps', () => {
    const { container } = render(<CountryMapLoading name='Italy' />);
    expect(container.querySelector('[data-country-map-loading]')).toBeTruthy();
    expect(screen.getByText('Opening Italy…').closest('[role="status"]')).toBeTruthy();
  });

  it('says “Loading…” without a name', () => {
    render(<CountryMapLoading />);
    expect(screen.getByText('Loading…')).toBeTruthy();
  });
});

describe('CountryMapList', () => {
  const AREAS = [
    { code: 'LU-L', name: 'Luxembourg' },
    { code: 'LU-D', name: 'Diekirch' },
    { code: null, name: 'Lake' },
  ];
  const statuses = new Map([['LU-D', 'VISITED']]);

  it('lists the states A to Z with how the map stands with each, and opens one', () => {
    const onOpenState = vi.fn();
    render(<CountryMapList areas={AREAS} statuses={statuses} pins={[]} word={['district', 'districts']} onOpenState={onOpenState} onOpenPin={() => {}} />);
    expect(screen.getByText('Districts')).toBeTruthy();
    const buttons = [...document.querySelectorAll('section:first-of-type button')];
    expect(buttons.map((b) => b.textContent)).toEqual(['DiekirchVisited', 'LuxembourgNot been yet']);
    fireEvent.click(buttons[0]);
    expect(onOpenState).toHaveBeenCalledWith('LU-D', buttons[0]);
    expect(screen.getByText('No pins yet.')).toBeTruthy();
  });

  it('lists the pins, each opening its panel', () => {
    const onOpenPin = vi.fn();
    render(<CountryMapList areas={[]} statuses={new Map()} pins={[{ id: 'pin1', name: 'Our café' }]} onOpenState={() => {}} onOpenPin={onOpenPin} />);
    expect(screen.getByText('States')).toBeTruthy();
    fireEvent.click(screen.getByText('Our café'));
    expect(onOpenPin).toHaveBeenCalledWith('pin1');
  });
});

describe('StatePopover', () => {
  it('lets an editor mark the state with a stamp, the current one pressed and focused', () => {
    const onChange = vi.fn();
    const onClose = vi.fn();
    render(<StatePopover name='Diekirch' status='VISITED' x={100} y={100} canEdit onChange={onChange} onClose={onClose} />);
    const card = document.querySelector('[data-state-popover]');
    expect(card.getAttribute('role')).toBe('dialog');
    expect(card.getAttribute('aria-label')).toBe('Diekirch');
    const stamps = [...card.querySelectorAll('[role="group"] button')];
    expect(stamps.map((b) => b.textContent)).toEqual(['Visited', 'Lived there', 'Want to go', 'Not yet']);
    expect(stamps[0].getAttribute('aria-pressed')).toBe('true');
    expect(document.activeElement).toBe(stamps[0]);
    fireEvent.click(stamps[3]);
    expect(onChange).toHaveBeenCalledWith(null);
    expect(onClose).toHaveBeenCalled();
  });

  it('only closes when the stamp already pressed is pressed again', () => {
    const onChange = vi.fn();
    const onClose = vi.fn();
    render(<StatePopover name='Diekirch' status={null} x={0} y={0} canEdit onChange={onChange} onClose={onClose} />);
    fireEvent.click(screen.getByText('Not yet'));
    expect(onChange).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('only says how the map stands with it to a viewer', () => {
    const onClose = vi.fn();
    render(<StatePopover name='Diekirch' status='LIVED' x={0} y={0} canEdit={false} onChange={() => {}} onClose={onClose} />);
    expect(screen.getByText('Lived there')).toBeTruthy();
    expect(screen.queryByText('Visited')).toBeNull();
    fireEvent.click(screen.getByLabelText('Close Diekirch'));
    expect(onClose).toHaveBeenCalled();
  });

  it('stays on the screen', () => {
    render(<StatePopover name='Diekirch' status={null} x={-500} y={-500} canEdit={false} onChange={() => {}} onClose={() => {}} />);
    const card = document.querySelector('[data-state-popover]');
    expect(card.style.left).toBe('8px');
    expect(card.style.top).toBe('8px');
  });
});
