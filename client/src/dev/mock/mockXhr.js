// Mock mode only. Two kinds of upload go out with XHR and are kept in the browser here,
// leaving every other XHR alone:
// - photos PUT their files (utils/photos/putFile.js) to presigned URLs on
//   MOCK_UPLOAD_ORIGIN. Like the real bucket, it refuses (403) a PUT whose Content-Type or
//   size isn't the signed one (./uploads.js);
// - videos go to the mock Cloudflare Stream on MOCK_STREAM_ORIGIN as tus does it
//   (tus-js-client: HEAD, then PATCHes; ./stream.js), which refuses a video that still
//   holds a location.
import { MOCK_UPLOAD_ORIGIN } from './mockAdapter';
import { receiveMockUpload } from './uploads';
import { MOCK_STREAM_ORIGIN, answerTus } from './stream';

const ANSWER_AFTER_MS = 200;

export function installUploadInterceptor() {
  const RealXHR = window.XMLHttpRequest;

  class MockUploadXHR extends RealXHR {
    open(method, url, ...rest) {
      const href = String(url);
      this.mockKind = href.startsWith(MOCK_UPLOAD_ORIGIN) ? 'bucket' : href.startsWith(MOCK_STREAM_ORIGIN) ? 'stream' : null;
      this.mockUrl = this.mockKind ? href : null;
      this.mockMethod = String(method).toUpperCase();
      this.mockHeaders = {};
      this.mockResponseHeaders = {};
      if (!this.mockKind) super.open(method, url, ...rest);
    }

    setRequestHeader(name, value) {
      if (!this.mockKind) {
        super.setRequestHeader(name, value);
        return;
      }
      this.mockHeaders[String(name).toLowerCase()] = String(value);
    }

    getResponseHeader(name) {
      if (!this.mockKind) return super.getResponseHeader(name);
      const wanted = String(name).toLowerCase();
      const found = Object.entries(this.mockResponseHeaders).find(([key]) => key.toLowerCase() === wanted);
      return found ? found[1] : null;
    }

    get responseText() {
      return this.mockKind ? '' : super.responseText;
    }

    send(body) {
      if (!this.mockKind) {
        super.send(body);
        return;
      }
      const size = body?.size || 0;
      const answer = (status, headers = {}) =>
        setTimeout(() => {
          if (status >= 200 && status < 300 && size) this.upload?.onprogress?.({ lengthComputable: true, loaded: size, total: size });
          this.mockResponseHeaders = headers;
          Object.defineProperty(this, 'readyState', { value: 4, configurable: true });
          Object.defineProperty(this, 'status', { value: status, configurable: true });
          this.onload?.(new ProgressEvent('load'));
        }, ANSWER_AFTER_MS);
      if (this.mockKind === 'bucket') {
        receiveMockUpload(this.mockUrl, body, this.mockHeaders['content-type'] ?? null).then(answer, () => answer(500));
        return;
      }
      answerTus(this.mockMethod, this.mockUrl, this.mockHeaders, body).then(
        ({ status, headers }) => answer(status, headers),
        () => answer(500),
      );
    }
  }

  window.XMLHttpRequest = MockUploadXHR;
}
