import 'dotenv/config';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const PRIVATE_BUCKET = process.env.STORAGE_PRIVATE_BUCKET || '';
if (!PRIVATE_BUCKET) console.warn('[S3 private] STORAGE_PRIVATE_BUCKET is empty');

// Falls back to the public STORAGE_* settings (same host, different bucket)
const env = (name) => process.env[`STORAGE_PRIVATE_${name}`] || process.env[`STORAGE_${name}`];

export const s3Private = new S3Client({
  region: env('REGION'),
  endpoint: env('ENDPOINT'),
  credentials: {
    accessKeyId: env('ACCESS_KEY'),
    secretAccessKey: env('SECRET_KEY'),
  },
  forcePathStyle: true, // Path-style URLs (Hetzner, R2, MinIO)
  // Keeps the empty-body CRC32 checksum out of presigned PUT URLs (see s3public.js)
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

// Presign a GET (download). `signingDate` lets callers sign at a fixed time
// (the start of the hour) so the same object keeps the same URL for a while.
export async function signPrivateGetObject({
  key,
  contentType,
  expiresIn = 60,
  bucket = PRIVATE_BUCKET,
  signingDate,
}) {
  const cmd = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentType: contentType || undefined,
  });
  return getSignedUrl(s3Private, cmd, { expiresIn, ...(signingDate ? { signingDate } : {}) });
}

// Presign a PUT (upload)
export async function signPrivatePutObject({
  key,
  contentType = 'application/octet-stream',
  expiresIn = 60,
  bucket = PRIVATE_BUCKET,
}) {
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3Private, cmd, { expiresIn });
}

export default s3Private;
