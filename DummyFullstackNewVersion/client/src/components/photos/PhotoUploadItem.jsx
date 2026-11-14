import React from 'react';

const STAGE_LABELS = {
  waiting: 'Waiting',
  reading: 'Reading the date and place',
  resizing: 'Making the copies',
  uploading: 'Uploading',
  saving: 'Saving',
  done: 'Added',
  failed: 'Not added',
};

// One file in the upload list: where it's got to, and why it failed if it did.
function PhotoUploadItem({ item }) {
  const percent = Math.round((item.progress || 0) * 100);
  return (
    <li className='grid gap-1 text-sm'>
      <div className='grid grid-cols-rev gap-2'>
        <span className='truncate font-medium'>{item.name}</span>
        <span className={item.stage === 'failed' ? 'text-status-critical' : item.stage === 'done' ? 'text-status-good' : ''}>
          {STAGE_LABELS[item.stage]}
          {item.stage === 'uploading' ? ` ${percent}%` : ''}
        </span>
      </div>
      {item.stage === 'uploading' ? (
        <div className='h-1.5 overflow-hidden rounded-full bg-colour3' aria-hidden='true'>
          <div className='h-full bg-colour6 transition-[width]' style={{ width: `${percent}%` }} />
        </div>
      ) : null}
      {item.error ? <p className='text-xs text-status-critical'>{item.error}</p> : null}
      {item.stage === 'done' && item.note ? <p className='text-xs opacity-80'>{item.note}</p> : null}
    </li>
  );
}

export default PhotoUploadItem;
