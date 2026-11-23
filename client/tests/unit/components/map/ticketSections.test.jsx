import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import FirstVisitDateField from '@/components/map/FirstVisitDateField';
import CountryNotes from '@/components/map/CountryNotes';
import UkNationsPrompt from '@/components/map/UkNationsPrompt';
import CountryPlannedTrips from '@/components/map/CountryPlannedTrips';
import { formatDayRange } from '@/utils/functions/dates';
import { withProviders } from './helpers';

// The parts of a country's ticket

describe('FirstVisitDateField', () => {
  afterEach(() => vi.useRealTimers());
  const field = (props) => {
    const onSave = vi.fn();
    const { container } = render(<FirstVisitDateField id='first' value='' onSave={onSave} {...props} />);
    return { onSave, input: container.querySelector('input#first'), container };
  };

  it('shows the saved date, from 1900 to today', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 23, 12));
    const { input } = field({ value: '2019-05-01' });
    expect(input.value).toBe('2019-05-01');
    expect(input.getAttribute('min')).toBe('1900-01-01');
    expect(input.getAttribute('max')).toBe('2026-11-23');
  });

  it('saves a complete date after a short pause, and not a year half typed', () => {
    vi.useFakeTimers();
    const { input, onSave } = field();
    fireEvent.change(input, { target: { value: '0201-05-01' } });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '2015-05-01' } });
    act(() => {
      vi.advanceTimersByTime(599);
    });
    expect(onSave).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onSave).toHaveBeenCalledWith('2015-05-01');
  });

  it('saves at once on leaving the field, and only a change', () => {
    const { input, onSave } = field({ value: '2010-01-01' });
    fireEvent.change(input, { target: { value: '2012-03-04' } });
    fireEvent.blur(input);
    expect(onSave).toHaveBeenCalledWith('2012-03-04');
    onSave.mockClear();
    fireEvent.blur(input);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('refuses a day before 1900 or after today, and goes back to the saved one', () => {
    const { input, onSave } = field({ value: '2010-01-01' });
    fireEvent.change(input, { target: { value: '1850-01-01' } });
    fireEvent.blur(input);
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toBe('Choose a day from 1900 to today. That date wasn’t saved.');
    expect(input.value).toBe('2010-01-01');
  });

  it('clears the date when every part is emptied, or with "Clear date"', () => {
    const { input, onSave } = field({ value: '2010-01-01' });
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(onSave).toHaveBeenCalledWith(null);
    onSave.mockClear();
    fireEvent.click(screen.getByText('Clear date'));
    expect(onSave).toHaveBeenCalledWith(null);
    expect(document.activeElement).toBe(input);
  });

  it('has no "Clear date" without a date, and clearing nothing saves nothing', () => {
    const { input, onSave } = field({ value: '' });
    expect(screen.queryByText('Clear date')).toBeNull();
    fireEvent.blur(input);
    expect(onSave).not.toHaveBeenCalled();
  });
});

describe('CountryNotes', () => {
  it('shows the note to someone who can’t edit it, or nothing without one', () => {
    const { container } = render(<CountryNotes code='JP' notes={'Cherry blossom\nin April'} canEdit={false} />);
    expect(container.querySelector('h3').textContent).toBe('Notes');
    expect(container.querySelector('p').textContent).toBe('Cherry blossom\nin April');
    expect(render(<CountryNotes code='FR' notes={null} canEdit={false} />).container.firstChild).toBeNull();
  });

  it('saves an editor’s note, cleaned, and says so', async () => {
    const onSave = vi.fn().mockResolvedValue({});
    const { container } = render(<CountryNotes code='JP' notes='' canEdit onSave={onSave} />);
    const save = screen.getByText('Save note');
    expect(save.disabled).toBe(true);
    fireEvent.change(container.querySelector('textarea'), { target: { value: '  Go in spring  ' } });
    expect(save.disabled).toBe(false);
    fireEvent.click(save);
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Note saved.'));
    expect(onSave).toHaveBeenCalledWith('Go in spring');
    expect(container.querySelector('textarea').value).toBe('Go in spring');
  });

  it('clears a note emptied out', async () => {
    const onSave = vi.fn().mockResolvedValue({});
    const { container } = render(<CountryNotes code='JP' notes='Old' canEdit onSave={onSave} />);
    fireEvent.change(container.querySelector('textarea'), { target: { value: '   ' } });
    fireEvent.submit(container.querySelector('form'));
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Note cleared.'));
    expect(onSave).toHaveBeenCalledWith(null);
  });

  it('says why when it can’t save', async () => {
    const onSave = vi.fn().mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'Offline.' }));
    const { container } = render(<CountryNotes code='JP' notes='' canEdit onSave={onSave} />);
    fireEvent.change(container.querySelector('textarea'), { target: { value: 'A plan' } });
    fireEvent.click(screen.getByText('Save note'));
    expect((await screen.findByRole('alert')).textContent).toBe('Offline.');
  });
});

