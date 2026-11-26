import { describe, expect, it } from 'vitest';
import {
  FEEDBACK_LIMITS,
  checkScreenshot,
  cleanContext,
  cleanPage,
  closedAtFor,
  feedbackExportItem,
  feedbackListItem,
  feedbackReference,
  feedbackView,
  parseFeedbackFilters,
  parseFeedbackInput,
  parseFeedbackUpdate,
} from '../src/utils/feedback.js';

// Feedback sent from the map (docs/API.md "Feedback"; 25 Nov 2026, the user's wish)
describe('parseFeedbackInput', () => {
  it('takes a problem with what was expected, why it matters and how much it gets in the way', () => {
    const parsed = parseFeedbackInput(
      { kind: 'PROBLEM', details: '  Save did nothing  ', expected: 'It saves', why: 'Lost my notes', impact: 'ANNOYING', page: '/map?x=1', mapId: 'map-home' },
      { userAgent: 'Browser/1' },
    );
    expect(parsed).toEqual({
      ok: true,
      value: {
        kind: 'PROBLEM',
        details: 'Save did nothing',
        expected: 'It saves',
        why: 'Lost my notes',
        impact: 'ANNOYING',
        page: '/map',
        mapId: 'map-home',
        userAgent: 'Browser/1',
        context: null,
        screenshotKey: null,
      },
    });
  });

  it('keeps only what each kind asks: an idea its why, a question or anything else just the words', () => {
    const idea = parseFeedbackInput({ kind: 'IDEA', details: 'Dark mode', expected: 'x', why: 'Night', impact: 'MINOR' }).value;
    expect(idea).toMatchObject({ expected: null, why: 'Night', impact: null });
    const question = parseFeedbackInput({ kind: 'QUESTION', details: 'How?', expected: 'x', why: 'y', impact: 'MINOR' }).value;
    expect(question).toMatchObject({ expected: null, why: null, impact: null });
    expect(parseFeedbackInput({ kind: 'OTHER', details: 'Hi' }).ok).toBe(true);
  });

  it('refuses a missing kind or words, too much, an unknown impact or a screenshot that isn’t a key', () => {
    expect(parseFeedbackInput({ details: 'x' })).toEqual({ ok: false, error: 'feedbackKindInvalid' });
    expect(parseFeedbackInput({ kind: 'IDEA', details: '  ' })).toEqual({ ok: false, error: 'feedbackDetailsRequired' });
    expect(parseFeedbackInput({ kind: 'IDEA', details: '<b></b>' })).toEqual({ ok: false, error: 'feedbackDetailsRequired' });
    expect(parseFeedbackInput({ kind: 'IDEA', details: 'x'.repeat(FEEDBACK_LIMITS.details + 1) })).toEqual({ ok: false, error: 'feedbackTooLong' });
    expect(parseFeedbackInput({ kind: 'PROBLEM', details: 'x', expected: 'y'.repeat(2001) })).toEqual({ ok: false, error: 'feedbackTooLong' });
    expect(parseFeedbackInput({ kind: 'PROBLEM', details: 'x', impact: 'TERRIBLE' })).toEqual({ ok: false, error: 'feedbackImpactInvalid' });
    expect(parseFeedbackInput({ kind: 'PROBLEM', details: 5 })).toEqual({ ok: false, error: 'malformedData' });
    expect(parseFeedbackInput({ kind: 'PROBLEM', details: 'x', screenshotKey: 7 })).toEqual({ ok: false, error: 'feedbackScreenshotInvalid' });
    expect(parseFeedbackInput(null)).toEqual({ ok: false, error: 'feedbackKindInvalid' });
  });

  it('keeps newlines, takes out tags, and drops a map id that isn’t one', () => {
    const value = parseFeedbackInput({ kind: 'OTHER', details: 'Line one\nLine <i>two</i>', mapId: 'x y; drop' }).value;
    expect(value.details).toBe('Line one\nLine two');
    expect(value.mapId).toBeNull();
  });
});

describe('where they were', () => {
  it('keeps a page’s path alone, its secrets taken out', () => {
    expect(cleanPage('/maps/abc?home=1#x')).toBe('/maps/abc');
    expect(cleanPage('/invite/abcdefghijklmnopqrstuvwxyz0123456789')).toBe('/invite/:token');
    expect(cleanPage('/shared/K7QX-M2PA-9RTW/passport')).toBe('/shared/:code/passport');
    expect(cleanPage('/challenges/join/CHA2YR5RDTRP')).toBe('/challenges/join/:code');
    expect(cleanPage('/maps/map-home')).toBe('/maps/map-home');
    expect(cleanPage('https://evil.example/x')).toBeNull();
    expect(cleanPage(5)).toBeNull();
    expect(cleanPage(`/${'a'.repeat(400)}`)).toHaveLength(FEEDBACK_LIMITS.page);
  });

  it('keeps only the known small details', () => {
    expect(cleanContext({ screen: '1920×1080', phone: true, online: 'yes', secret: 'x', style: 's'.repeat(50) })).toEqual({
      screen: '1920×1080',
      phone: true,
      style: 's'.repeat(20),
    });
    expect(cleanContext({ secret: 'x' })).toBeNull();
    expect(cleanContext(['screen'])).toBeNull();
    expect(cleanContext(null)).toBeNull();
  });
});

