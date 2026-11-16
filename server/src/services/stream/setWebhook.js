// Tells Cloudflare Stream where to send its notices (a video converted, or failed), and
// prints the secret they're signed with (docs/API.md "Videos"). Run once by the user, from
// server/, with the API's public address:
//   node src/services/stream/setWebhook.js https://api.myplanetview.com/api/videos/stream-webhook
// Then set CLOUDFLARE_STREAM_WEBHOOK_SECRET to the printed secret. An account has one
// webhook: running it again replaces the address and the secret.
import 'dotenv/config';
import { setWebhook } from './streamApi.js';

const url = process.argv[2];
try {
  if (!url || !url.startsWith('https://')) throw new Error('Give the https address of /api/videos/stream-webhook');
  const result = await setWebhook(url);
  console.log(`Stream will send its notices to ${result.notificationUrl}\n`);
  console.log(`CLOUDFLARE_STREAM_WEBHOOK_SECRET=${result.secret}`);
} catch (err) {
  console.error('Setting the webhook failed:', err.message);
  process.exitCode = 1;
}
