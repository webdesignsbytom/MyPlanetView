// Empties the site's buckets, for a fresh start before re-seeding (17 Nov 2026, the live
// test's reset). The user runs it: it reads the STORAGE_* keys from the env file (through
// s3public.js and s3private.js). Deleting can't be undone.
//   node scripts/empty-buckets.mjs                   say what each bucket holds, delete nothing
//   node scripts/empty-buckets.mjs --yes             delete every object in both buckets
//   node scripts/empty-buckets.mjs --only private    one bucket (public or private)
// Afterwards the seed puts the demo photos back in the private bucket, and
// `npm run media:upload` the posters, landmark and festival photos in the public one.
// Like the seed, it refuses to run when IS_PRODUCTION_DATABASE=true: a real site's buckets
// hold its users' photos.
import 'dotenv/config';

const BUCKETS = ['public', 'private'];

export function parseArgs(argv) {
  const opts = { yes: false, only: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--yes') opts.yes = true;
    else if (arg === '--only') opts.only = argv[(i += 1)];
    else if (arg.startsWith('--only=')) opts.only = arg.slice('--only='.length);
    else throw new Error(`Unknown option ${arg}`);
  }
  if (opts.only !== null && !BUCKETS.includes(opts.only)) throw new Error(`--only takes one of: ${BUCKETS.join(', ')}`);
  return opts;
}

const megabytes = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

async function main() {
  if (process.env.IS_PRODUCTION_DATABASE === 'true') {
    throw new Error('Refusing: IS_PRODUCTION_DATABASE=true. A production site\'s buckets hold its users\' photos.');
  }
  const opts = parseArgs(process.argv.slice(2));
  const { ListObjectsV2Command, DeleteObjectsCommand } = await import('@aws-sdk/client-s3');
  const { default: s3Public, PUBLIC_BUCKET } = await import('../src/services/s3/s3public.js');
  const { s3Private, PRIVATE_BUCKET } = await import('../src/services/s3/s3private.js');
  const targets = [
    { which: 'public', client: s3Public, bucket: PUBLIC_BUCKET },
    { which: 'private', client: s3Private, bucket: PRIVATE_BUCKET },
  ].filter((t) => !opts.only || t.which === opts.only);

  for (const { which, client, bucket } of targets) {
    if (!bucket) throw new Error(`The ${which} bucket's name isn't set (STORAGE_${which === 'private' ? 'PRIVATE_' : ''}BUCKET)`);
  }
  if (targets.length === 2 && targets[0].bucket === targets[1].bucket) targets.pop();

  for (const { which, client, bucket } of targets) {
    // Every key, a page of up to 1,000 at a time
    const keys = [];
    let bytes = 0;
    let ContinuationToken;
    do {
      const page = await client.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken }));
      for (const obj of page.Contents || []) {
        keys.push(obj.Key);
        bytes += obj.Size || 0;
      }
      ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (ContinuationToken);

    const folders = {};
    for (const key of keys) {
      const folder = key.split('/').slice(0, key.startsWith('myplanetview/') ? 2 : 1).join('/');
      folders[folder] = (folders[folder] || 0) + 1;
    }
    console.log(`${which} bucket ${bucket}: ${keys.length} files (${megabytes(bytes)})`);
    for (const [folder, count] of Object.entries(folders).sort()) console.log(`  ${folder}: ${count}`);
    if (!opts.yes || !keys.length) continue;

    // One DeleteObjects per 1,000 keys; failures are listed, and a re-run deletes what's left
    let deleted = 0;
    const failed = [];
    for (let i = 0; i < keys.length; i += 1000) {
      const batch = keys.slice(i, i + 1000);
      const res = await client.send(
        new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true } }),
      );
      const errors = res.Errors || [];
      deleted += batch.length - errors.length;
      failed.push(...errors.map((e) => `${e.Key}: ${e.Code} ${e.Message || ''}`.trim()));
    }
    console.log(`  deleted ${deleted} of ${keys.length}`);
    if (failed.length) {
      console.error(`  ${failed.length} failed (run it again to retry them):`);
      for (const line of failed.slice(0, 20)) console.error(`    ${line}`);
      process.exitCode = 1;
    }
  }
  if (!opts.yes) console.log('Nothing deleted. Add --yes to delete every file listed above.');
}

main().catch((err) => {
  console.error('Emptying the buckets failed:', err.message);
  process.exitCode = 1;
});
