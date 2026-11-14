import 'dotenv/config';
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.STORAGE_REGION,
  endpoint: process.env.STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY,
    secretAccessKey: process.env.STORAGE_SECRET_KEY,
  },
  forcePathStyle: true, // Path-style URLs (Hetzner, R2, MinIO)
});

export const PUBLIC_BUCKET = process.env.STORAGE_BUCKET || '';
if (!PUBLIC_BUCKET) {
  console.warn('[S3] STORAGE_BUCKET is empty');
}

// Public presigners

// Presign a PUT (browser upload)
export const s3PresignPut = async ({
  bucket,
  key,
  contentType,
  cacheControl,        // optional
  expiresIn = 600,     // 10 minutes
}) => {
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ...(cacheControl ? { CacheControl: cacheControl } : {}),
  });
  const url = await getSignedUrl(s3, cmd, { expiresIn });
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