describe('UkNationsPrompt', () => {
  const visits = { XC: { status: 'VISITED' } };
  const visitOf = (code) => visits[code] || null;

  it('only tells a viewer how the UK was marked', () => {
    const { container } = render(<UkNationsPrompt ukStatus='VISITED' visitOf={visitOf} canEdit={false} />);
    expect(container.textContent).toContain('The United Kingdom was marked “Visited” before this map showed it as England');
    expect(container.querySelector('input')).toBeNull();
  });

  it('ticks the nations marked already, and saves the ones chosen', async () => {
    const onChoose = vi.fn().mockResolvedValue();
    render(<UkNationsPrompt ukStatus='LIVED' visitOf={visitOf} canEdit onChoose={onChoose} />);
    expect(screen.getByLabelText('Scotland').checked).toBe(true);
    expect(screen.getByLabelText('England').checked).toBe(false);
    fireEvent.click(screen.getByLabelText('England'));
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => expect(onChoose).toHaveBeenCalledWith(['XC', 'XE']));
  });

  it('needs at least one nation, and says why a save fails', async () => {
    const onChoose = vi.fn().mockRejectedValue(new Error('x'));
    render(<UkNationsPrompt ukStatus='VISITED' visitOf={() => null} canEdit onChoose={onChoose} />);
    expect(screen.getByText('Save').disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('Wales'));
    fireEvent.click(screen.getByText('Save'));
    expect((await screen.findByRole('alert')).textContent).toBe('That change could not be saved.');
  });
});

describe('CountryPlannedTrips', () => {
  it('shows nothing without trips', () => {
    expect(render(withProviders(<CountryPlannedTrips code='JP' trips={[]} />)).container.textContent).toBe('');
  });

  it('lists the trips planned there, each opening its trip with its dates', () => {
    const trips = [
      { id: 't1', title: 'Spring in Japan', startDate: '2027-04-01', endDate: '2027-04-10', status: 'PLANNED' },
      { id: 't2', title: 'Group tour', startDate: null, endDate: null, status: 'ACTIVE', canOpen: false },
    ];
    const { container } = render(withProviders(<CountryPlannedTrips code='JP' trips={trips} />));
    const section = container.querySelector('[data-planned-trips]');
    expect(section.querySelector('h3').textContent).toBe('Planned trips');
    expect(container.querySelector('a').getAttribute('href')).toBe('/trips/t1');
    expect(section.textContent).toContain(`Spring in Japan, ${formatDayRange('2027-04-01', '2027-04-10')}`);
    // A group trip the viewer isn't on is its title alone
    expect(screen.getByText('Group tour').tagName).toBe('SPAN');
    expect(section.textContent).toContain('Group tour (under way)');
  });

  it('says "Planned trip" for one', () => {
    const { container } = render(withProviders(<CountryPlannedTrips code='JP' trips={[{ id: 't1', title: 'T', status: 'PLANNED' }]} />));
    expect(container.querySelector('h3').textContent).toBe('Planned trip');
  });
});
