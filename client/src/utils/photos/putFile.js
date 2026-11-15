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
