import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminFeedbackMainContainer from '@/components/admin/feedback/AdminFeedbackMainContainer';
import FeedbackItem from '@/components/admin/feedback/FeedbackItem';
import FeedbackReportDialog from '@/components/admin/feedback/FeedbackReportDialog';
import { deleteFeedbackReport, getAdminFeedback, getFeedbackReport, updateFeedbackReport } from '@/api/feedbackApi';

vi.mock('@/api/feedbackApi', () => ({
  getAdminFeedback: vi.fn(),
  getFeedbackReport: vi.fn(),
  updateFeedbackReport: vi.fn(),
  deleteFeedbackReport: vi.fn(),
}));

const ITEM = {
  id: 'f1',
  reference: 'FB-F1000000',
  kind: 'PROBLEM',
  impact: 'BLOCKING',
  status: 'NEW',
  summary: 'Save did nothing',
  page: '/maps/m1',
  hasScreenshot: true,
  sender: { id: 'u1', name: 'Charlie' },
  createdAt: '2026-11-25T10:00:00Z',
  updatedAt: '2026-11-25T10:00:00Z',
};
const IDEA = { ...ITEM, id: 'f2', reference: 'FB-F2000000', kind: 'IDEA', impact: null, summary: 'Dark mode', hasScreenshot: false };
const REPORT = {
  ...ITEM,
  details: 'Save did nothing',
  expected: 'It saves',
  why: 'Lost my notes',
  mapId: 'm1',
  userAgent: 'Browser/1',
  context: { screen: '390×844', phone: true },
  screenshot: { url: 'https://signed/shot.webp' },
  sender: { id: 'u1', name: 'Charlie', email: 'charlie@example.test' },
  adminNotes: null,
  closedAt: null,
  updatedBy: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  getAdminFeedback.mockResolvedValue({ reports: [ITEM, IDEA], counts: { NEW: 2, DONE: 1 }, nextCursor: null });
  getFeedbackReport.mockResolvedValue({ report: REPORT });
  updateFeedbackReport.mockImplementation((id, change) => Promise.resolve({ report: { ...REPORT, ...change, updatedBy: { id: 'a', name: 'Ada' } } }));
  deleteFeedbackReport.mockResolvedValue({});
});

const press = async (el) => {
  await act(async () => {
    fireEvent.click(el);
  });
};

describe('FeedbackItem', () => {
  it('shows what it’s about, its status, words, sender, page and screenshot, and opens it', () => {
    const onOpen = vi.fn();
    render(<FeedbackItem report={ITEM} onOpen={onOpen} />);
    const item = screen.getByLabelText('FB-F1000000: Something’s not working');
    expect(item.textContent).toContain('Stops them');
    expect(item.textContent).toContain('New');
    expect(item.textContent).toContain('Save did nothing');
    expect(item.textContent).toContain('Charlie');
    expect(item.textContent).toContain('/maps/m1');
    expect(item.textContent).toContain('Screenshot');
    fireEvent.click(screen.getByLabelText('Open FB-F1000000'));
    expect(onOpen).toHaveBeenCalledWith(ITEM);
  });
});

