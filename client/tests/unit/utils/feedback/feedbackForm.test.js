// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  FEEDBACK_IMPACTS,
  FEEDBACK_KINDS,
  FEEDBACK_LIMITS,
  FEEDBACK_STATUSES,
  SCREENSHOT_MAX_BYTES,
  SCREENSHOT_TYPES,
  contextWords,
  emptyFeedbackForm,
  feedbackBody,
  feedbackFormProblem,
  kindLabel,
  pageDetails,
  sentWords,
  statusFilters,
  statusLabel,
} from '@/utils/feedback/feedbackForm';
import * as server from '../../../../../server/src/utils/feedback.js';

// Feedback sent from the map (docs/API.md "Feedback"; 25 Nov 2026, the user's wish)
describe('the form’s rules match the server’s', () => {
  it('has the same kinds, impacts, statuses, limits and screenshot rules', () => {
    expect(FEEDBACK_KINDS.map((k) => k.id)).toEqual([...server.FEEDBACK_KINDS]);
    expect(FEEDBACK_IMPACTS.map((i) => i.id)).toEqual([...server.FEEDBACK_IMPACTS]);
    expect(FEEDBACK_STATUSES.map((s) => s.id)).toEqual([...server.FEEDBACK_STATUSES]);
    for (const [field, max] of Object.entries(FEEDBACK_LIMITS)) expect(max).toBe(server.FEEDBACK_LIMITS[field]);
    expect([...SCREENSHOT_TYPES]).toEqual([...server.SCREENSHOT_TYPES]);
    expect(SCREENSHOT_MAX_BYTES).toBe(server.SCREENSHOT_MAX_BYTES);
  });
});

describe('the questions', () => {
  it('asks a problem what happened, what was expected and why it matters; a question only what', () => {
    const byId = Object.fromEntries(FEEDBACK_KINDS.map((k) => [k.id, k]));
    expect(byId.PROBLEM.details.label).toBe('What happened?');
    expect(byId.PROBLEM.expected.label).toBe('What did you expect to happen?');
    expect(byId.PROBLEM.why.label).toBe('Why is it a problem for you?');
    expect(byId.IDEA.expected).toBeUndefined();
    expect(byId.IDEA.why.label).toBe('What would it help you do?');
    expect(byId.QUESTION.why).toBeUndefined();
    expect(kindLabel('IDEA')).toBe('An idea');
    expect(statusLabel('WONT_DO')).toBe('Won’t do');
  });

  it('says what’s missing before it can be sent', () => {
    expect(feedbackFormProblem(emptyFeedbackForm())).toBe('Choose what your message is about.');
    expect(feedbackFormProblem({ ...emptyFeedbackForm(), kind: 'PROBLEM', details: '  ' })).toBe('Please answer “What happened?”');
    expect(feedbackFormProblem({ ...emptyFeedbackForm(), kind: 'IDEA', details: 'x', why: 'y'.repeat(FEEDBACK_LIMITS.why + 1) })).toMatch(/a bit long/);
    expect(feedbackFormProblem({ ...emptyFeedbackForm(), kind: 'OTHER', details: 'Hello' })).toBeNull();
  });
});

describe('feedbackBody', () => {
  const form = { kind: 'PROBLEM', details: '  Save did nothing ', expected: ' It saves ', why: '', impact: 'BLOCKING' };

  it('sends only what its kind asks, trimmed, with the page, map, details and screenshot', () => {
    expect(feedbackBody(form, { page: '/maps/m1', mapId: 'm1', context: { phone: true }, screenshotKey: 'k' })).toEqual({
      kind: 'PROBLEM',
      details: 'Save did nothing',
      expected: 'It saves',
      impact: 'BLOCKING',
      why: null,
      page: '/maps/m1',
      mapId: 'm1',
      context: { phone: true },
      screenshotKey: 'k',
    });
    const idea = feedbackBody({ ...form, kind: 'IDEA', why: 'Night' });
    expect(idea).not.toHaveProperty('expected');
    expect(idea).not.toHaveProperty('impact');
    expect(idea.why).toBe('Night');
    const question = feedbackBody({ ...form, kind: 'QUESTION' });
    expect(Object.keys(question).sort()).toEqual(['context', 'details', 'kind', 'mapId', 'page', 'screenshotKey']);
  });
});

describe('what the page adds', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads the screen, window, style, language and time zone, and whether it’s the installed app', () => {
    vi.stubGlobal('window', { screen: { width: 1920, height: 1080 }, innerWidth: 1280, innerHeight: 720, matchMedia: () => ({ matches: true }) });
    vi.stubGlobal('navigator', { onLine: false, language: 'en-GB' });
    const details = pageDetails({ style: 'starry', phone: true });
    expect(details).toMatchObject({ screen: '1920×1080', window: '1280×720', style: 'starry', phone: true, online: false, standalone: true, language: 'en-GB' });
    expect(typeof details.timeZone).toBe('string');
    // The server keeps them all
    expect(server.cleanContext(details)).toEqual(details);
  });

  it('puts them in words for the admin', () => {
    expect(contextWords({ screen: '390×844', window: '390×664', style: 'mono', phone: true, standalone: true, online: false, language: 'en-GB', timeZone: 'Europe/London' })).toEqual([
      'Screen 390×844',
      'Window 390×664',
      'Map style mono',
      'A phone',
      'The installed app',
      'Offline',
      'Language en-GB',
      'Time zone Europe/London',
    ]);
    expect(contextWords(null)).toEqual([]);
  });
});

describe('the admin’s words', () => {
  it('counts each status, and all of them', () => {
    expect(statusFilters({ NEW: 2, DONE: 3 }).map((f) => `${f.label} ${f.count}`)).toEqual(['All 5', 'New 2', 'In progress 0', 'Done 3', 'Won’t do 0']);
    expect(statusFilters()[0]).toEqual({ id: 'ALL', label: 'All', count: 0 });
  });

  it('dates a report, and nothing for a bad date', () => {
    expect(sentWords('2026-11-25T10:04:00Z')).toMatch(/25 Nov 2026/);
    expect(sentWords('nope')).toBe('');
  });
});
