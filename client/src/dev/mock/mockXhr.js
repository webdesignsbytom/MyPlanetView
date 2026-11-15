// Mock mode only. Uploads PUT their files with XHR (utils/photos/putFile.js) to presigned
// URLs. In mock mode those URLs point at MOCK_UPLOAD_ORIGIN: this keeps such requests in
// the browser (storing the file as a blob URL) and leaves every other XHR alone. Like the
// real bucket, it refuses (403) a PUT whose Content-Type or size isn't the signed one.
import { MOCK_UPLOAD_ORIGIN } from './mockAdapter';
import { receiveMockUpload } from './uploads';

export function installUploadInterceptor() {
  const RealXHR = window.XMLHttpRequest;

  class MockUploadXHR extends RealXHR {
    open(method, url, ...rest) {
      this.mockUploadUrl = String(url).startsWith(MOCK_UPLOAD_ORIGIN) ? String(url) : null;
      this.mockContentType = null;
      if (!this.mockUploadUrl) super.open(method, url, ...rest);
    }

    setRequestHeader(name, value) {
      if (!this.mockUploadUrl) {
        super.setRequestHeader(name, value);
        return;
      }
      if (String(name).toLowerCase() === 'content-type') this.mockContentType = String(value);
    }

    send(body) {
      if (!this.mockUploadUrl) {
        super.send(body);
        return;
      }
      const status = receiveMockUpload(this.mockUploadUrl, body, this.mockContentType);
      const size = body?.size || 0;
      setTimeout(() => {
        if (status === 200) this.upload?.onprogress?.({ lengthComputable: true, loaded: size, total: size });
        Object.defineProperty(this, 'readyState', { value: 4, configurable: true });
        Object.defineProperty(this, 'status', { value: status, configurable: true });
        this.onload?.(new ProgressEvent('load'));
      }, 200);
    }
  }

  window.XMLHttpRequest = MockUploadXHR;
}
