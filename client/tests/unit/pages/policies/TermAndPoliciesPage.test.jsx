import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/react';
import TermAndPoliciesPage from '@/pages/policies/TermAndPoliciesPage';
import { LEGAL_AGREEMENTS_PAGE_URL } from '@/utils/constants/routes';
import { LEGAL_VERSION, PrivacySectionsArray, TermsSectionsArray } from '@/utils/data/termsData';
import { headings, onlyMain, renderPage } from '../renderPage';

const contentsLink = (id) => document.querySelector(`nav a[href="#${id}"]`);

describe('TermAndPoliciesPage', () => {
  beforeEach(() => {
    // jsdom has no scrolling
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('has one main, labelled by its h1 and described by the version line', () => {
    renderPage(<TermAndPoliciesPage />, { path: LEGAL_AGREEMENTS_PAGE_URL });
    const { count, main, id } = onlyMain();
    expect(count).toBe(1);
    expect(id).toBe('main-content');
    expect(main.getAttribute('aria-labelledby')).toBe('legal-title');
    expect(main.getAttribute('aria-describedby')).toBe('legal-version');
    expect(headings()).toEqual(['Terms and privacy']);
    const version = document.getElementById('legal-version').textContent;
    expect(version).toContain(`Version ${LEGAL_VERSION.version}`);
    expect(version).toContain(LEGAL_VERSION.lastUpdated);
  });

  it('prints every clause of both documents, each a jump target from the contents', () => {
    renderPage(<TermAndPoliciesPage />, { path: LEGAL_AGREEMENTS_PAGE_URL });
    for (const section of [...TermsSectionsArray, ...PrivacySectionsArray]) {
      expect(document.getElementById(section.id).tagName).toBe('ARTICLE');
      expect(contentsLink(section.id).textContent).toBe(section.title);
    }
    expect(document.getElementById('terms-and-conditions')).toBeTruthy();
    expect(document.getElementById('privacy-policy')).toBeTruthy();
  });

  it('marks the section in the address once drawn', async () => {
    renderPage(<TermAndPoliciesPage />, { path: LEGAL_AGREEMENTS_PAGE_URL, at: `${LEGAL_AGREEMENTS_PAGE_URL}#privacy-policy` });
    await waitFor(() => expect(contentsLink('privacy-policy').getAttribute('aria-current')).toBe('true'));
    expect(contentsLink('terms-and-conditions').getAttribute('aria-current')).toBeNull();
  });

  it('jumps to a clause: scrolls to it, focuses it and marks it current', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');
    renderPage(<TermAndPoliciesPage />, { path: LEGAL_AGREEMENTS_PAGE_URL });
    const id = PrivacySectionsArray[0].id;
    fireEvent.click(contentsLink(id));
    const target = document.getElementById(id);
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(document.activeElement).toBe(target);
    expect(target.getAttribute('tabIndex')).toBe('-1');
    expect(replaceState).toHaveBeenCalledWith(null, '', `#${id}`);
    expect(contentsLink(id).getAttribute('aria-current')).toBe('true');
  });

  it('is indexed', async () => {
    renderPage(<TermAndPoliciesPage />, { path: LEGAL_AGREEMENTS_PAGE_URL });
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]').getAttribute('content')).toMatch(/^index/));
  });
});
