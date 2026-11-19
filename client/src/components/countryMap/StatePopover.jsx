import React, { useEffect, useLayoutEffect, useRef } from 'react';
// Components
import CloseStamp from '@/components/common/CloseStamp';
// Utils
import { VISIT_STATUSES, VISIT_STATUS_LABELS } from '@/utils/map/visitStatus';

const MARGIN = 8;
const CHOICES = [...VISIT_STATUSES, { value: null, label: 'Not yet' }];

/**
 * A state pressed on a country's own map (CountryMapView): a luggage-tag card beside the
 * press with its name and how the map stands with it. Editors (`canEdit`) mark it with one
 * of four stamps (the pressed one is the current status); `onChange(status)`, null clears.
 * Kept on the screen; Escape (CountryMapView) or its close stamp shuts it, and focus goes to
 * its first stamp when it opens.
 */
function StatePopover({ name, status, x, y, canEdit, onChange, onClose }) {
  const boxRef = useRef(null);

  // Beside the press, never off the screen
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const left = Math.min(Math.max(MARGIN, x + 12), window.innerWidth - box.offsetWidth - MARGIN);
    const top = Math.min(Math.max(MARGIN, y + 12), window.innerHeight - box.offsetHeight - MARGIN);
    box.style.left = `${left}px`;
    box.style.top = `${top}px`;
  }, [x, y, name]);

  useEffect(() => {
    boxRef.current?.querySelector('button[aria-pressed]')?.focus({ preventScroll: true });
  }, [name]);

  return (
    <div
      ref={boxRef}
      role='dialog'
      aria-label={name}
      data-state-popover=''
      className='ticket-edge paper-aged fixed z-30 grid w-64 gap-3 p-3 text-poster-ink'
    >
      <div className='grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2'>
        <p className='break-words font-travel text-lg uppercase leading-tight tracking-wide text-colour6'>{name}</p>
        <CloseStamp label={`Close ${name}`} onClick={onClose} />
      </div>
      {canEdit ? (
        <div className='grid grid-cols-2 gap-2' role='group' aria-label={`Been to ${name}?`}>
          {CHOICES.map((choice) => {
            const on = (status ?? null) === choice.value;
            return (
              <button
                key={choice.label}
                type='button'
                aria-pressed={on}
                onClick={() => {
                  if (!on) onChange(choice.value);
                  onClose();
                }}
                className={`${on ? 'btn-poster' : 'btn-paper'} justify-center text-center [--btn-pad-x:0.5rem] [--btn-pad-y:0.25rem] [--btn-size:0.875rem]`}
              >
                {choice.label}
              </button>
            );
          })}
        </div>
      ) : (
        <p className='text-sm font-medium'>{status ? VISIT_STATUS_LABELS[status] : 'Not been yet'}</p>
      )}
    </div>
  );
}

export default StatePopover;
