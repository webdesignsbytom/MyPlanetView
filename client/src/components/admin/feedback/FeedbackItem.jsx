import React from 'react';
// Components
import Button from '@/components/common/Button';
// Utils
import { STATUS_TONE, impactLabel, kindLabel, sentWords, statusLabel } from '@/utils/feedback/feedbackForm';

// One report on the admin's list: what it's about, its status, the start of its words, who sent
// it, from which page and when, and a button to open it
function FeedbackItem({ report, onOpen }) {
  const impact = report.kind === 'PROBLEM' ? impactLabel(report.impact) : null;
  return (
    <article className='ticket-edge grid gap-2 bg-paper-cream px-4 py-3 text-colour4' aria-label={`${report.reference}: ${kindLabel(report.kind)}`} data-feedback-item={report.id}>
      <p className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-xs font-semibold uppercase tracking-wide text-colour9'>
        <span>
          {kindLabel(report.kind)}
          {impact ? ` · ${impact}` : ''}
        </span>
        <span className={`rounded-full border px-2 py-0.5 normal-case ${STATUS_TONE[report.status] || 'tone-muted'}`}>{statusLabel(report.status)}</span>
      </p>
      <p className='whitespace-pre-line break-words text-sm'>{report.summary}</p>
      <p className='text-xs opacity-80'>
        {report.reference} · {report.sender?.name || 'Someone'} · {sentWords(report.createdAt)}
        {report.page ? ` · ${report.page}` : ''}
        {report.hasScreenshot ? ' · Screenshot' : ''}
      </p>
      <div className='grid grid-row-wrap gap-2'>
        <Button small quiet onClick={() => onOpen(report)} ariaLabel={`Open ${report.reference}`}>
          Open
        </Button>
      </div>
    </article>
  );
}

export default FeedbackItem;
