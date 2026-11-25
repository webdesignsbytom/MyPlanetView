// Feedback (docs/API.md "Feedback"; 25 Nov 2026, the user's wish: "simple for a non technical person
// to be able to report issues, and upload a screenshot if needed"): what the form asks for each kind,
// in plain words, the limits (a copy of the server's utils/feedback.js FEEDBACK_LIMITS), the body
// it sends, the small details the page adds, and the admin's labels. Pure but for `pageDetails`,
// which reads the window (call it when sending, never in a render).

export const FEEDBACK_LIMITS = Object.freeze({ details: 4000, expected: 2000, why: 2000, adminNotes: 4000 });
export const SCREENSHOT_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/webp']);
export const SCREENSHOT_MAX_BYTES = 8 * 1024 * 1024;

// What it's about, each with its questions: `details` always (required), `expected` and `impact` for
// a problem, `why` for a problem or an idea
export const FEEDBACK_KINDS = Object.freeze([
  {
    id: 'PROBLEM',
    label: 'Something’s not working',
    hint: 'A button, a page or a picture doing the wrong thing',
    details: { label: 'What happened?', placeholder: 'I pressed Save on my trip and nothing happened.' },
    expected: { label: 'What did you expect to happen?', placeholder: 'The trip to be saved.' },
    why: { label: 'Why is it a problem for you?', placeholder: 'I had to type my notes again.' },
  },
  {
    id: 'IDEA',
    label: 'An idea',
    hint: 'Something you’d like the site to do',
    details: { label: 'What would you like?', placeholder: 'A way to print my passport.' },
    why: { label: 'What would it help you do?', placeholder: 'Give it to my mum as a present.' },
  },
  {
    id: 'QUESTION',
    label: 'A question',
    hint: 'Not sure how something works',
    details: { label: 'What would you like to know?', placeholder: 'How do I add my partner to my map?' },
  },
  {
    id: 'OTHER',
    label: 'Something else',
    hint: 'Anything else on your mind',
    details: { label: 'Your message', placeholder: 'Tell us anything.' },
  },
]);
export const feedbackKind = (id) => FEEDBACK_KINDS.find((kind) => kind.id === id) || null;

// How much a problem gets in the way
export const FEEDBACK_IMPACTS = Object.freeze([
  { id: 'BLOCKING', label: 'It stops me doing something', short: 'Stops them' },
  { id: 'ANNOYING', label: 'It’s annoying, but I can carry on', short: 'Annoying' },
  { id: 'MINOR', label: 'It’s small: just so you know', short: 'Small' },
]);
export const impactLabel = (id) => FEEDBACK_IMPACTS.find((impact) => impact.id === id)?.short ?? null;

// The admin's statuses, in the order a report moves through them
export const FEEDBACK_STATUSES = Object.freeze([
  { id: 'NEW', label: 'New' },
  { id: 'IN_PROGRESS', label: 'In progress' },
  { id: 'DONE', label: 'Done' },
  { id: 'WONT_DO', label: 'Won’t do' },
]);
export const statusLabel = (id) => FEEDBACK_STATUSES.find((status) => status.id === id)?.label ?? id;
export const kindLabel = (id) => feedbackKind(id)?.label ?? id;

export const emptyFeedbackForm = () => ({ kind: '', details: '', expected: '', why: '', impact: '' });

/** What's wrong with the form, in words, or null when it can be sent. */
export function feedbackFormProblem(form) {
  const kind = feedbackKind(form.kind);
  if (!kind) return 'Choose what your message is about.';
  if (!form.details.trim()) return `Please answer “${kind.details.label}”`;
  for (const field of ['details', 'expected', 'why']) {
    if ((form[field] || '').length > FEEDBACK_LIMITS[field]) return 'That’s a bit long. Please shorten it.';
  }
  return null;
}

/**
 * The small details the page sends with a report, read now: the screen and window size, the map's
 * style, phone or not, online, the installed app or a tab, the language and time zone.
 */
export function pageDetails({ style = null, phone = false } = {}) {
  const screenSize = typeof window !== 'undefined' && window.screen ? `${window.screen.width}×${window.screen.height}` : null;
  return {
    screen: screenSize,
    window: typeof window !== 'undefined' ? `${window.innerWidth}×${window.innerHeight}` : null,
    style,
    phone,
    online: typeof navigator !== 'undefined' ? navigator.onLine !== false : true,
    standalone: typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia('(display-mode: standalone)').matches : false,
    language: typeof navigator !== 'undefined' ? navigator.language || null : null,
    timeZone: (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
      } catch {
        return null;
      }
    })(),
  };
}

/** The report the form sends: only what its kind asks, the page, the map and the details. */
export function feedbackBody(form, { page = null, mapId = null, context = null, screenshotKey = null } = {}) {
  const kind = form.kind;
  return {
    kind,
    details: form.details.trim(),
    ...(kind === 'PROBLEM' ? { expected: form.expected.trim() || null, impact: form.impact || null } : {}),
    ...(kind === 'PROBLEM' || kind === 'IDEA' ? { why: form.why.trim() || null } : {}),
    page,
    mapId,
    context,
    screenshotKey,
  };
}

/** The details sent with a report, in words for its admin: "Screen 1920×1080 · Window 1280×720 · …" */
export function contextWords(context) {
  if (!context) return [];
  const words = [];
  if (context.screen) words.push(`Screen ${context.screen}`);
  if (context.window) words.push(`Window ${context.window}`);
  if (context.style) words.push(`Map style ${context.style}`);
  if (context.phone) words.push('A phone');
  if (context.standalone) words.push('The installed app');
  if (context.online === false) words.push('Offline');
  if (context.language) words.push(`Language ${context.language}`);
  if (context.timeZone) words.push(`Time zone ${context.timeZone}`);
  return words;
}

// Each status's look on the admin page (index.css's tone utilities)
export const STATUS_TONE = Object.freeze({ NEW: 'tone-info', IN_PROGRESS: 'tone-warn', DONE: 'tone-good', WONT_DO: 'tone-muted' });

/** When a report was sent, for the admin: "25 Nov 2026, 10:04" in their own time. */
export function sentWords(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** The filter's words: "New (3)", "All (12)". `counts` is the server's per status. */
export function statusFilters(counts = {}) {
  const total = Object.values(counts).reduce((sum, n) => sum + (Number(n) || 0), 0);
  return [
    { id: 'ALL', label: 'All', count: total },
    ...FEEDBACK_STATUSES.map((status) => ({ id: status.id, label: status.label, count: counts[status.id] || 0 })),
  ];
}
