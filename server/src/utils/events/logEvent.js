// Fire-and-forget event logging (never fails the request)
export const logEvent = (promise) => {
  Promise.resolve(promise).catch((e) => {
    console.error('[logEvent] event logging failed:', e);
  });
};
