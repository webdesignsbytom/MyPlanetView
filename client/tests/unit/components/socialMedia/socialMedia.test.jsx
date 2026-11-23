import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import FixedSocialButtons from '@/components/socialMedia/FixedSocialButtons';
import SocialMediaCTA from '@/components/socialMedia/SocialMediaCTA';
import SocialMediaPin from '@/components/socialMedia/SocialMediaPin';

const links = vi.hoisted(() => []);
vi.mock('@/utils/data/socialMediaData', () => ({ socialMediaLinks: links }));

const FACEBOOK = { serviceName: 'Facebook', icon: <span data-icon='fb' />, url: 'https://facebook.example/mpv', ariaLabel: 'Open our Facebook page in a new tab', title: 'Us on Facebook' };
const INSTAGRAM = { serviceName: 'Instagram', icon: <span data-icon='ig' />, url: 'https://instagram.example/mpv' };

describe('SocialMediaPin', () => {
  it('opens the service in a new tab with its name and title', () => {
    const { container } = render(<ul><SocialMediaPin {...FACEBOOK} className='big' /></ul>);
    const link = container.querySelector('li > a');
    expect(link.getAttribute('href')).toBe(FACEBOOK.url);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noreferrer');
    expect(link.getAttribute('aria-label')).toBe('Open our Facebook page in a new tab');
    expect(link.getAttribute('title')).toBe('Us on Facebook');
    expect(link.className).toContain('big');
    expect(link.querySelector('[data-icon="fb"]')).toBeTruthy();
  });

  it('falls back to the service’s name for both', () => {
    const { container } = render(<ul><SocialMediaPin {...INSTAGRAM} /></ul>);
    const link = container.querySelector('a');
    expect(link.getAttribute('aria-label')).toBe('Open Instagram');
    expect(link.getAttribute('title')).toBe('Instagram');
  });
});

describe('FixedSocialButtons and SocialMediaCTA', () => {
  beforeEach(() => {
    links.length = 0;
  });

  it('render nothing when there are no links', () => {
    expect(render(<FixedSocialButtons />).container.innerHTML).toBe('');
    expect(render(<SocialMediaCTA />).container.innerHTML).toBe('');
  });

  it('the fixed buttons list every link in a named section', () => {
    links.push(FACEBOOK, INSTAGRAM);
    const { container } = render(<FixedSocialButtons />);
    expect(container.querySelector('section').getAttribute('aria-label')).toBe('Social media quick links');
    expect([...container.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual([FACEBOOK.url, INSTAGRAM.url]);
  });

  it('the call to action lists every link with the given class', () => {
    links.push(FACEBOOK, INSTAGRAM);
    const { container } = render(<SocialMediaCTA socialClassName='text-2xl' />);
    const anchors = [...container.querySelectorAll('a')];
    expect(anchors.length).toBe(2);
    expect(anchors.every((a) => a.className.includes('text-2xl'))).toBe(true);
  });
});