describe('checkScreenshot', () => {
  it('takes a JPEG, PNG or WebP up to 8 MB', () => {
    expect(checkScreenshot({ contentType: 'image/png', bytes: 1000 })).toBeNull();
    expect(checkScreenshot({ contentType: 'image/svg+xml', bytes: 1000 })).toBe('feedbackScreenshotType');
    expect(checkScreenshot({ contentType: 'image/png', bytes: 0 })).toBe('feedbackScreenshotInvalid');
    expect(checkScreenshot({ contentType: 'image/png', bytes: 1.5 })).toBe('feedbackScreenshotInvalid');
    expect(checkScreenshot({ contentType: 'image/png', bytes: 8 * 1024 * 1024 + 1 })).toBe('feedbackScreenshotTooLarge');
  });
});

describe('the admin’s changes', () => {
  it('takes a status and notes, either or both', () => {
    expect(parseFeedbackUpdate({ status: 'DONE' })).toEqual({ ok: true, value: { status: 'DONE' } });
    expect(parseFeedbackUpdate({ adminNotes: '  Fixed  ' })).toEqual({ ok: true, value: { adminNotes: 'Fixed' } });
    expect(parseFeedbackUpdate({ adminNotes: '' })).toEqual({ ok: true, value: { adminNotes: null } });
    expect(parseFeedbackUpdate({ status: 'SOON' })).toEqual({ ok: false, error: 'feedbackStatusInvalid' });
    expect(parseFeedbackUpdate({})).toEqual({ ok: false, error: 'missingFields' });
    expect(parseFeedbackUpdate({ adminNotes: 'x'.repeat(FEEDBACK_LIMITS.adminNotes + 1) })).toEqual({ ok: false, error: 'feedbackTooLong' });
  });

  it('dates a report closed when it closes, keeps the date while it stays closed, clears it when opened', () => {
    const now = new Date('2026-11-25T10:00:00Z');
    const then = new Date('2026-11-20T10:00:00Z');
    expect(closedAtFor('DONE', { status: 'NEW', closedAt: null }, now)).toBe(now);
    expect(closedAtFor('WONT_DO', { status: 'DONE', closedAt: then }, now)).toBe(then);
    expect(closedAtFor('IN_PROGRESS', { status: 'DONE', closedAt: then }, now)).toBeNull();
    expect(closedAtFor('NEW', {}, now)).toBeNull();
  });

  it('reads the list’s filters, ALL meaning every one', () => {
    expect(parseFeedbackFilters({})).toEqual({ status: null, kind: null });
    expect(parseFeedbackFilters({ status: 'NEW', kind: 'IDEA' })).toEqual({ status: 'NEW', kind: 'IDEA' });
    expect(parseFeedbackFilters({ status: 'ALL', kind: 'ALL' })).toEqual({ status: null, kind: null });
    expect(parseFeedbackFilters({ status: 'SOON' })).toEqual({ error: 'feedbackStatusInvalid' });
    expect(parseFeedbackFilters({ kind: 'RANT' })).toEqual({ error: 'feedbackKindInvalid' });
  });
});

describe('the views', () => {
  const row = {
    id: '1a2b3c4d-0000-4000-8000-000000000001',
    kind: 'PROBLEM',
    impact: 'BLOCKING',
    status: 'NEW',
    details: 'x'.repeat(200),
    expected: 'y',
    why: 'z',
    page: '/map',
    mapId: 'm1',
    userAgent: 'UA',
    context: { phone: true },
    screenshotId: 'media-1',
    adminNotes: 'note',
    closedAt: null,
    createdAt: new Date('2026-11-25T10:00:00Z'),
    updatedAt: new Date('2026-11-25T10:00:00Z'),
    user: { id: 'u1', name: 'Sam', email: 'sam@example.test' },
    updatedBy: null,
  };

  it('gives each a short reference', () => {
    expect(feedbackReference(row.id)).toBe('FB-1A2B3C4D');
  });

  it('lists a report with its words cut short and no address', () => {
    const item = feedbackListItem(row);
    expect(item.summary).toHaveLength(158);
    expect(item.summary.endsWith('…')).toBe(true);
    expect(item.sender).toEqual({ id: 'u1', name: 'Sam' });
    expect(item.hasScreenshot).toBe(true);
  });

  it('shows an admin the whole report with the sender’s address and the screenshot’s link', () => {
    const view = feedbackView(row, { screenshotUrl: 'https://signed' });
    expect(view).toMatchObject({ details: row.details, sender: { email: 'sam@example.test' }, screenshot: { url: 'https://signed' }, adminNotes: 'note' });
    expect(feedbackView({ ...row, screenshotId: null }).screenshot).toBeNull();
  });

  it('puts the sender’s words in their own file, never the admin’s notes', () => {
    const item = feedbackExportItem(row);
    expect(item).toMatchObject({ reference: 'FB-1A2B3C4D', details: row.details, status: 'NEW', hasScreenshot: true, sentAt: row.createdAt });
    expect('adminNotes' in item).toBe(false);
  });
});
