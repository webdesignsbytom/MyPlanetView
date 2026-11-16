// PUT a file to a presigned storage URL, reporting progress. Plain XHR rather than the
// API client: the URL is the bucket's, it needs no cookies, and XHR reports upload progress.
// The URL is signed for one Content-Type and one size (docs/API.md): this sends exactly
// `contentType`, and the browser sets Content-Length from the blob, which must be the
// `bytes` the presign declared, or the bucket refuses the PUT (403).
export function putFile(url, blob, contentType, onProgress, bytes = blob.size) {
  if (blob.size !== bytes) {
    return Promise.reject(new Error('The file changed before it could be uploaded. Please choose it again.'));
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`The upload was refused (${xhr.status}).`));
    xhr.onerror = () => reject(new Error('The upload failed. Check your connection and try again.'));
    xhr.send(blob);
  });
}

/**
 * PUT each of an upload's files (`[{ size, blob, contentType, bytes }]`) to its presigned
 * address (`uploads`, the presign's answer), one after another, reporting the whole
 * upload's progress as `onProgress(fraction, { sent, total })` in bytes. -> `{ [size]: key }`
 */
export async function putFiles(files, uploads, onProgress) {
  const total = files.reduce((sum, f) => sum + f.bytes, 0);
  const sent = {};
  const report = () => {
    const done = Object.values(sent).reduce((a, b) => a + b, 0);
    onProgress?.(total ? done / total : 1, { sent: done, total });
  };
  const keys = {};
  for (const f of files) {
    const target = uploads.find((u) => u.size === f.size);
    if (!target) throw new Error('The server didn’t give an upload address for this file.');
    keys[f.size] = target.key;
    await putFile(
      target.url,
      f.blob,
      f.contentType,
      (loaded) => {
        sent[f.size] = loaded;
        report();
      },
      f.bytes,
    );
    sent[f.size] = f.bytes;
    report();
  }
  return keys;
}
