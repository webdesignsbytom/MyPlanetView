import 'dotenv/config';
import { GetBucketCorsCommand, S3Client } from '@aws-sdk/client-s3';

console.log('cwd:', process.cwd());
console.log('STORAGE_REGION:', JSON.stringify(process.env.STORAGE_REGION));
console.log('STORAGE_ENDPOINT:', JSON.stringify(process.env.STORAGE_ENDPOINT));
console.log('STORAGE_BUCKET:', JSON.stringify(process.env.STORAGE_BUCKET));

const s3 = new S3Client({
  region: process.env.STORAGE_REGION,
  endpoint: process.env.STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY,
    secretAccessKey: process.env.STORAGE_SECRET_KEY,
  },
  forcePathStyle: true,
});

async function checkBucketCors() {
  try {
    const out = await s3.send(
      new GetBucketCorsCommand({
        Bucket: process.env.STORAGE_BUCKET,
      }),
    );

    console.log(
      'Current CORS:',
      JSON.stringify(
        {
          CORSRules: out.CORSRules || [],
        },
        null,
        2,
      ),
    );
  } catch (err) {
    if (
      err?.name === 'NoSuchCORSConfiguration' ||
      err?.Code === 'NoSuchCORSConfiguration'
    ) {
      console.log('No CORS configuration is currently set on this bucket.');
      return;
    }

    console.error('Error reading bucket CORS:', err);
  }
}

checkBucketCors();