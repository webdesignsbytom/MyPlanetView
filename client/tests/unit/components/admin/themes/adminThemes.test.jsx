import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import AdminThemesMainContainer from '@/components/admin/themes/AdminThemesMainContainer';
import ThemeEditDialog from '@/components/admin/themes/ThemeEditDialog';
import ThemeDeleteDialog from '@/components/admin/themes/ThemeDeleteDialog';
import ThemeItem from '@/components/admin/themes/ThemeItem';
import { createTheme, deleteTheme, forgetThemes, getAdminThemes, updateTheme } from '@/api/themesApi';

vi.mock('@/api/themesApi', () => ({
  getAdminThemes: vi.fn(),
  createTheme: vi.fn(),
  updateTheme: vi.fn(),
  deleteTheme: vi.fn(),
  forgetThemes: vi.fn(),
}));

const NOV = { id: 't1', month: '2026-11', title: 'Worst weather', blurb: 'Rain!', running: true, entryCount: 3, mapCount: 2 };
const DEC = { id: 't2', month: '2026-12', title: 'Doors', blurb: null, entryCount: 0, mapCount: 0 };
const OCT = { id: 't0', month: '2026-10', title: 'Bridges', ended: true, entryCount: 1, mapCount: 1 };

beforeEach(() => {
  // Only the date is fake: 15 November 2026
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-15T12:00:00Z'));
  for (const fn of [getAdminThemes, createTheme, updateTheme, deleteTheme, forgetThemes]) fn.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

const press = async (el) => {
  await act(async () => {
    fireEvent.click(el);
  });
};

describe('ThemeItem', () => {
  it('shows the month, state, title, blurb and what it drew, and can’t be deleted once entered in', () => {
    const onEdit = vi.fn();
    render(<ThemeItem theme={NOV} onEdit={onEdit} onDelete={() => {}} />);
    const item = screen.getByLabelText('November 2026: Worst weather');
    expect(item.textContent).toContain('Running now');
    expect(item.textContent).toContain('Rain!');
    expect(item.textContent).toContain('3 photos entered on 2 maps');
    fireEvent.click(screen.getByLabelText('Change Worst weather'));
    expect(onEdit).toHaveBeenCalledWith(NOV);
    expect(screen.queryByLabelText('Delete Worst weather')).toBeNull();
  });

  it('can be deleted while nothing is entered; says Coming and Ended', () => {
    const onDelete = vi.fn();
    render(
      <>
        <ThemeItem theme={DEC} onEdit={() => {}} onDelete={onDelete} />
        <ThemeItem theme={OCT} onEdit={() => {}} onDelete={() => {}} />
      </>,
    );
    expect(screen.getByLabelText('December 2026: Doors').textContent).toContain('Coming');
    expect(screen.getByLabelText('December 2026: Doors').textContent).toContain('No photos entered');
    expect(screen.getByLabelText('October 2026: Bridges').textContent).toContain('Ended');
    expect(screen.getByLabelText('October 2026: Bridges').textContent).toContain('1 photo entered on 1 map');
    const del = screen.getByLabelText('Delete Doors');
    expect(del.className).toContain('btn-danger');
    fireEvent.click(del);
    expect(onDelete).toHaveBeenCalledWith(DEC);
  });
});

describe('ThemeEditDialog', () => {
  const open = (props = {}) => {
    const onSaved = vi.fn();
    const onClose = vi.fn();
    render(<ThemeEditDialog onSaved={onSaved} onClose={onClose} {...props} />);
    return { onSaved, onClose };
  };

  it('makes a new theme for the month chosen', async () => {
    createTheme.mockResolvedValue({ theme: { ...DEC, id: 'new' } });
    const { onSaved } = open({ month: '2027-01' });
    expect(screen.getByText('New theme')).toBeTruthy();
    expect(document.getElementById('new-theme-month').value).toBe('2027-01');
    fireEvent.change(document.getElementById('new-theme-title'), { target: { value: '  Street   food ' } });
    fireEvent.change(document.getElementById('new-theme-blurb'), { target: { value: 'Snacks.' } });
    await press(screen.getByText('Make theme'));
    expect(createTheme).toHaveBeenCalledWith({ month: '2027-01', title: 'Street food', blurb: 'Snacks.' });
    expect(onSaved).toHaveBeenCalledWith({ ...DEC, id: 'new' });
  });

  it('says what each field needs, by the form’s rules', async () => {
    open({ month: '2026-09' });
    await press(screen.getByText('Make theme'));
    expect(document.getElementById('new-theme-month-error').textContent).toBe('Choose this month or a later one.');
    expect(document.getElementById('new-theme-title-error').textContent).toBe('Give it a title.');
    fireEvent.change(document.getElementById('new-theme-month'), { target: { value: '' } });
    expect(document.getElementById('new-theme-month-error')).toBeNull();
    await press(screen.getByText('Make theme'));
    expect(document.getElementById('new-theme-month-error').textContent).toBe('Choose a month (YYYY-MM).');
    expect(createTheme).not.toHaveBeenCalled();
  });

  it('changes a theme, sending only what changed; a month with entries stays', async () => {
    updateTheme.mockResolvedValue({ theme: { ...NOV, title: 'Wettest weather' } });
    const { onSaved } = open({ theme: NOV });
    expect(screen.getByText('Change “Worst weather”')).toBeTruthy();
    const month = document.getElementById('edit-theme-month');
    expect(month.disabled).toBe(true);
    expect(document.getElementById('edit-theme-month-hint').textContent).toBe('Photos are entered in it, so its month stays.');
    fireEvent.change(document.getElementById('edit-theme-title'), { target: { value: 'Wettest weather' } });
    await press(screen.getByText('Save changes'));
    expect(updateTheme).toHaveBeenCalledWith('t1', { title: 'Wettest weather' });
    expect(onSaved).toHaveBeenCalledWith({ ...NOV, title: 'Wettest weather' });
  });

  it('shows the server’s refusal, and cancels', async () => {
    createTheme.mockRejectedValue(Object.assign(new Error('x'), { friendlyMessage: 'That month has a theme.' }));
    const { onClose, onSaved } = open({ month: '2027-02' });
    fireEvent.change(document.getElementById('new-theme-title'), { target: { value: 'Doors' } });
    await press(screen.getByText('Make theme'));
    expect(screen.getByText('That month has a theme.').getAttribute('role')).toBe('alert');
    expect(onSaved).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('ThemeDeleteDialog', () => {
  it('deletes the theme, saying its month will have none', async () => {
    deleteTheme.mockResolvedValue({});
    const onDeleted = vi.fn();
    render(<ThemeDeleteDialog theme={DEC} onDeleted={onDeleted} onClose={() => {}} />);
    expect(screen.getByText('Delete “Doors”?')).toBeTruthy();
    expect(screen.getByText('December 2026 will have no theme until you write another.')).toBeTruthy();
    await press(screen.getByText('Delete theme'));
    expect(deleteTheme).toHaveBeenCalledWith('t2');
    expect(onDeleted).toHaveBeenCalledWith(DEC);
  });

  it('keeps it on a refusal or "Keep it"', async () => {
    deleteTheme.mockRejectedValue(new Error('x'));
    const onClose = vi.fn();
    render(<ThemeDeleteDialog theme={DEC} onDeleted={() => {}} onClose={onClose} />);
    await press(screen.getByText('Delete theme'));
    expect(screen.getByText('The theme couldn’t be deleted.')).toBeTruthy();
    fireEvent.click(screen.getByText('Keep it'));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('AdminThemesMainContainer', () => {
  it('lists the coming year’s empty months first, then every theme', async () => {
    getAdminThemes.mockResolvedValue({ themes: [DEC, NOV] });
    render(<AdminThemesMainContainer />);
    const gaps = await screen.findByLabelText('Months with no theme');
    const months = [...gaps.querySelectorAll('li')].map((li) => li.textContent);
    // November and December are taken; the twelve months from now are November 2026 to October 2027
    expect(months[0]).toBe('January 2027');
    expect(months.at(-1)).toBe('October 2027');
    expect(months.length).toBe(10);
    const list = screen.getByLabelText('List of themes');
    expect(within(list).getByLabelText('December 2026: Doors')).toBeTruthy();
    expect(within(list).getByLabelText('November 2026: Worst weather')).toBeTruthy();
  });

  it('says when every month is taken, and when there are no themes at all', async () => {
    getAdminThemes.mockResolvedValue({ themes: [] });
    const { unmount } = render(<AdminThemesMainContainer />);
    expect(await screen.findByText('No themes yet. Write the first above.')).toBeTruthy();
    unmount();
    const year = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(Date.UTC(2026, 10 + i, 1));
      return { id: `y${i}`, month: d.toISOString().slice(0, 7), title: `Theme ${i}`, entryCount: 0 };
    });
    getAdminThemes.mockResolvedValue({ themes: year });
    render(<AdminThemesMainContainer />);
    expect(await screen.findByText('Every month of the coming year has a theme.')).toBeTruthy();
  });

  it('says why when the themes can’t be loaded, and reloads', async () => {
    getAdminThemes.mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce({ themes: [NOV] });
    render(<AdminThemesMainContainer />);
    expect((await screen.findByText('The themes couldn’t be loaded.')).getAttribute('role')).toBe('alert');
    await press(screen.getByLabelText('Reload the themes and their counts'));
    expect(screen.getByLabelText('November 2026: Worst weather')).toBeTruthy();
  });

  it('writes a theme for an empty month and puts it in the list', async () => {
    getAdminThemes.mockResolvedValue({ themes: [NOV] });
    createTheme.mockResolvedValue({ theme: { ...DEC, title: 'Lights' } });
    render(<AdminThemesMainContainer />);
    await press(await screen.findByLabelText('Write a theme for December 2026'));
    const dialog = document.querySelector('[role="dialog"]');
    expect(document.getElementById('new-theme-month').value).toBe('2026-12');
    fireEvent.change(document.getElementById('new-theme-title'), { target: { value: 'Lights' } });
    await press(within(dialog).getByText('Make theme'));
    expect(forgetThemes).toHaveBeenCalled();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(screen.getByText('Lights is saved for December 2026.')).toBeTruthy();
    expect(screen.getByLabelText('December 2026: Lights')).toBeTruthy();
    // gone from the empty months
    expect(screen.queryByLabelText('Write a theme for December 2026')).toBeNull();
  });

  it('“New theme” starts on the first empty month', async () => {
    getAdminThemes.mockResolvedValue({ themes: [NOV] });
    render(<AdminThemesMainContainer />);
    await screen.findByLabelText('Months with no theme');
    fireEvent.click(screen.getByText('New theme'));
    expect(document.getElementById('new-theme-month').value).toBe('2026-12');
  });

  it('deletes a theme from the list', async () => {
    getAdminThemes.mockResolvedValue({ themes: [DEC, NOV] });
    deleteTheme.mockResolvedValue({});
    render(<AdminThemesMainContainer />);
    fireEvent.click(await screen.findByLabelText('Delete Doors'));
    await press(screen.getByText('Delete theme'));
    expect(screen.getByText('Doors is deleted.')).toBeTruthy();
    expect(screen.queryByLabelText('December 2026: Doors')).toBeNull();
  });
});
