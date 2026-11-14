// Run work after the response (Vercel waitUntil keep-alive)
let waitUntil = null;

try {
  ({ waitUntil } = await import('@vercel/functions'));
} catch {
  // Not available — fall through to the plain-promise path.
}

export const runAfterResponse = (promise) => {
  // Swallow rejections so background work can't crash the process
  const guarded = Promise.resolve(promise).catch((err) => {
    console.error('[background] task failed:', err);
  });

  if (waitUntil) {
    try {
      waitUntil(guarded);
    } catch (err) {
      // Promise still runs, just without keep-alive
      console.error('[background] waitUntil unavailable:', err?.message);
    }
  }

  return guarded;
};
