import React from 'react';
// Icons
import { FaDownload } from 'react-icons/fa';
// Components
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
// Utils
import { formatBytes } from '@/utils/photos/photoDownload';

// A finished zip names at most this many of the photos it left out
const FAILED_NAMES_SHOWN = 5;

const plural = (n, one, many = `${one}s`) => `${n.toLocaleString('en-GB')} ${n === 1 ? one : many}`;

/**
 * One zip of "Print or download" (PrintDownloadDialog): its button, then its progress
 * while it's made (`run`: `{ done, count, bytes, totalBytes }`), or how it went (`result`).
 */
function PrintDownloadPart({ label, detail, run, result, disabled, onSave, onStop }) {
  if (run) {
    return (
      <div className='grid gap-2 rounded-md border-2 border-dashed border-poster-brown/60 px-3 py-3'>
        <progress
          max={run.count}
          value={run.done}
          aria-label={label}
          className='h-3 w-full accent-poster-red-deep'
        />
        <p className='text-sm'>
          {run.done.toLocaleString('en-GB')} of {plural(run.count, 'photo')}
          {run.bytes ? ` · ${formatBytes(run.bytes)}${run.totalBytes ? ` of ${formatBytes(run.totalBytes)}` : ''}` : ''}
        </p>
        <p className='text-xs opacity-80'>Keep this open until it’s saved.</p>
        <div className='grid justify-items-start'>
          <Button quiet small onClick={onStop}>
            Stop
          </Button>
        </div>
      </div>
    );
  }

  const failedNames = result?.failed ?? [];
  return (
    <div className='grid gap-2'>
      <div className='grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3'>
        <Button onClick={onSave} disabled={disabled}>
          <FaDownload aria-hidden='true' className='self-center text-sm' />
          <span>{result?.state === 'saved' ? `${label} again` : label}</span>
        </Button>
        {detail ? <span className='text-sm opacity-80'>{detail}</span> : null}
      </div>
      {result?.state === 'saved' ? (
        <InlineAlert tone='good'>
          Saved {result.fileName}.
          {failedNames.length
            ? ` ${plural(failedNames.length, 'photo')} couldn’t be fetched and ${failedNames.length === 1 ? 'isn’t' : 'aren’t'} in it: ${failedNames
                .slice(0, FAILED_NAMES_SHOWN)
                .join(', ')}${failedNames.length > FAILED_NAMES_SHOWN ? ` and ${failedNames.length - FAILED_NAMES_SHOWN} more` : ''}.`
            : ''}
        </InlineAlert>
      ) : null}
      {result?.state === 'stopped' ? <InlineAlert tone='info'>Stopped. Nothing was saved.</InlineAlert> : null}
      {result?.state === 'failed' ? (
        <InlineAlert>The zip couldn’t be made: the connection may have dropped. Try again.</InlineAlert>
      ) : null}
    </div>
  );
}

export default PrintDownloadPart;
