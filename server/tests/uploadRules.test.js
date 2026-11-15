import { describe, it, expect } from 'vitest';
import {
  UPLOAD_IMAGE_TYPES,
  CONTACT_IMAGE_MAX_AGE_MS,
  extensionForType,
  checkDeclaredUpload,
  checkStoredUpload,
  canAttachContactImage,
} from '../src/utils/media/uploadRules.js';

const MB = 1024 * 1024;
const RULES = { allowedTypes: UPLOAD_IMAGE_TYPES, maxBytes: 5 * MB };

describe('extensionForType', () => {
  it('maps each allowed type to its extension', () => {
    expect(extensionForType('image/png')).toBe('png');
    expect(extensionForType('image/jpeg')).toBe('jpg');
    expect(extensionForType('image/webp')).toBe('webp');
    expect(extensionForType('image/gif')).toBe('gif');
  });

  it('has no extension for anything else, so it never comes from a file name', () => {
    for (const type of ['image/svg+xml', 'text/html', 'application/octet-stream', 'image/PNG', 'image/jpg', '', null, 'toString', '__proto__']) {
      expect(extensionForType(type)).toBeNull();
    }
  });
});

describe('checkDeclaredUpload', () => {
  it('accepts an allowed type with a size within the cap', () => {
    expect(checkDeclaredUpload({ contentType: 'image/png', bytes: 1 }, RULES)).toEqual({ ok: true });
    expect(checkDeclaredUpload({ contentType: 'image/webp', bytes: 5 * MB }, RULES)).toEqual({ ok: true });
  });

  it('refuses other types (400)', () => {
    for (const contentType of ['text/html', 'image/svg+xml', 'IMAGE/PNG', undefined]) {
      expect(checkDeclaredUpload({ contentType, bytes: 10 }, RULES)).toMatchObject({ ok: false, status: 400 });
    }
    // An allowed list with a type that has no extension is still refused
    expect(checkDeclaredUpload({ contentType: 'video/mp4', bytes: 10 }, { allowedTypes: ['video/mp4'], maxBytes: MB })).toMatchObject({ ok: false, status: 400 });
  });

  it('needs a whole, positive size (400) within the cap (413)', () => {
    for (const bytes of [undefined, null, 0, -1, 1.5, '100', Number.NaN]) {
      expect(checkDeclaredUpload({ contentType: 'image/png', bytes }, RULES)).toMatchObject({ ok: false, status: 400 });
    }
    expect(checkDeclaredUpload({ contentType: 'image/png', bytes: 5 * MB + 1 }, RULES)).toMatchObject({ ok: false, status: 413 });
  });
});

describe('checkStoredUpload', () => {
  const expected = { contentType: 'image/png', ...RULES };

  it('accepts what was presigned', () => {
    expect(checkStoredUpload({ bytes: 2000, contentType: 'image/png' }, expected)).toEqual({ ok: true });
  });

  it('reports a missing object separately', () => {
    expect(checkStoredUpload(null, expected)).toMatchObject({ ok: false, missing: true });
  });

  it('refuses another type, even an allowed one', () => {
    expect(checkStoredUpload({ bytes: 2000, contentType: 'text/html' }, expected)).toMatchObject({ ok: false, missing: false });
    expect(checkStoredUpload({ bytes: 2000, contentType: 'image/gif' }, expected)).toMatchObject({ ok: false, missing: false });
    // A recorded type that is no longer allowed
    expect(checkStoredUpload({ bytes: 2000, contentType: 'image/svg+xml' }, { ...expected, contentType: 'image/svg+xml' })).toMatchObject({ ok: false });
  });

  it('refuses an empty or oversized object', () => {
    expect(checkStoredUpload({ bytes: 0, contentType: 'image/png' }, expected)).toMatchObject({ ok: false, missing: false });
    expect(checkStoredUpload({ bytes: 5 * MB + 1, contentType: 'image/png' }, expected)).toMatchObject({ ok: false, missing: false });
  });
});

describe('canAttachContactImage', () => {
  const now = new Date('2026-11-14T12:00:00Z');
  const item = { resource: 'contact', bytes: 2000, contentType: 'image/png', createdAt: new Date('2026-11-14T11:30:00Z') };

  it('accepts a fresh, confirmed, unused contact image', () => {
    expect(canAttachContactImage({ item, alreadyUsed: false, now })).toBe(true);
  });

  it('refuses a missing, unconfirmed or other-resource upload', () => {
    expect(canAttachContactImage({ item: null, alreadyUsed: false, now })).toBe(false);
    expect(canAttachContactImage({ item: { ...item, bytes: null }, alreadyUsed: false, now })).toBe(false);
    expect(canAttachContactImage({ item: { ...item, resource: 'avatar' }, alreadyUsed: false, now })).toBe(false);
  });

  it('refuses a type that is not an allowed image', () => {
    expect(canAttachContactImage({ item: { ...item, contentType: 'text/html' }, alreadyUsed: false, now })).toBe(false);
  });

  it('refuses one already on another form', () => {
    expect(canAttachContactImage({ item, alreadyUsed: true, now })).toBe(false);
  });

  it('refuses one older than an hour', () => {
    const atLimit = { ...item, createdAt: new Date(now.getTime() - CONTACT_IMAGE_MAX_AGE_MS) };
    const tooOld = { ...item, createdAt: new Date(now.getTime() - CONTACT_IMAGE_MAX_AGE_MS - 1) };
    expect(canAttachContactImage({ item: atLimit, alreadyUsed: false, now })).toBe(true);
    expect(canAttachContactImage({ item: tooOld, alreadyUsed: false, now })).toBe(false);
  });
});
