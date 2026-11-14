// Dev utility: apply private bucket CORS from FRONTEND_ORIGINS
import 'dotenv/config';
import { PutBucketCorsCommand, GetBucketCorsCommand } from '@aws-sdk/client-s3';
import { FRONTEND_ORIGINS } from '../../utils/config.js';
// Same client (and fallbacks) the app uses
import { s3Private as s3 } from './s3private.js';

const params = {
  Bucket: process.env.STORAGE_PRIVATE_BUCKET,
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
    console.log('Applying CORS to', process.env.STORAGE_PRIVATE_BUCKET, 'for origins:', FRONTEND_ORIGINS);
    await s3.send(new PutBucketCorsCommand(params));

    const out = await s3.send(
      new GetBucketCorsCommand({ Bucket: process.env.STORAGE_PRIVATE_BUCKET }),
    );
    console.log('✅ CORS applied. Current rules:', out.CORSRules);
  } catch (err) {
    console.error('❌ Error setting CORS:', err);
  }
})();