describe('AdminFeedbackMainContainer', () => {
  it('lists the new reports first, with each status’s count, and filters by status and kind', async () => {
    const { container } = render(<AdminFeedbackMainContainer />);
    await waitFor(() => expect(container.querySelectorAll('[data-feedback-item]').length).toBe(2));
    expect(getAdminFeedback).toHaveBeenCalledWith({ status: 'NEW', kind: null });
    const filters = [...container.querySelectorAll('[data-feedback-filter]')].map((b) => b.textContent);
    expect(filters).toEqual(['All (3)', 'New (2)', 'In progress (0)', 'Done (1)', 'Won’t do (0)']);
    expect(container.querySelector('[data-feedback-filter="NEW"]').getAttribute('aria-pressed')).toBe('true');
    await press(container.querySelector('[data-feedback-filter="ALL"]'));
    expect(getAdminFeedback).toHaveBeenLastCalledWith({ status: null, kind: null });
    await act(async () => {
      fireEvent.change(container.querySelector('select'), { target: { value: 'IDEA' } });
    });
    expect(getAdminFeedback).toHaveBeenLastCalledWith({ status: null, kind: 'IDEA' });
  });

  it('loads more from the cursor', async () => {
    getAdminFeedback.mockResolvedValueOnce({ reports: [ITEM], counts: { NEW: 2 }, nextCursor: 'c1' }).mockResolvedValueOnce({ reports: [IDEA], counts: { NEW: 2 }, nextCursor: null });
    const { container } = render(<AdminFeedbackMainContainer />);
    await waitFor(() => expect(screen.getByText('Load more')).toBeTruthy());
    await press(screen.getByText('Load more'));
    expect(getAdminFeedback).toHaveBeenLastCalledWith({ status: 'NEW', kind: null, cursor: 'c1' });
    expect(container.querySelectorAll('[data-feedback-item]').length).toBe(2);
    expect(screen.queryByText('Load more')).toBeNull();
  });

  it('says when there’s nothing new, or why the list didn’t load', async () => {
    getAdminFeedback.mockResolvedValueOnce({ reports: [], counts: {}, nextCursor: null });
    const { unmount } = render(<AdminFeedbackMainContainer />);
    await waitFor(() => expect(screen.getByText('No new feedback. All caught up.')).toBeTruthy());
    unmount();
    getAdminFeedback.mockRejectedValueOnce({ friendlyMessage: 'Admins only.' });
    render(<AdminFeedbackMainContainer />);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Admins only.'));
  });

  it('takes a report off the New list once it’s moved on, and counts it under its new status', async () => {
    const { container } = render(<AdminFeedbackMainContainer />);
    await waitFor(() => expect(container.querySelectorAll('[data-feedback-item]').length).toBe(2));
    await press(screen.getByLabelText('Open FB-F1000000'));
    await waitFor(() => expect(document.querySelector('[data-feedback-report="f1"]')).toBeTruthy());
    await act(async () => {
      fireEvent.change(document.querySelector('[data-feedback-report] select'), { target: { value: 'DONE' } });
    });
    await press(screen.getByText('Save'));
    expect(updateFeedbackReport).toHaveBeenCalledWith('f1', { status: 'DONE', adminNotes: null });
    expect(container.querySelector('[data-feedback-item="f1"]')).toBeNull();
    expect(container.querySelector('[data-feedback-filter="DONE"]').textContent).toBe('Done (2)');
    expect(container.querySelector('[data-feedback-filter="NEW"]').textContent).toBe('New (1)');
  });

  it('deletes a report, after asking', async () => {
    const { container } = render(<AdminFeedbackMainContainer />);
    await waitFor(() => expect(container.querySelectorAll('[data-feedback-item]').length).toBe(2));
    await press(screen.getByLabelText('Open FB-F1000000'));
    await waitFor(() => expect(document.querySelector('[data-feedback-report="f1"]')).toBeTruthy());
    await press(screen.getByText('Delete'));
    expect(deleteFeedbackReport).not.toHaveBeenCalled();
    await press(screen.getByText('Delete for good'));
    expect(deleteFeedbackReport).toHaveBeenCalledWith('f1');
    expect(container.querySelector('[data-feedback-item="f1"]')).toBeNull();
    expect(document.querySelector('[data-feedback-report]')).toBeNull();
    expect(container.textContent).toContain('FB-F1000000 is deleted.');
  });
});

describe('FeedbackReportDialog', () => {
  const openDialog = async () => {
    const props = { onChanged: vi.fn(), onDeleted: vi.fn(), onClose: vi.fn() };
    render(<FeedbackReportDialog reportId='f1' {...props} />);
    await waitFor(() => expect(document.querySelector('[data-feedback-report="f1"]')).toBeTruthy());
    return props;
  };

  it('shows their answers under the questions they were asked, the screenshot, who sent it and on what', async () => {
    await openDialog();
    const dialog = document.querySelector('[data-feedback-report]');
    expect(screen.getByText('What happened?')).toBeTruthy();
    expect(screen.getByText('What did you expect to happen?')).toBeTruthy();
    expect(dialog.textContent).toContain('Lost my notes');
    expect(document.querySelector('[data-feedback-screenshot]').getAttribute('src')).toBe('https://signed/shot.webp');
    const mail = [...dialog.querySelectorAll('a')].find((a) => a.textContent === 'charlie@example.test');
    expect(mail.getAttribute('href')).toBe('mailto:charlie@example.test?subject=Your%20message%20FB-F1000000');
    expect(dialog.textContent).toContain('Screen 390×844 · A phone');
    expect(dialog.textContent).toContain('Browser/1');
  });

  it('saves the status and notes together, only once something changed', async () => {
    const { onChanged } = await openDialog();
    const save = screen.getByText('Save').closest('button');
    expect(save.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Your notes'), { target: { value: '  Looking at it ' } });
    await act(async () => {
      fireEvent.change(document.querySelector('[data-feedback-report] select'), { target: { value: 'IN_PROGRESS' } });
    });
    await press(save);
    expect(updateFeedbackReport).toHaveBeenCalledWith('f1', { status: 'IN_PROGRESS', adminNotes: 'Looking at it' });
    expect(onChanged).toHaveBeenCalledWith(expect.objectContaining({ status: 'IN_PROGRESS' }));
    expect(screen.getByText('Saved.')).toBeTruthy();
    expect(screen.getByText('Last changed by Ada')).toBeTruthy();
  });

  it('says why a save failed', async () => {
    updateFeedbackReport.mockRejectedValue({ friendlyMessage: 'Choose one of the statuses.' });
    await openDialog();
    fireEvent.change(screen.getByLabelText('Your notes'), { target: { value: 'x' } });
    await press(screen.getByText('Save'));
    expect(screen.getByRole('alert').textContent).toBe('Choose one of the statuses.');
  });

  it('says why a report couldn’t be loaded', async () => {
    getFeedbackReport.mockRejectedValue({ friendlyMessage: 'That report couldn’t be found.' });
    render(<FeedbackReportDialog reportId='gone' onChanged={vi.fn()} onDeleted={vi.fn()} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('That report couldn’t be found.'));
  });
});
