import { runAfterResponse } from '../background.js';

// Fire-and-forget event logging: never fails the request. The write runs through
// runAfterResponse (Vercel waitUntil), so a function instance isn't frozen before
// it's saved; a failure is logged and swallowed there.
export const logEvent = (promise) => {
  runAfterResponse(promise);
};
