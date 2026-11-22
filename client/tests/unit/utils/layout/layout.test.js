import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { lockBodyScroll } from '@/utils/layout/bodyScrollLock';
import { NOT_PHONE_QUERY, PHONE_QUERY } from '@/utils/layout/phone';

describe('lockBodyScroll', () => {
  beforeEach(() => {
    document.body.style.overflow = 'auto';
  });

  it('locks the page and puts its overflow back on release', () => {
    const release = lockBodyScroll();
    expect(document.body.style.overflow).toBe('hidden');
    release();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('keeps the page locked until the last of two dialogs closes, in either order', () => {
    const outer = lockBodyScroll();
    const inner = lockBodyScroll();
    // The share dialog's clean-up ran before its confirmation's (19 Nov 2026, the audit)
    outer();
    expect(document.body.style.overflow).toBe('hidden');
    inner();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('counts a release called twice once', () => {
    const first = lockBodyScroll();
    const second = lockBodyScroll();
    first();
    first();
    expect(document.body.style.overflow).toBe('hidden');
    second();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('saves the overflow afresh for the next lock', () => {
    lockBodyScroll()();
    document.body.style.overflow = 'scroll';
    const release = lockBodyScroll();
    release();
    expect(document.body.style.overflow).toBe('scroll');
  });
});

describe('the phone queries', () => {
  it('are each other’s opposite: narrow or short is a phone', () => {
    expect(PHONE_QUERY).toBe('(max-width: 767.98px), (max-height: 499.98px)');
    expect(NOT_PHONE_QUERY).toBe('(min-width: 768px) and (min-height: 500px)');
  });

  it('match the phone: and nophone: variants in index.css', () => {
    const css = fs.readFileSync(path.resolve(process.cwd(), 'src/styles/index.css'), 'utf8');
    expect(css).toContain(PHONE_QUERY);
    expect(css).toContain(NOT_PHONE_QUERY);
  });
});
