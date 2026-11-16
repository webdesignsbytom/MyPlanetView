import React from 'react';
// Icons
import { FaDownload } from 'react-icons/fa';
// Utils
import { PART_MAX_BYTES, formatBytes } from '@/utils/photos/photoDownload';

const plural = (n, one, many = `${one}s`) => `${n.toLocaleString('en-GB')} ${n === 1 ? one : many}`;

/**
 * What "Print or download" (PrintDownloadDialog) will give: how many photos and how big,
 * which copies they are, and what's left out. `list` is the dialog's ready list
 * (photoDownload.js zipEntries), `parts` the zips it comes as.
 */
function PrintDownloadSummary({ list, parts, streamToDisk }) {
  const { files, videos, missing, totalBytes, unknownSizes } = list;
  const prints = files.filter((f) => f.copy === 'PRINT').length;
  const originals = files.length - prints;
  const size = !totalBytes ? '' : unknownSizes ? `, at least ${formatBytes(totalBytes)}` : `, ${formatBytes(totalBytes)}`;

  if (!files.length) {
    return (
      <div className='grid gap-2 text-sm'>
        <p>There are no photos to download here yet.</p>
        {videos ? <p>Videos aren’t included in downloads.</p> : null}
      </div>
    );
  }

  return (
    <div className='grid gap-2 text-sm'>
      <p className='grid grid-cols-reg items-center gap-2 font-travel text-lg uppercase leading-tight tracking-wide text-poster-brown'>
        <FaDownload aria-hidden='true' />
        <span>
          {plural(files.length, 'photo')}
          {size}
        </span>
      </p>
      {originals ? (
        <p>
          {prints ? plural(originals, 'photo is an original', 'photos are originals') : 'They’re the originals'}, as uploaded.
          Originals still hold where each photo was taken, so think before passing the files on.
        </p>
      ) : null}
      {prints ? (
        <p>
          {originals ? plural(prints, 'photo is a print copy', 'photos are print copies') : 'They’re print copies'}, as Economy
          keeps: sharp in prints up to about A4, with the location taken out.
        </p>
      ) : null}
      {videos ? <p>{plural(videos, 'video')} {videos === 1 ? 'isn’t' : 'aren’t'} included: videos play on the map but can’t be downloaded.</p> : null}
      {missing ? <p>{plural(missing, 'photo has', 'photos have')} no copy kept to download.</p> : null}
      <p className='opacity-80'>
        The zip is made on this device: the photos come straight from our storage to you.
        {streamToDisk
          ? ' You choose where to save it.'
          : parts.length > 1
            ? ` This browser holds each zip in memory until it’s saved, so it comes as ${parts.length} zip files of up to ${formatBytes(PART_MAX_BYTES)}: download them one at a time.`
            : ''}
      </p>
    </div>
  );
}

export default PrintDownloadSummary;
