import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PhotoThemeLine from '@/components/themes/PhotoThemeLine';
import { enterPhotoInTheme, getThemes, takePhotoOutOfTheme } from '@/api/themesApi';

vi.mock('@/api/themesApi', () => ({ enterPhotoInTheme: vi.fn(), getThemes: vi.fn(), takePhotoOutOfTheme: vi.fn() }));

const RUNNING = { id: 'th-11', title: 'Worst weather', month: '2026-11' };
const PAST = { id: 'th-10', title: 'Doors', month: '2026-10', running: false };

describe('PhotoThemeLine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getThemes.mockResolvedValue({ current: RUNNING });
  });

  it('shows nothing for a viewer when the photo is in no theme', () => {
    const { container } = render(<PhotoThemeLine photo={{ id: 'p-1' }} />);
    expect(container.innerHTML).toBe('');
    expect(getThemes).not.toHaveBeenCalled();
  });

  it('lists the themes the photo is in', () => {
    render(<PhotoThemeLine photo={{ id: 'p-1', themes: [PAST, { ...RUNNING, running: true }] }} />);
    const section = screen.getByLabelText('Monthly themes');
    expect(section.textContent).toContain('In October’s theme: Doors');
    expect(section.textContent).toContain('In this month’s theme: Worst weather');
    expect(screen.queryByText(/Enter it/)).toBeNull();
  });

  it('lets an editor enter it in this month’s theme', async () => {
    enterPhotoInTheme.mockResolvedValue({ themes: [RUNNING] });
    const onChanged = vi.fn();
    render(<PhotoThemeLine photo={{ id: 'p-1', themes: [] }} canEdit onChanged={onChanged} />);
    fireEvent.click(await screen.findByText('Enter it in this month’s theme: Worst weather'));
    await waitFor(() => expect(onChanged).toHaveBeenCalledWith({ id: 'p-1', themes: [RUNNING] }));
    expect(enterPhotoInTheme).toHaveBeenCalledWith('p-1', 'th-11');
  });

  it('lets an editor take it out again', async () => {
    takePhotoOutOfTheme.mockResolvedValue({ themes: [] });
    const onChanged = vi.fn();
    render(<PhotoThemeLine photo={{ id: 'p-1', themes: [RUNNING] }} canEdit onChanged={onChanged} />);
    fireEvent.click(await screen.findByText('Take it out of “Worst weather”'));
    await waitFor(() => expect(onChanged).toHaveBeenCalledWith({ id: 'p-1', themes: [] }));
    expect(takePhotoOutOfTheme).toHaveBeenCalledWith('p-1', 'th-11');
  });

  it('says why it didn’t work', async () => {
    enterPhotoInTheme.mockRejectedValue(Object.assign(new Error('no'), { friendlyMessage: 'This map has entered 20.' }));
    render(<PhotoThemeLine photo={{ id: 'p-1' }} canEdit />);
    fireEvent.click(await screen.findByText(/Enter it in this month’s theme/));
    expect((await screen.findByRole('alert')).textContent).toBe('This map has entered 20.');
  });

  it('offers nothing when no theme runs', async () => {
    getThemes.mockResolvedValue({ current: null });
    const { container } = render(<PhotoThemeLine photo={{ id: 'p-1' }} canEdit />);
    await waitFor(() => expect(getThemes).toHaveBeenCalled());
    expect(container.innerHTML).toBe('');
  });
});
