// "Download my data" (docs/API.md, "Your data"): asks the server for each part (the account,
// each map you own and its photos a page at a time, your photos on other people's maps) and
// joins them into one JSON file, saved by the browser. One answer would be too big for the
// host on a big map, hence the parts.
import { getExportAccount, getExportMap, getExportMapPhotos, getExportUploads } from '@/api/dataExportApi';

/** Every page of a paged list, joined. `onPage(count)` after each page. */
async function allPages(fetchPage, onPage) {
  const photos = [];
  let cursor = null;
  do {
    const page = await fetchPage(cursor);
    photos.push(...(page.photos || []));
    onPage?.(photos.length);
    cursor = page.nextCursor || null;
  } while (cursor);
  return photos;
}

/**
 * Build the whole file's contents. `onProgress(words)` says where it's got to, in a
 * sentence ("Map 1 of 2: 500 photos so far").
 */
export async function buildDataExport({ onProgress } = {}) {
  onProgress?.('Your account');
  const file = await getExportAccount();
  const owned = file.mapsYouOwn || [];
  const maps = [];
  for (const [index, summary] of owned.entries()) {
    const label = `Map ${index + 1} of ${owned.length}`;
    onProgress?.(label);
    const { map } = await getExportMap(summary.id);
    const photos = await allPages(
      (cursor) => getExportMapPhotos(summary.id, cursor),
      (count) => onProgress?.(`${label}: ${count.toLocaleString('en-GB')} photos so far`),
    );
    maps.push({ ...map, photos });
  }
  onProgress?.('Your photos on other people’s maps');
  const photosOnOtherMaps = file.photosOnOtherMaps ? await allPages(getExportUploads) : [];
  return { ...file, maps, photosOnOtherMaps };
}

/** "my-planet-view-data-2026-11-16.json", by the day it was made. */
export const dataExportFileName = (exportedAt) => `my-planet-view-data-${String(exportedAt || new Date().toISOString()).slice(0, 10)}.json`;

/** Hand the browser a JSON file to save. */
export function saveJsonFile(contents, fileName) {
  const blob = new Blob([JSON.stringify(contents, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Long enough for the browser to start the download
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
