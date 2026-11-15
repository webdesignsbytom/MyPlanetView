import React, { useState } from 'react';
// Components
import CloseStamp from '@/components/common/CloseStamp';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';

const LEVEL_BADGES = {
  DEBUG: 'tone-muted',
  INFO: 'bg-colour6/15 text-colour6',
  WARNING: 'tone-warn',
  ERROR: 'tone-danger',
  CRITICAL: 'solid-danger',
};

const STATUS_BADGES = {
  OPEN: 'tone-warn',
  ACKNOWLEDGED: 'bg-colour6/15 text-colour6',
  RESOLVED: 'bg-status-good/20 text-status-good',
  IGNORED: 'tone-muted',
};

const personLabel = (person, fallbackId) => {
  if (person) return `${person.name || '—'} <${person.email}>`;
  return fallbackId ? `${fallbackId} (deleted)` : '—';
};

function DetailRow({ label, children }) {
  return (
    <div className='grid sm:grid-cols-[9rem_1fr] gap-x-2'>
      <dt className='font-semibold text-colour9'>{label}</dt>
      <dd className='break-all'>{children ?? '—'}</dd>
    </div>
  );
}

function EventAdminItem({ event, statusOptions, busy, onStatusChange, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);

  const detailsId = `event-details-${event.id}`;
  const createdAt = event.createdAt ? new Date(event.createdAt).toLocaleString() : '';
  const hasMetadata = event.metadata != null;

  return (
    <article
      // A slip of paper in the card (dashed brown edge, like a trip's traveller fieldset)
      className='grid content-start gap-y-3 border-2 border-dashed border-poster-brown/60 bg-paper-cream px-4 py-4'
      aria-labelledby={`event-heading-${event.id}`}
      aria-busy={busy ? 'true' : 'false'}
    >
      {/* Summary */}
      <div className='grid grid-cols-[minmax(0,1fr)_auto] gap-x-2'>
        <div className='grid gap-y-1 min-w-0'>
          <div className='grid grid-row-wrap items-center gap-2 text-xs'>
            <span className={`px-2 py-0.5 rounded font-semibold ${LEVEL_BADGES[event.level] || LEVEL_BADGES.INFO}`}>
              {event.level}
            </span>
            <span className={`px-2 py-0.5 rounded ${STATUS_BADGES[event.status] || STATUS_BADGES.OPEN}`}>
              {event.status}
            </span>
            <span className='px-2 py-0.5 rounded bg-colour3 text-colour5'>{event.domain}</span>
            {event.statusCode != null && (
              <span className='px-2 py-0.5 rounded bg-colour3 text-colour5'>{event.statusCode}</span>
            )}
            <time className='text-colour5' dateTime={event.createdAt}>{createdAt}</time>
          </div>

          <h3 id={`event-heading-${event.id}`} className='font-semibold break-words'>
            {event.action}
          </h3>
          <p className={`break-words ${isOpen ? '' : 'line-clamp-2'}`}>{event.message}</p>
        </div>

        <div className='grid content-start'>
          <CloseStamp onClick={() => onDelete(event)} disabled={busy} hint='Delete event' label={`Delete event ${event.action}`} />
        </div>
      </div>

      {/* Triage + expand */}
      <div className='grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-3'>
        <label htmlFor={`event-status-${event.id}`} className='text-sm font-medium'>
          Status
        </label>
        <PlainOptionSelect
          id={`event-status-${event.id}`}
          name='status'
          value={event.status}
          onChange={(e) => onStatusChange(event, e.target.value)}
          options={statusOptions}
          disabled={busy}
          className='w-auto! py-1'
        />
        <button
          type='button'
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen ? 'true' : 'false'}
          aria-controls={detailsId}
          className='justify-self-end text-sm font-semibold text-colour6 hover:underline'
        >
          {isOpen ? 'Hide details' : 'Show details'}
        </button>
      </div>

      {/* Details */}
      {isOpen && (
        <dl id={detailsId} className='grid gap-y-1 border-t-2 border-dashed border-poster-brown/60 pt-3 text-sm'>
          <DetailRow label='Message'>{event.message}</DetailRow>
          <DetailRow label='Action'>{event.action}</DetailRow>
          <DetailRow label='Status code'>{event.statusCode}</DetailRow>
          <DetailRow label='Request'>
            {event.method || event.path ? `${event.method || ''} ${event.path || ''}`.trim() : null}
          </DetailRow>
          <DetailRow label='Request ID'>{event.requestId}</DetailRow>
          <DetailRow label='Actor'>{personLabel(event.actor, event.actorId)}</DetailRow>
          <DetailRow label='Target'>{personLabel(event.target, event.targetId)}</DetailRow>
          <DetailRow label='Event ID'>{event.id}</DetailRow>
          {hasMetadata && (
            <DetailRow label='Metadata'>
              <pre className='whitespace-pre-wrap break-all bg-colour3 rounded p-2 text-xs'>
                {JSON.stringify(event.metadata, null, 2)}
              </pre>
            </DetailRow>
          )}
          {event.stack && (
            <DetailRow label='Stack'>
              <pre className='whitespace-pre overflow-x-auto bg-colour3 rounded p-2 text-xs max-h-72'>
                {event.stack}
              </pre>
            </DetailRow>
          )}
        </dl>
      )}
    </article>
  );
}

export default EventAdminItem;
