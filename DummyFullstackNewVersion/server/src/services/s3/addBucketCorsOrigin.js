import 'dotenv/config';
import {
  GetBucketCorsCommand,
  PutBucketCorsCommand,
  S3Client,
} from '@aws-sdk/client-s3';

const NEW_ORIGINS = [
  'https://memento-somnia.netlify.app',
  'https://memento-arcana.netlify.app',
  'https://memento-astra.netlify.app'
];

const DEFAULT_RULE = {
  AllowedHeaders: ['*'],
  AllowedMethods: ['GET', 'PUT', 'POST', 'HEAD'],
  AllowedOrigins: [],
  ExposeHeaders: ['ETag', 'x-amz-request-id'],
  MaxAgeSeconds: 3000,
};

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

async function getCurrentCorsRules() {
  try {
    const out = await s3.send(
      new GetBucketCorsCommand({
        Bucket: process.env.STORAGE_BUCKET,
      }),
    );

    return out.CORSRules || [];
  } catch (err) {
    if (
      err?.name === 'NoSuchCORSConfiguration' ||
      err?.Code === 'NoSuchCORSConfiguration'
    ) {
      return [];
    }

    throw err;
  }
}

function mergeOrigins(rules) {
  const nextRules = rules.length ? [...rules] : [DEFAULT_RULE];

  const firstRule = {
    ...DEFAULT_RULE,
    ...nextRules[0],
    AllowedHeaders: nextRules[0]?.AllowedHeaders || DEFAULT_RULE.AllowedHeaders,
    AllowedMethods: nextRules[0]?.AllowedMethods || DEFAULT_RULE.AllowedMethods,
    AllowedOrigins: nextRules[0]?.AllowedOrigins || [],
    ExposeHeaders: nextRules[0]?.ExposeHeaders || DEFAULT_RULE.ExposeHeaders,
    MaxAgeSeconds: nextRules[0]?.MaxAgeSeconds || DEFAULT_RULE.MaxAgeSeconds,
  };

  const mergedOrigins = Array.from(
    new Set([...firstRule.AllowedOrigins, ...NEW_ORIGINS]),
  );

  nextRules[0] = {
    ...firstRule,
    AllowedOrigins: mergedOrigins,
  };

  return nextRules;
}

async function addBucketCorsOrigins() {
  try {
    const currentRules = await getCurrentCorsRules();

    console.log(
      'Current CORS:',
      JSON.stringify(
        {
          CORSRules: currentRules,
        },
        null,
        2,
      ),
    );

    const nextRules = mergeOrigins(currentRules);

    await s3.send(
      new PutBucketCorsCommand({
        Bucket: process.env.STORAGE_BUCKET,
        CORSConfiguration: {
          CORSRules: nextRules,
        },
      }),
    );

    console.log('CORS updated on bucket:', process.env.STORAGE_BUCKET);

    const updatedRules = await getCurrentCorsRules();

    console.log(
      'Updated CORS:',
      JSON.stringify(
        {
          CORSRules: updatedRules,
        },
        null,
        2,
      ),
    );
  } catch (err) {
    console.error('Error updating bucket CORS:', err);
  }
}

addBucketCorsOrigins();