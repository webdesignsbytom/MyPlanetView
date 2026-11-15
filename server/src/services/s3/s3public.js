import 'dotenv/config';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { signedPutInput, signedPutOptions } from './signedUpload.js';

const s3 = new S3Client({
  region: process.env.STORAGE_REGION,
  endpoint: process.env.STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY,
    secretAccessKey: process.env.STORAGE_SECRET_KEY,
  },
  forcePathStyle: true, // Path-style URLs (Hetzner, R2, MinIO)
  // SDK 3.729+ otherwise puts a CRC32 checksum of an EMPTY body into every presigned
  // PUT URL (x-amz-checksum-crc32=AAAAAA==), so the browser's real upload fails the
  // check. Cloudflare's R2 docs recommend WHEN_REQUIRED for these SDK versions.
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

export const PUBLIC_BUCKET = process.env.STORAGE_BUCKET || '';
if (!PUBLIC_BUCKET) {
  console.warn('[S3] STORAGE_BUCKET is empty');
}

// Public presigners

// Presign a PUT (browser upload). Signs ContentType and ContentLength (signedUpload.js):
// the PUT must send exactly `contentType` and exactly `contentLength` bytes.
export const s3PresignPut = async ({
  bucket,
  key,
  contentType,
  contentLength,       // bytes, required
  cacheControl,        // optional; the presigner never signs it, so R2 doesn't get it
  expiresIn = 600,     // 10 minutes
}) => {
  const cmd = new PutObjectCommand({
    ...signedPutInput({ bucket, key, contentType, contentLength }),
    ...(cacheControl ? { CacheControl: cacheControl } : {}),
  });
  const url = await getSignedUrl(s3, cmd, signedPutOptions(expiresIn));
  return { url, expiresIn };
};

// Presign a GET (short-lived view)
export const s3PresignGet = async ({
  bucket,
  key,
  expiresIn = 86400, // 1 day
}) => {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const url = await getSignedUrl(s3, cmd, { expiresIn });
  return { url, expiresIn };
};

// Hard-delete from public bucket
export const s3DeleteObject = async ({ bucket, key }) => {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
};

export async function signGetObject({ bucket, key, contentType, expiresIn = 300 }) {
  // (kept for backwards compatibility if you used this elsewhere)
  const cmd = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentType: contentType || undefined,
  });
  return getSignedUrl(s3, cmd, { expiresIn });
}

export default s3;
