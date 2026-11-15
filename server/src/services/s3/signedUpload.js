// What every presigned PUT signs, in both buckets: the upload's Content-Type and
// Content-Length. The browser must then send exactly that type and a body of exactly
// that many bytes, or the bucket refuses the PUT (403). Without them, a URL presigned
// for a small PNG would take any file of any size and type.
//
// How the presigner treats these headers (@aws-sdk/s3-request-presigner 3.1079,
// @smithy/signature-v4 5.6):
// - S3RequestPresigner.prepareRequest always adds `content-type` to unsignableHeaders,
//   so it's left out of the signature unless it's also in `signableHeaders`, which wins
//   (getCanonicalHeaders skips an unsignable header only when it isn't signable);
// - `content-length` is in neither list, so it's signed whenever the command sets it;
// - `cache-control` is always unsignable and never hoisted to the query, so a
//   CacheControl on the command has no effect on a presigned PUT.
// The URL's X-Amz-SignedHeaders is then `content-length;content-type;host`
// (tests/signedUpload.test.js).

/** PutObjectCommand input for a presigned upload; throws without a type and a size. */
export function signedPutInput({ bucket, key, contentType, contentLength }) {
  if (typeof contentType !== 'string' || !contentType) {
    throw new Error('A presigned upload needs its contentType.');
  }
  if (!Number.isSafeInteger(contentLength) || contentLength <= 0) {
    throw new Error('A presigned upload needs its contentLength in bytes.');
  }
  return { Bucket: bucket, Key: key, ContentType: contentType, ContentLength: contentLength };
}

/** getSignedUrl options: sign Content-Type as well (Content-Length is signed anyway). */
export const signedPutOptions = (expiresIn) => ({
  expiresIn,
  signableHeaders: new Set(['content-type']),
});
