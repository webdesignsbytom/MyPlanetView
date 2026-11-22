import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import GoalForm from '@/components/achievements/GoalForm';

const open = (props = {}) => {
  const onSave = props.onSave || vi.fn().mockResolvedValue();
  const onCancel = vi.fn();
  const view = render(<GoalForm onSave={onSave} onCancel={onCancel} {...props} />);
  return { ...view, onSave, onCancel, form: view.container.querySelector('form') };
};

const submit = (form) => fireEvent.submit(form);

// The country pickers have a couple of hundred options: label lookups only
describe('GoalForm', { timeout: 20000 }, () => {
  it('opens on a new goal with its first field focused', () => {
    const { form } = open();
    expect(form.getAttribute('aria-label')).toBe('New goal');
    const kind = screen.getByLabelText('What kind of goal');
    expect(document.activeElement).toBe(kind);
    expect(kind.value).toBe('COUNTRY_COUNT');
    expect(screen.getByLabelText(/How many countries/)).toBeTruthy();
    expect(screen.getByText('Add goal')).toBeTruthy();
  });

  it('refuses a count that isn’t a whole number in range', () => {
    const { form, onSave } = open();
    submit(form);
    expect(screen.getByRole('alert').textContent).toBe('Say how many countries: a whole number from 1 to 250.');
    fireEvent.change(screen.getByLabelText(/How many countries/), { target: { value: '2.5' } });
    submit(form);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('sends a new count goal with its kind, a null name and deadline when left empty', async () => {
    const { form, onSave } = open();
    fireEvent.change(screen.getByLabelText(/How many countries/), { target: { value: '30' } });
    submit(form);
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ kind: 'COUNTRY_COUNT', target: 30, title: null, deadline: null }));
  });

  it('keeps a name and a deadline', async () => {
    const { form, onSave } = open();
    fireEvent.change(screen.getByLabelText(/How many countries/), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Name it (optional)'), { target: { value: 'Five by forty' } });
    fireEvent.change(screen.getByLabelText('Deadline (optional)'), { target: { value: '2030-06-01' } });
    submit(form);
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ kind: 'COUNTRY_COUNT', target: 5, title: 'Five by forty', deadline: '2030-06-01' }));
  });

  it('asks for stamps on a landmark goal, with its own deadline hint and limit', () => {
    const { form } = open();
    fireEvent.change(screen.getByLabelText('What kind of goal'), { target: { value: 'LANDMARK_COUNT' } });
    expect(screen.getByLabelText(/How many stamps/)).toBeTruthy();
    expect(screen.getByText(/only stamps whose photo was taken by the end of that day count/)).toBeTruthy();
    submit(form);
    expect(screen.getByRole('alert').textContent).toBe('Say how many stamps: a whole number from 1 to 2,000.');
  });

  it('wants at least one place on a bucket list', async () => {
    const { form, onSave } = open({ wantToGo: ['JP'] });
    fireEvent.change(screen.getByLabelText('What kind of goal'), { target: { value: 'COUNTRY_LIST' } });
    submit(form);
    expect(screen.getByRole('alert').textContent).toBe('Add at least one place to the list.');
    fireEvent.click(screen.getByText(/Add your “want to go” countries/));
    submit(form);
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ kind: 'COUNTRY_LIST', countryCodes: ['JP'], title: null, deadline: null }));
  });

  it('wants a region or continent for a region goal', async () => {
    const { form, onSave } = open();
    fireEvent.change(screen.getByLabelText('What kind of goal'), { target: { value: 'REGION' } });
    submit(form);
    expect(screen.getByRole('alert').textContent).toBe('Choose a region or a continent.');
    fireEvent.change(screen.getByLabelText(/Which region or continent/), { target: { value: 'benelux' } });
    submit(form);
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ kind: 'REGION', region: 'benelux', title: null, deadline: null }));
  });

  it('changing a goal keeps its kind and sends only what changed', async () => {
    const goal = { id: 'g-1', kind: 'COUNTRY_COUNT', target: 10, title: 'Ten', deadline: null };
    const { form, onSave } = open({ goal });
    expect(form.getAttribute('aria-label')).toBe('Change the goal');
    expect(screen.queryByLabelText('What kind of goal')).toBeNull();
    expect(screen.getByText('A number of countries')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Name it (optional)'), { target: { value: 'Ten at last' } });
    fireEvent.click(screen.getByText('Save goal'));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ title: 'Ten at last' }));
  });

  it('shows the server’s refusal and stays open', async () => {
    const onSave = vi.fn().mockRejectedValue(Object.assign(new Error('no'), { friendlyMessage: 'This map has 50 goals.' }));
    const { form } = open({ onSave });
    fireEvent.change(screen.getByLabelText(/How many countries/), { target: { value: '3' } });
    submit(form);
    expect((await screen.findByRole('alert')).textContent).toBe('This map has 50 goals.');
    expect(screen.getByText('Add goal').closest('button').disabled).toBe(false);
  });

  it('cancels', () => {
    const { onCancel } = open();
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});
