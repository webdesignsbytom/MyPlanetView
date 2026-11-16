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
// A video's own steps (utils/photos/uploadVideo.js)
const VIDEO_STAGE_LABELS = {
  ...STAGE_LABELS,
  reading: 'Reading the video',
  cleaning: 'Taking out the location',
  poster: 'Making the poster frame',
};

const MB = 1024 * 1024;
// Big uploads (videos) also say how far they've got in megabytes
const BIG_UPLOAD_BYTES = 20 * MB;
const megabytes = (bytes) => Math.round(bytes / MB).toLocaleString('en-GB');

// One file in the upload list: where it's got to, and why it failed if it did.
function PhotoUploadItem({ item }) {
  const percent = Math.round((item.progress || 0) * 100);
  const labels = item.video ? VIDEO_STAGE_LABELS : STAGE_LABELS;
  const big = item.total > BIG_UPLOAD_BYTES;
  return (
    <li className='grid gap-1 text-sm'>
      <div className='grid grid-cols-rev gap-2'>
        <span className='truncate font-medium'>{item.name}</span>
        <span className={item.stage === 'failed' ? 'text-status-critical' : item.stage === 'done' ? 'text-status-good' : ''}>
          {labels[item.stage]}
          {item.stage === 'uploading' ? ` ${percent}%` : ''}
          {item.stage === 'uploading' && big ? ` (${megabytes(item.sent)} of ${megabytes(item.total)} MB)` : ''}
        </span>
      </div>
      {item.stage === 'uploading' ? (
        <div className='h-1.5 overflow-hidden rounded-full bg-colour3' aria-hidden='true'>
          <div className='h-full bg-colour6 transition-[width]' style={{ width: `${percent}%` }} />
        </div>
      ) : null}
      {item.stage === 'uploading' && item.video ? (
        <p className='text-xs opacity-80'>Keep this page open until it’s added.</p>
      ) : null}
      {item.error ? <p className='text-xs text-status-critical'>{item.error}</p> : null}
      {item.stage === 'done' && item.note ? <p className='text-xs opacity-80'>{item.note}</p> : null}
    </li>
  );
}

export default PhotoUploadItem;
