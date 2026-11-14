let gaReady = false;
let queue = [];

// tiny helper: run after the browser is idle (with a fallback)
function onIdle(fn) {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    // give the page a moment to paint before we touch the network
    requestIdleCallback(fn, { timeout: 3000 });
  } else {
    setTimeout(fn, 0);
  }
}

// Init GA4 after consent, when idle
export function initGA(measurementId) {
  if (!measurementId || gaReady) return;

  onIdle(async () => {
    const { default: ReactGA } = await import('react-ga4');

    // Init – do NOT auto-send pageviews
    ReactGA.initialize(measurementId, { gaOptions: {}, gtagOptions: { send_page_view: false } });

    // Grant analytics consent
    try {
      ReactGA.gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        wait_for_update: 500,
      });
    } catch { /* empty */ }

    // Expose a gtag shim for any code that prefers window.gtag
    if (typeof window !== 'undefined') {
      window.gtag = (...args) => {
        try { ReactGA.gtag(...args); } catch { /* empty */ }
      };
    }

    gaReady = true;

    // Flush any queued events
    if (queue.length) {
      for (const fn of queue) fn();
      queue = [];
    }
  });
}

/** Queue-safe pageview */
export function sendPageView(path) {
  const run = () => {
    if (typeof window?.gtag === 'function') {
      window.gtag('event', 'page_view', { page_path: path });
    }
  };
  if (gaReady) run();
  else queue.push(run);
}
