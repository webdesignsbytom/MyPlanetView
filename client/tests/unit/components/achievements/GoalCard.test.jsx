import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import GoalCard from '@/components/achievements/GoalCard';
import { SplitUkProvider } from '@/hooks/useSplitUk';

const card = (goal, props = {}, splitUk = false) =>
  render(
    <SplitUkProvider value={splitUk}>
      <ul>
        <GoalCard goal={goal} {...props} />
      </ul>
    </SplitUkProvider>,
  );

const COUNT = { id: 'g-1', kind: 'COUNTRY_COUNT', target: 10, progress: { have: 4, need: 10 } };

describe('GoalCard', () => {
  it('shows what the goal asks, how far it has got and its deadline', () => {
    const { container } = card({ ...COUNT, deadline: '2027-12-31' });
    expect(container.querySelector('h4').textContent).toBe('10 countries');
    expect(screen.getByText('4 of 10 countries')).toBeTruthy();
    expect(screen.getByText('By 31 Dec 2027')).toBeTruthy();
    expect(container.querySelector('span[style]').style.width).toBe('40%');
    expect(container.querySelector('article').getAttribute('aria-labelledby')).toBe(container.querySelector('h4').id);
  });

  it('stamps a reached goal and lists nothing still to go', () => {
    card({ id: 'g-2', kind: 'COUNTRY_LIST', countryCodes: ['JP', 'PE'], achievedAt: '2026-03-12', progress: { have: 2, need: 2, done: ['JP', 'PE'] } });
    expect(screen.getByText('Reached')).toBeTruthy();
    expect(screen.getByText('Reached 12 Mar 2026')).toBeTruthy();
    expect(screen.queryByText(/Still to go/)).toBeNull();
  });

  it('says a goal was missed', () => {
    card({ ...COUNT, deadline: '2026-01-01', progress: { have: 4, need: 10, missed: true } });
    expect(screen.getByText('Missed')).toBeTruthy();
    expect(screen.getByText('Missed: the deadline was 1 Jan 2026')).toBeTruthy();
  });

  it('names the places a bucket list still needs', () => {
    card({ id: 'g-3', kind: 'COUNTRY_LIST', countryCodes: ['JP', 'PE', 'IS'], progress: { have: 1, need: 3, done: ['PE'] } });
    expect(screen.getByText('Still to go: Japan and Iceland')).toBeTruthy();
    expect(screen.getByText('1 of 3 places')).toBeTruthy();
  });

  it('lists a region’s places as the map has them: the UK’s nations on a split map', () => {
    const goal = { id: 'g-4', kind: 'REGION', region: 'british-isles', progress: { have: 1, need: 5, done: ['IE'] } };
    card(goal, {}, true);
    expect(screen.getByText('Still to go: England, Scotland, Wales and Northern Ireland')).toBeTruthy();
  });

  it('has no buttons for viewers', () => {
    card(COUNT);
    expect(screen.queryByText('Edit')).toBeNull();
    expect(screen.queryByText('Delete')).toBeNull();
  });

  it('edits the goal', () => {
    const onEdit = vi.fn();
    card(COUNT, { onEdit, onDelete: vi.fn() });
    fireEvent.click(screen.getByLabelText('Edit 10 countries'));
    expect(onEdit).toHaveBeenCalledWith(COUNT);
  });

  it('asks before deleting, and can keep it', () => {
    const onDelete = vi.fn();
    card(COUNT, { onEdit: vi.fn(), onDelete });
    fireEvent.click(screen.getByLabelText('Delete 10 countries'));
    expect(screen.getByText('Delete this goal?')).toBeTruthy();
    expect(screen.getByRole('group').getAttribute('aria-label')).toBe('Delete 10 countries');
    fireEvent.click(screen.getByText('Keep it'));
    expect(screen.queryByText('Delete this goal?')).toBeNull();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('deletes it once confirmed', async () => {
    const onDelete = vi.fn().mockResolvedValue();
    card(COUNT, { onEdit: vi.fn(), onDelete });
    fireEvent.click(screen.getByLabelText('Delete 10 countries'));
    fireEvent.click(screen.getByText('Yes, delete'));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('g-1'));
  });

  it('says why a delete failed and lets it be tried again', async () => {
    const onDelete = vi.fn().mockRejectedValue(Object.assign(new Error('no'), { friendlyMessage: 'Not now.' }));
    card(COUNT, { onEdit: vi.fn(), onDelete });
    fireEvent.click(screen.getByLabelText('Delete 10 countries'));
    fireEvent.click(screen.getByText('Yes, delete'));
    expect((await screen.findByText('Not now.')).getAttribute('role')).toBe('alert');
    expect(screen.getByText('Yes, delete').closest('button').disabled).toBe(false);
  });
});
