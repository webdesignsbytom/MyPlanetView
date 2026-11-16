import React, { useId, useState } from 'react';
// Components
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import GoalProgressBar from './GoalProgressBar';
// Utils
import { goalFraction, goalName, goalProgressText, goalState, goalStateText, goalStillToGo, listNames } from '@/utils/achievements/goals';

const STILL_TO_GO_NAMED = 6;

/**
 * One goal as a paper tag: what it asks, how far it has got (the words, and a bar), its
 * deadline, and for a bucket list or a region the places still to go. A reached goal
 * wears a "Reached" stamp, a missed one says so. Editors (`onEdit`, `onDelete`) change or
 * remove it; deleting asks first.
 */
function GoalCard({ goal, onEdit, onDelete }) {
  const nameId = useId();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const state = goalState(goal);
  const toGo = state === 'reached' ? [] : goalStillToGo(goal, splitUk);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onDelete(goal.id);
    } catch (err) {
      setError(err.friendlyMessage || 'The goal could not be deleted.');
      setDeleting(false);
    }
  };

  return (
    <li>
      <article aria-labelledby={nameId} className='grid gap-2 border-2 border-poster-brown bg-paper-cream px-3 py-2.5 shadow-paper'>
        <header className='grid grid-cols-rev items-start gap-2'>
          <h4 id={nameId} className='min-w-0 break-words font-semibold leading-snug'>
            {goalName(goal)}
          </h4>
          {state === 'reached' ? (
            <span className='-rotate-6 border-2 border-double border-poster-red px-1.5 font-travel text-xs uppercase tracking-wide text-poster-red'>
              Reached
            </span>
          ) : state === 'missed' ? (
            <span className='rotate-3 border-2 border-dashed border-poster-brown px-1.5 font-travel text-xs uppercase tracking-wide text-poster-brown'>
              Missed
            </span>
          ) : null}
        </header>
        <div className='grid gap-1'>
          <GoalProgressBar fraction={goalFraction(goal)} />
          <p className='grid grid-cols-rev gap-2 text-sm'>
            <span className='font-medium'>{goalProgressText(goal)}</span>
            <span>{goalStateText(goal)}</span>
          </p>
        </div>
        {toGo.length ? (
          <p className='text-xs'>Still to go: {listNames(toGo, STILL_TO_GO_NAMED)}</p>
        ) : null}
        {onEdit || onDelete ? (
          confirming ? (
            <div className='grid gap-2 text-sm' role='group' aria-label={`Delete ${goalName(goal)}`}>
              <p className='font-medium text-poster-red-deep'>Delete this goal?</p>
              <div className='grid grid-row gap-2'>
                <Button small danger busy={deleting} onClick={handleDelete}>
                  Yes, delete
                </Button>
                <Button small quiet onClick={() => setConfirming(false)}>
                  Keep it
                </Button>
              </div>
            </div>
          ) : (
            <div className='grid grid-row gap-2'>
              <Button small quiet onClick={() => onEdit(goal)} ariaLabel={`Edit ${goalName(goal)}`}>
                Edit
              </Button>
              <Button small danger onClick={() => setConfirming(true)} ariaLabel={`Delete ${goalName(goal)}`}>
                Delete
              </Button>
            </div>
          )
        ) : null}
        <InlineAlert>{error}</InlineAlert>
      </article>
    </li>
  );
}

export default GoalCard;
