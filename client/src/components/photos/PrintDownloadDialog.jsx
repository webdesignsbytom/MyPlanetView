import React, { useEffect, useMemo, useRef, useState } from 'react';
// Components
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import PrintDownloadSummary from './PrintDownloadSummary';
import PrintDownloadPart from './PrintDownloadPart';
import PrintPartnerOffers from './PrintPartnerOffers';
// Utils
import { PART_MAX_BYTES, listDownloadFiles, splitIntoParts, zipEntries, zipFileName } from '@/utils/photos/photoDownload';
import { canStreamToDisk, pickZipFile, saveZip } from '@/utils/photos/zipDownload';

// The progress line changes at most this often while bytes stream in
const PROGRESS_EVERY_MS = 250;
const plural = (n, one, many = `${one}s`) => `${n.toLocaleString('en-GB')} ${n === 1 ? one : many}`;

/**
 * "Print or download" (docs/API.md, "Downloads"; docs/FEATURE-PLAN.md, "Printing"): the
 * scope's best copies (the originals, or an Economy map's print copies) as a zip made in
 * this browser, then the print partners. It lists the photos first and says what's coming
 * (how many, how big, which copies, what's left out); a big download in a browser that
 * can't write to disk as it goes comes as parts, each its own button. Closing it stops a
 * download in progress. Props: PrintDownload's.
 */
function PrintDownloadDialog({ scope, title, byCountry = false, onClose }) {
  const { mapId, tripId, country } = scope;
  // The list's filters, the same object for the same scope (the list effect depends on it)
  const filters = useMemo(() => ({ mapId, tripId, country }), [mapId, tripId, country]);
  const [list, setList] = useState({ status: 'loading', found: 0 });
  const [attempt, setAttempt] = useState(0);
  const [run, setRun] = useState(null);
  const [results, setResults] = useState({});
  const stopRef = useRef(null);
  // A dialog opened by a click, never pre-rendered: the browser can be asked here
  const streamToDisk = useMemo(() => canStreamToDisk(), []);

  useEffect(() => {
    const controller = new AbortController();
    setList({ status: 'loading', found: 0 });
    listDownloadFiles(filters, {
      signal: controller.signal,
      onProgress: (found) => setList((prev) => (prev.status === 'loading' ? { ...prev, found } : prev)),
    })
      .then(({ photos, pages }) => {
        if (!controller.signal.aborted) setList({ status: 'ready', pages, ...zipEntries(photos, { byCountry }) });
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setList({ status: 'error', error: err.friendlyMessage || 'The list of photos couldn’t be loaded.' });
        }
      });
    return () => controller.abort();
  }, [filters, byCountry, attempt]);

  // Closing the dialog stops a download in progress
  useEffect(() => () => stopRef.current?.abort(), []);

  const parts = useMemo(() => {
    if (list.status !== 'ready' || !list.files.length) return [];
    return streamToDisk ? [list.files] : splitIntoParts(list.files, PART_MAX_BYTES);
  }, [list, streamToDisk]);

  const save = async (index) => {
    const files = parts[index];
    const fileName = zipFileName(title, index + 1, parts.length);
    let writable = null;
    if (streamToDisk) {
      // Asked first, while the click still counts as the person's own
      try {
        writable = await pickZipFile(fileName);
        if (!writable) return;
      } catch {
        writable = null;
      }
    }
    const controller = new AbortController();
    stopRef.current = controller;
    const totalBytes = files.reduce((sum, f) => sum + (f.bytes ?? 0), 0);
    setRun({ index, done: 0, bytes: 0, count: files.length, totalBytes });
    setResults((prev) => ({ ...prev, [index]: null }));
    let shownAt = 0;
    try {
      const { failed } = await saveZip({
        files,
        fileName,
        writable,
        scope: filters,
        pages: list.pages,
        signal: controller.signal,
        onProgress: ({ done, bytes }) => {
          const now = Date.now();
          if (done < files.length && now - shownAt < PROGRESS_EVERY_MS) return;
          shownAt = now;
          setRun((prev) => (prev ? { ...prev, done, bytes } : prev));
        },
      });
      setResults((prev) => ({ ...prev, [index]: { state: 'saved', fileName, failed } }));
    } catch {
      setResults((prev) => ({
        ...prev,
        [index]: controller.signal.aborted ? { state: 'stopped' } : { state: 'failed' },
      }));
    } finally {
      if (stopRef.current === controller) stopRef.current = null;
      setRun(null);
    }
  };

  return (
    <Modal title={`Print or download: ${title}`} onClose={onClose}>
      {list.status === 'loading' ? (
        <div className='grid justify-items-center gap-2 py-4' role='status'>
          <LoadingSpinner md />
          <span className='text-sm'>{list.found ? `Listing the photos… ${list.found.toLocaleString('en-GB')} so far` : 'Listing the photos…'}</span>
        </div>
      ) : null}

      {list.status === 'error' ? (
        <div className='grid justify-items-start gap-3'>
          <InlineAlert>{list.error}</InlineAlert>
          <Button quiet onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </Button>
        </div>
      ) : null}

      {list.status === 'ready' ? (
        <PrintDownloadSummary list={list} parts={parts} streamToDisk={streamToDisk} />
      ) : null}

      {parts.length ? (
        <div className='grid gap-3'>
          {parts.map((files, index) => (
            <PrintDownloadPart
              key={index}
              label={parts.length > 1 ? `Download part ${index + 1} of ${parts.length}` : 'Download the zip'}
              detail={parts.length > 1 ? `${plural(files.length, 'photo')}` : null}
              run={run?.index === index ? run : null}
              result={results[index]}
              disabled={Boolean(run)}
              onSave={() => save(index)}
              onStop={() => stopRef.current?.abort()}
            />
          ))}
        </div>
      ) : null}

      {list.status === 'ready' ? <PrintPartnerOffers /> : null}
    </Modal>
  );
}

export default PrintDownloadDialog;
