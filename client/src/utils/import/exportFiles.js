// The files of a download, however it was chosen: the zip itself (zipReader.js), or the folder
// it was unzipped to (an <input webkitdirectory>, each File with its webkitRelativePath).
// -> `[{ path, size, read() -> Promise<Blob> }]`, paths with forward slashes
import { readZipEntries } from './zipReader';

const isZip = (file) => /\.zip$/i.test(file.name) || file.type === 'application/zip' || file.type === 'application/x-zip-compressed';

export async function exportFiles(chosen) {
  const files = [...(chosen || [])];
  if (files.length === 1 && isZip(files[0])) return readZipEntries(files[0]);
  return files.map((file) => ({
    path: (file.webkitRelativePath || file.name).split('\\').join('/'),
    size: file.size,
    read: async () => file,
  }));
}
