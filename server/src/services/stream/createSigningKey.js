// Makes a Cloudflare Stream signing key for private playback links (docs/API.md "Videos").
// Run once by the user, from server/, after setting CLOUDFLARE_ACCOUNT_ID and
// CLOUDFLARE_STREAM_API_TOKEN:
//   node src/services/stream/createSigningKey.js
// It prints the two values to put in the env (CLOUDFLARE_STREAM_SIGNING_KEY_ID and
// CLOUDFLARE_STREAM_SIGNING_KEY_PEM). The PEM is a private key: keep it secret, never commit it.
import 'dotenv/config';
import { createSigningKey } from './streamApi.js';

try {
  const key = await createSigningKey();
  console.log('Add these to the server env (Vercel and your local env file):\n');
  console.log(`CLOUDFLARE_STREAM_SIGNING_KEY_ID=${key.id}`);
  console.log(`CLOUDFLARE_STREAM_SIGNING_KEY_PEM=${key.pem}`);
} catch (err) {
  console.error('Making the signing key failed:', err.message);
  process.exitCode = 1;
}
