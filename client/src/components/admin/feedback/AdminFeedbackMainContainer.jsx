import React, { useCallback, useEffect, useId, useState } from 'react';
// Api
import { getAdminFeedback } from '@/api/feedbackApi';
// Components
import PaperCard from '@/components/common/PaperCard';
import Button from '@/components/common/Button';
import FormField from '@/components/ui/FormField';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import FeedbackItem from './FeedbackItem';
import FeedbackReportDialog from './FeedbackReportDialog';
// Utils
import { FEEDBACK_KINDS, statusFilters } from '@/utils/feedback/feedbackForm';

const KIND_OPTIONS = [{ value: 'ALL', label: 'Every kind' }, ...FEEDBACK_KINDS.map((kind) => ({ value: kind.id, label: kind.label }))];

/**
 * Feedback sent from the map (docs/API.md "Feedback"; 25 Nov 2026, the user's wish: "the admin
 * will need a page on the site where they can review and act on the reports"): the reports newest
 * first, the new ones to start with, filtered by status (each with its count) and by kind, 30 at a
 * time; each opens in FeedbackReportDialog, where its status and notes change and it can be
 * deleted. A change moves it out of the list when it no longer fits the filter.
 */
function AdminFeedbackMainContainer() {
  const uid = useId();
  const [status, setStatus] = useState('NEW');
  const [kind, setKind] = useState('ALL');
  const [reports, setReports] = useState(null);
  const [counts, setCounts] = useState({});
  const [nextCursor, setNextCursor] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [result, setResult] = useState('');

  const filters = useCallback(() => ({ status: status === 'ALL' ? null : status, kind: kind === 'ALL' ? null : kind }), [status, kind]);

  const load = useCallback(async () => {
    setLoadError(null);
    setReports(null);
    try {
      const page = await getAdminFeedback(filters());
      setReports(page.reports || []);
      setCounts(page.counts || {});
      setNextCursor(page.nextCursor || null);
    } catch (err) {
      setLoadError(err.friendlyMessage || 'The feedback couldn’t be loaded.');
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const page = await getAdminFeedback({ ...filters(), cursor: nextCursor });
      setReports((prev) => [...(prev || []), ...(page.reports || [])]);
      setCounts(page.counts || {});
      setNextCursor(page.nextCursor || null);
    } catch (err) {
      setLoadError(err.friendlyMessage || 'More feedback couldn’t be loaded.');
    } finally {
      setLoadingMore(false);
    }
  }

  // A report saved in the dialog: its new status in the counts, and in the list while it still fits
  const changed = (report) => {
    const before = (reports || []).find((r) => r.id === report.id);
    if (before && before.status !== report.status) {
      setCounts((c) => ({ ...c, [before.status]: Math.max(0, (c[before.status] || 0) - 1), [report.status]: (c[report.status] || 0) + 1 }));
    }
    const fits = status === 'ALL' || report.status === status;
    setReports((prev) =>
      fits ? (prev || []).map((r) => (r.id === report.id ? { ...r, status: report.status, updatedAt: report.updatedAt } : r)) : (prev || []).filter((r) => r.id !== report.id),
    );
    setResult(`${report.reference} is saved.`);
  };
  const deleted = (report) => {
    setReports((prev) => (prev || []).filter((r) => r.id !== report.id));
    setCounts((c) => ({ ...c, [report.status]: Math.max(0, (c[report.status] || 0) - 1) }));
    setResult(`${report.reference} is deleted.`);
    setOpenId(null);
  };

  return (
    <>
      <PaperCard
        title='Reports'
        titleId='admin-feedback-heading'
        action={
          <Button small quiet onClick={load} ariaLabel='Reload the feedback'>
            Reload
          </Button>
        }
      >
        <div className='grid gap-3 md:grid-cols-[minmax(0,1fr)_16rem] md:items-end'>
          <fieldset className='grid gap-2'>
            <legend className='mb-2 text-sm font-medium'>Show</legend>
            <div className='grid grid-row-wrap gap-2'>
              {statusFilters(counts).map((filter) => (
                <button
                  key={filter.id}
                  type='button'
                  aria-pressed={status === filter.id}
                  onClick={() => setStatus(filter.id)}
                  className={`btn-paper text-sm [--btn-leading:1.25rem] [--btn-pad-x:0.75rem] [--btn-pad-y:0.25rem] [--btn-size:1rem] ${status === filter.id ? 'border-poster-red-deep text-poster-red-deep' : ''}`}
                  data-feedback-filter={filter.id}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </fieldset>
          <FormField id={`${uid}-kind`} label='What it’s about' align='start'>
            <PlainOptionSelect value={kind} onChange={(e) => setKind(e.target.value)} options={KIND_OPTIONS} />
          </FormField>
        </div>

        <p className='min-h-5 text-center text-sm text-status-good' role='status' aria-live='polite'>
          {result}
        </p>
        <section className='grid gap-4' aria-label='List of reports' aria-busy={reports === null && !loadError ? 'true' : 'false'}>
          {loadError ? (
            <p className='text-center text-status-critical' role='alert'>
              {loadError}
            </p>
          ) : reports === null ? (
            <div className='grid place-items-center py-4'>
              <LoadingSpinner lg />
            </div>
          ) : reports.length === 0 ? (
            <p className='text-center'>{status === 'NEW' ? 'No new feedback. All caught up.' : 'No reports here.'}</p>
          ) : (
            <>
              <ul className='grid gap-3 lg:grid-cols-2'>
                {reports.map((report) => (
                  <li key={report.id} className='grid'>
                    <FeedbackItem report={report} onOpen={(r) => setOpenId(r.id)} />
                  </li>
                ))}
              </ul>
              {nextCursor ? (
                <div className='grid justify-center'>
                  <Button quiet busy={loadingMore} onClick={loadMore}>
                    Load more
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </section>
      </PaperCard>

      {openId ? <FeedbackReportDialog reportId={openId} onChanged={changed} onDeleted={deleted} onClose={() => setOpenId(null)} /> : null}
    </>
  );
}

export default AdminFeedbackMainContainer;
