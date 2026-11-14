// Dev utility: apply public bucket CORS from FRONTEND_ORIGINS
import 'dotenv/config';
import {
  S3Client,
  PutBucketCorsCommand,
  GetBucketCorsCommand,
} from '@aws-sdk/client-s3';
import { FRONTEND_ORIGINS } from '../../utils/config.js';

const s3 = new S3Client({
  region: process.env.STORAGE_REGION,
  endpoint: process.env.STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY,
    secretAccessKey: process.env.STORAGE_SECRET_KEY,
  },
  forcePathStyle: true,
});

const params = {
  Bucket: process.env.STORAGE_BUCKET,
  CORSConfiguration: {
    CORSRules: [
      {
        AllowedHeaders: ['*'],
        AllowedMethods: ['GET', 'PUT', 'POST', 'HEAD'],
        AllowedOrigins: FRONTEND_ORIGINS,
        ExposeHeaders: ['ETag', 'x-amz-request-id'],
        MaxAgeSeconds: 3000,
      },
    ],
  },
};

(async () => {
  try {
    console.log('Applying CORS to', process.env.STORAGE_BUCKET, 'for origins:', FRONTEND_ORIGINS);
    await s3.send(new PutBucketCorsCommand(params));

    const out = await s3.send(
      new GetBucketCorsCommand({ Bucket: process.env.STORAGE_BUCKET }),
    );
    console.log('✅ CORS applied. Current rules:', out.CORSRules);
  } catch (err) {
    console.error('❌ Error setting CORS:', err);
  }
})();
