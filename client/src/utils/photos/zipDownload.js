// Making the zip in the browser (docs/API.md, "Downloads"): each best copy is fetched
// from its signed link and streamed into a zip (client-zip: stored, not compressed, as
// photos don't compress), so the server does no work. Where the browser has a save
// dialog that writes to disk as the zip is made (showSaveFilePicker: Chrome and Edge on
// a computer), any size goes in one file; elsewhere the zip is held in memory until it's
// saved, so the dialog cuts big downloads into parts (photoDownload.js splitIntoParts).
import { LINK_FRESH_MS, relistPage } from './photoDownload';

/** Can this browser write the zip straight to disk? */
export const canStreamToDisk = () => typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function';

/**
 * Ask where to save, while the click's user activation lasts (call it before any await).
 * -> a writable stream, or null when the person closed the dialog. Throws only when the
 * browser can't (the caller then falls back to holding the zip in memory).
 */
export async function pickZipFile(suggestedName) {
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName,
      types: [{ description: 'Zip file', accept: { 'application/zip': ['.zip'] } }],
    });
    return await handle.createWritable();
  } catch (err) {
    if (err?.name === 'AbortError') return null;
    throw err;
  }
}

/** Counts the bytes going through, for the progress line. */
const countingStream = (onBytes) =>
  new TransformStream({
    transform(chunk, controller) {
      onBytes(chunk.byteLength);
      controller.enqueue(chunk);
    },
  });

// Files asked for ahead of the one being zipped, so the next ones are on their way
const LOOKAHEAD = 3;

/**
 * Fetch one file, listing its page again first when the links may have run out, and once
 * more after a failure (a link that ran out answers 403). Never throws.
 * -> the Response, or null (it couldn't be fetched, or the download was stopped).
 */
async function fetchFile(file, { scope, pages, signal }) {
  const pageInfo = pages[file.page];
  const fresh = async () => {
    if (!pageInfo) return false;
    const best = (await relistPage(scope, pageInfo)).get(file.id);
    if (best?.url) file.url = best.url;
    return Boolean(best?.url);
  };
  try {
    if (pageInfo && Date.now() - pageInfo.listedAt > LINK_FRESH_MS && !(await fresh())) return null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const res = await fetch(file.url, { signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
        if (res.ok && res.body) return res;
      } catch {
        // A network failure, or a link refused without CORS headers: try once more
      }
      if (signal?.aborted || (attempt === 0 && !(await fresh()))) return null;
    }
  } catch {
    // The list couldn't be read again
  }
  return null;
}

/**
 * Zip `files` (photoDownload.js zipEntries) into `writable` (pickZipFile), or into a Blob
 * that's then saved as `fileName`. `onProgress({ done, bytes })` after each file and as
 * bytes arrive. -> `{ failed: [file names] }`: files that couldn't be fetched are left out.
 */
export async function saveZip({ files, fileName, writable = null, scope, pages, signal, onProgress }) {
  const { makeZip } = await import('client-zip');
  const failed = [];
  let done = 0;
  let bytes = 0;
  const report = () => onProgress?.({ done, bytes });

  async function* entries() {
    const queue = [];
    let next = 0;
    const fill = () => {
      while (queue.length < LOOKAHEAD && next < files.length) {
        const file = files[next];
        next += 1;
        queue.push({ file, response: fetchFile(file, { scope, pages, signal }) });
      }
    };
    fill();
    while (queue.length) {
      const { file, response } = queue.shift();
      const res = await response;
      if (signal?.aborted) return;
      fill();
      if (!res) {
        failed.push(file.name);
        done += 1;
        report();
        continue;
      }
      const body = res.body.pipeThrough(
        countingStream((n) => {
          bytes += n;
          report();
        })
      );
      yield { input: body, name: file.name, lastModified: file.lastModified };
      done += 1;
      report();
    }
  }

  const zip = makeZip(entries(), { buffersAreUTF8: true });
  if (writable) {
    try {
      await zip.pipeTo(writable, { signal });
    } catch (err) {
      // pipeTo aborts the file on failure; a stopped download leaves nothing half-written
      if (signal?.aborted) throw new DOMException('Stopped', 'AbortError');
      throw err;
    }
  } else {
    const blob = await new Response(zip).blob();
    if (signal?.aborted) throw new DOMException('Stopped', 'AbortError');
    saveBlob(blob, fileName);
  }
  return { failed };
}

/** Hand a Blob to the browser's downloads, then let it go. */
function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.append(link);
  link.click();
  link.remove();
  // Long enough for the browser to start reading it
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
