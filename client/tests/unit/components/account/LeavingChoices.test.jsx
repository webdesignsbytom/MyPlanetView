import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import LeavingChoices from '@/components/account/LeavingChoices';

const OPTIONS = {
  maps: [
    {
      id: 'm1',
      name: 'Family',
      members: [
        { userId: 'u2', name: 'Alex', role: 'EDITOR' },
        { userId: 'u3', name: '', role: 'CO_OWNER' },
      ],
    },
    { id: 'm2', name: 'Solo', members: [] },
  ],
  photosOnOtherMaps: 3,
};

const open = (props = {}) => {
  const onChoose = vi.fn();
  const onLeavePhotosChange = vi.fn();
  const view = render(
    <LeavingChoices
      options={OPTIONS}
      choices={{ m1: 'u2' }}
      onChoose={onChoose}
      leavePhotos
      onLeavePhotosChange={onLeavePhotosChange}
      {...props}
    />,
  );
  return { onChoose, onLeavePhotosChange, ...view };
};

describe('LeavingChoices', () => {
  it('offers each map with people on it to one of them, or deleting it', () => {
    open();
    const select = screen.getByLabelText('“Family”');
    expect(select.value).toBe('u2');
    expect(select.getAttribute('title')).toBe('Give to Alex (editor)');
    const labels = [...select.querySelectorAll('option')].map((o) => [o.value, o.textContent]);
    expect(labels).toEqual([
      ['u2', 'Give to Alex (editor)'],
      ['u3', 'Give to someone on it (co-owner)'],
      ['DELETE', 'Delete it'],
    ]);
  });

  it('says a map with nobody else on it goes with the account', () => {
    open();
    expect(screen.getByText('“Solo” will be deleted with your account, as nobody else is on it.')).toBeTruthy();
    expect(screen.queryByLabelText('“Solo”')).toBeNull();
  });

  it('shows "Delete it" when nothing is chosen', () => {
    open({ choices: {} });
    expect(screen.getByLabelText('“Family”').value).toBe('DELETE');
  });

  it('passes the choice up', () => {
    const { onChoose } = open();
    fireEvent.change(screen.getByLabelText('“Family”'), { target: { value: 'DELETE' } });
    expect(onChoose).toHaveBeenCalledWith('m1', 'DELETE');
  });

  it('leaves the photos on other maps when ticked, and says how many', () => {
    const { onLeavePhotosChange } = open();
    const box = screen.getByLabelText('Leave my photos on maps shared with me');
    expect(box.checked).toBe(true);
    expect(screen.getByText(/You added 3 photos to other people’s maps/)).toBeTruthy();
    fireEvent.click(box);
    expect(onLeavePhotosChange).toHaveBeenCalledWith(false);
  });

  it('says when no photos were added to other maps', () => {
    open({ options: { ...OPTIONS, photosOnOtherMaps: 0 }, leavePhotos: false });
    expect(screen.getByLabelText('Leave my photos on maps shared with me').checked).toBe(false);
    expect(screen.getByText('You haven’t added photos to other people’s maps.')).toBeTruthy();
  });

  it('has no maps part when the account owns none', () => {
    const { container } = open({ options: { maps: [], photosOnOtherMaps: 0 } });
    expect(container.querySelector('fieldset')).toBeNull();
    expect(screen.queryByText('Your maps')).toBeNull();
  });

  it('locks everything while the account is being deleted', () => {
    const { container } = open({ disabled: true });
    expect(container.querySelector('fieldset').disabled).toBe(true);
    expect(screen.getByLabelText('Leave my photos on maps shared with me').disabled).toBe(true);
  });
});
