import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TripForm from '@/components/trips/TripForm';

const TRAVELLERS = [
  { id: 'a', name: 'Charlie' },
  { id: 'b', name: 'Alex' },
];

const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const submit = () => fireEvent.submit(document.querySelector('form'));

describe('TripForm', () => {
  it('starts as a new planned trip with every traveller going', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<TripForm travellers={TRAVELLERS} onSubmit={onSubmit} />);
    expect(screen.getByLabelText('Status').value).toBe('PLANNED');
    expect(screen.getByText('Charlie').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Create trip')).toBeTruthy();
    type(/^Title/, '  Japan in spring  ');
    type(/^From/, '2027-04-01');
    type(/^To/, '2027-04-14');
    type('Notes', '  Cherry blossom ');
    submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Japan in spring',
      description: 'Cherry blossom',
      status: 'PLANNED',
      startDate: '2027-04-01',
      endDate: '2027-04-14',
      travellerIds: ['a', 'b'],
    });
  });

  it('sends empty notes as null, and who was chosen', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<TripForm travellers={TRAVELLERS} onSubmit={onSubmit} />);
    type(/^Title/, 'Weekend');
    type(/^From/, '2026-06-06');
    type(/^To/, '2026-06-07');
    fireEvent.click(screen.getByText('Alex'));
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'COMPLETED' } });
    submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({
      title: 'Weekend',
      description: null,
      status: 'COMPLETED',
      startDate: '2026-06-06',
      endDate: '2026-06-07',
      travellerIds: ['a'],
    });
  });

  it('asks for the day it starts and the day it ends (the "Welcome home" email goes the day after)', () => {
    const onSubmit = vi.fn();
    render(<TripForm onSubmit={onSubmit} />);
    expect(screen.getByLabelText(/^From/).required).toBe(true);
    expect(screen.getByLabelText(/^To/).required).toBe(true);
    type(/^Title/, 'Someday');
    submit();
    expect(screen.getByRole('alert').textContent).toBe('Give the trip the day it starts and the day it ends.');
    type(/^From/, '2027-05-01');
    submit();
    expect(screen.getByRole('alert').textContent).toBe('Give the trip the day it starts and the day it ends.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('asks for a title first', () => {
    const onSubmit = vi.fn();
    render(<TripForm onSubmit={onSubmit} />);
    type(/^Title/, '   ');
    submit();
    expect(screen.getByRole('alert').textContent).toBe('Give the trip a title.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('refuses a trip that ends before it starts', () => {
    const onSubmit = vi.fn();
    render(<TripForm onSubmit={onSubmit} />);
    type(/^Title/, 'Backwards');
    type(/^From/, '2027-05-10');
    type(/^To/, '2027-05-01');
    expect(screen.getByLabelText(/^To/).getAttribute('min')).toBe('2027-05-10');
    submit();
    expect(screen.getByRole('alert').textContent).toBe('The trip ends before it starts.');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('says why a save failed and lets it be tried again', async () => {
    const onSubmit = vi.fn().mockRejectedValueOnce(Object.assign(new Error('x'), { friendlyMessage: 'The server is busy.' }));
    render(<TripForm onSubmit={onSubmit} />);
    type(/^Title/, 'Again');
    type(/^From/, '2027-05-01');
    type(/^To/, '2027-05-02');
    submit();
    expect((await screen.findByRole('alert')).textContent).toBe('The server is busy.');
    expect(screen.getByText('Create trip').closest('button').disabled).toBe(false);
  });

  it('falls back to its own words when the error has none', async () => {
    render(<TripForm onSubmit={vi.fn().mockRejectedValue(new Error('x'))} />);
    type(/^Title/, 'Again');
    type(/^From/, '2027-05-01');
    type(/^To/, '2027-05-02');
    submit();
    expect((await screen.findByRole('alert')).textContent).toBe('The trip could not be saved.');
  });

  it('edits a trip without its travellers, with its own button and Cancel', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    const onCancel = vi.fn();
    render(
      <TripForm
        initial={{ title: 'Old', description: 'Notes', status: 'ACTIVE', startDate: '2026-01-01', endDate: '2026-01-05' }}
        travellers={TRAVELLERS}
        showTravellers={false}
        submitLabel='Save trip'
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByLabelText(/^Title/).value).toBe('Old');
    expect(screen.getByLabelText('Status').value).toBe('ACTIVE');
    expect(screen.queryByText('Charlie')).toBeNull();
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Save trip'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).not.toHaveProperty('travellerIds');
    expect(onSubmit.mock.calls[0][0].status).toBe('ACTIVE');
  });

  it('keeps the travellers already on the trip when editing', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<TripForm initial={{ title: 'T', startDate: '2026-01-01', endDate: '2026-01-02', travellerIds: ['b'] }} travellers={TRAVELLERS} onSubmit={onSubmit} />);
    expect(screen.getByText('Charlie').getAttribute('aria-pressed')).toBe('false');
    submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0].travellerIds).toEqual(['b']);
  });
});
