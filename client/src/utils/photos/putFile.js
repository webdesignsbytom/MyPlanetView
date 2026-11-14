// PUT a file to a presigned storage URL, reporting progress. Plain XHR rather than the
// API client: the URL is the bucket's, it needs no cookies, and XHR reports upload progress.
export function putFile(url, blob, contentType, onProgress) {
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
