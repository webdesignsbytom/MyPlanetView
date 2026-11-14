// Mock mode only. Photo uploads PUT their files with XHR (utils/photos/putFile.js) to
// presigned URLs. In mock mode those URLs point at MOCK_UPLOAD_ORIGIN: this keeps such
// requests in the browser (storing the file as a blob URL) and leaves every other XHR alone.
import { MOCK_UPLOAD_ORIGIN, storeUpload } from './mockAdapter';

export function installUploadInterceptor() {
  const RealXHR = window.XMLHttpRequest;

  class MockUploadXHR extends RealXHR {
    open(method, url, ...rest) {
      this.mockUploadUrl = String(url).startsWith(MOCK_UPLOAD_ORIGIN) ? String(url) : null;
      if (!this.mockUploadUrl) super.open(method, url, ...rest);
    }

    setRequestHeader(name, value) {
      if (!this.mockUploadUrl) super.setRequestHeader(name, value);
    }

    send(body) {
      if (!this.mockUploadUrl) {
        super.send(body);
        return;
      }
      storeUpload(this.mockUploadUrl, body);
      const size = body?.size || 0;
      setTimeout(() => {
        this.upload?.onprogress?.({ lengthComputable: true, loaded: size, total: size });
        Object.defineProperty(this, 'readyState', { value: 4, configurable: true });
        Object.defineProperty(this, 'status', { value: 200, configurable: true });
        this.onload?.(new ProgressEvent('load'));
      }, 200);
    }
  }

  window.XMLHttpRequest = MockUploadXHR;
}
