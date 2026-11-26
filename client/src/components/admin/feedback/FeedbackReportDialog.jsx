import React, { useEffect, useId, useState } from 'react';
// Api
import { deleteFeedbackReport, getFeedbackReport, updateFeedbackReport } from '@/api/feedbackApi';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import FormField from '@/components/ui/FormField';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import TextAreaInput from '@/components/ui/TextAreaInput';
// Utils
import {
  FEEDBACK_LIMITS,
  FEEDBACK_STATUSES,
  contextWords,
  feedbackKind,
  impactLabel,
  kindLabel,
  sentWords,
} from '@/utils/feedback/feedbackForm';

// One answer of the report, under the question its sender was asked
function Answer({ question, children }) {
  if (!children) return null;
  return (
    <div className='grid gap-1'>
      <h3 className='text-sm font-semibold text-colour9'>{question}</h3>
      <p className='whitespace-pre-line break-words text-sm'>{children}</p>
    </div>
  );
}

/**
 * A whole report for an admin (docs/API.md "Feedback"): the sender's answers under the questions
 * they were asked, the screenshot (a signed link, opened full size in a new tab), who sent it
 * (their address a mailto link, to reply), where and on what; then its status and the admin's
 * notes, saved together, and deleting it (asked first; the screenshot goes too).
 * `onChanged(report)` after a save, `onDeleted(report)` once it's gone.
 */
function FeedbackReportDialog({ reportId, onChanged, onDeleted, onClose }) {
  const uid = useId();
  const [report, setReport] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [status, setStatus] = useState('NEW');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    let live = true;
    getFeedbackReport(reportId).then(
      ({ report: loaded }) => {
        if (!live) return;
        setReport(loaded);
        setStatus(loaded.status);
        setNotes(loaded.adminNotes || '');
      },
      (err) => live && setLoadError(err.friendlyMessage || 'The report couldn’t be loaded.'),
    );
    return () => {
      live = false;
    };
  }, [reportId]);

  const kind = report ? feedbackKind(report.kind) : null;
  const changed = report && (status !== report.status || notes.trim() !== (report.adminNotes || ''));

  async function save() {
    setBusy(true);
    setError(null);
    setSaved('');
    try {
      const { report: updated } = await updateFeedbackReport(report.id, { status, adminNotes: notes.trim() || null });
      setReport(updated);
      setNotes(updated.adminNotes || '');
      setSaved('Saved.');
      onChanged(updated);
    } catch (err) {
      setError(err.friendlyMessage || 'The report couldn’t be saved.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await deleteFeedbackReport(report.id);
      onDeleted(report);
    } catch (err) {
      setError(err.friendlyMessage || 'The report couldn’t be deleted.');
      setBusy(false);
    }
  }

  const title = report ? `${report.reference}: ${kindLabel(report.kind)}` : 'Feedback';

  return (
    <Modal title={title} onClose={onClose} wide>
      {loadError ? (
        <InlineAlert>{loadError}</InlineAlert>
      ) : !report ? (
        <div className='grid place-items-center py-6'>
          <LoadingSpinner lg />
        </div>
      ) : (
        <div className='grid gap-4' data-feedback-report={report.id}>
          <p className='text-xs opacity-80'>
            Sent {sentWords(report.createdAt)}
            {report.page ? ` from ${report.page}` : ''}
            {report.impact ? ` · ${impactLabel(report.impact)}` : ''}
          </p>

          <Answer question={kind?.details.label || 'Their message'}>{report.details}</Answer>
          <Answer question={kind?.expected?.label || 'What they expected'}>{report.expected}</Answer>
          <Answer question={kind?.why?.label || 'Why it matters'}>{report.why}</Answer>

          {report.screenshot ? (
            <div className='grid gap-1'>
              <h3 className='text-sm font-semibold text-colour9'>Their screenshot</h3>
              <a href={report.screenshot.url} target='_blank' rel='noopener noreferrer' className='grid' aria-label='Open the screenshot full size (opens in a new tab)'>
                <img src={report.screenshot.url} alt='The screenshot sent with the report' className='max-h-96 w-full border-2 border-poster-brown bg-field object-contain' data-feedback-screenshot />
              </a>
            </div>
          ) : null}

          <div className='grid gap-1 text-sm'>
            <h3 className='font-semibold text-colour9'>Who sent it</h3>
            <p>
              {report.sender?.name || 'An account that’s gone'}
              {report.sender?.email ? (
                <>
                  {' · '}
                  <a href={`mailto:${report.sender.email}?subject=${encodeURIComponent(`Your message ${report.reference}`)}`} className='underline underline-offset-2'>
                    {report.sender.email}
                  </a>
                </>
              ) : null}
            </p>
            {report.mapId ? <p className='text-xs opacity-80'>Map {report.mapId}</p> : null}
            {contextWords(report.context).length ? <p className='text-xs opacity-80'>{contextWords(report.context).join(' · ')}</p> : null}
            {report.userAgent ? <p className='break-words text-xs opacity-80'>{report.userAgent}</p> : null}
          </div>

          <div className='grid gap-3 border-t-2 border-dashed border-poster-brown/50 pt-3'>
            <FormField id={`${uid}-status`} label='Status' align='start'>
              <PlainOptionSelect
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={FEEDBACK_STATUSES.map((s) => ({ value: s.id, label: s.label }))}
              />
            </FormField>
            <FormField id={`${uid}-notes`} label='Your notes' hint='Only admins see these.' align='start'>
              <TextAreaInput value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={FEEDBACK_LIMITS.adminNotes} />
            </FormField>
            {report.updatedBy ? <p className='text-xs opacity-80'>Last changed by {report.updatedBy.name}</p> : null}
            <InlineAlert>{error}</InlineAlert>
            <p className='min-h-5 text-sm text-status-good' role='status' aria-live='polite'>
              {saved}
            </p>
            {confirmDelete ? (
              <div className='grid gap-2' role='group' aria-label='Delete this report?'>
                <p className='text-sm'>Delete this report and its screenshot for good?</p>
                <div className='grid grid-row justify-end gap-2'>
                  <Button quiet onClick={() => setConfirmDelete(false)}>
                    Keep it
                  </Button>
                  <Button danger busy={busy} onClick={remove}>
                    Delete for good
                  </Button>
                </div>
              </div>
            ) : (
              <div className='grid grid-row justify-end gap-2'>
                <Button danger disabled={busy} onClick={() => setConfirmDelete(true)}>
                  Delete
                </Button>
                <Button busy={busy} disabled={!changed} onClick={save}>
                  Save
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

export default FeedbackReportDialog;
