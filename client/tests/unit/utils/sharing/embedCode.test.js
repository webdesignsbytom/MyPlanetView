// A map on someone's website: the code to paste (utils/sharing/embedCode.js).
import { describe, expect, it } from 'vitest';
import { EMBED_HEIGHT, MADE_WITH_TEXT, embedCode, embedUrl, madeWithPath } from '@/utils/sharing/embedCode';

describe('embedCode', () => {
  it('frames the map by its share code, with a link back to the site under it', () => {
    const code = embedCode({ origin: 'https://myplanetview.com', code: 'K7QX-M2PA-9RTW', name: 'Our travels' });
    const [frame, link] = code.split('\n');
    expect(frame).toBe(
      `<iframe src="https://myplanetview.com/embed/K7QX-M2PA-9RTW" title="Our travels: travel map" width="100%" height="${EMBED_HEIGHT}" style="border:0;max-width:100%" loading="lazy"></iframe>`,
    );
    expect(link).toBe(
      '<p style="margin:4px 0 0;font-size:13px"><a href="https://myplanetview.com/?utm_source=embed&amp;utm_medium=link&amp;utm_campaign=made-with">Made with My Planet View</a></p>',
    );
  });

  it('escapes a map’s name, so it can’t break out of the code', () => {
    const code = embedCode({ origin: 'https://x.test', code: 'AAAA-BBBB-CCCC', name: 'Tom & "Gigie" <3' });
    expect(code).toContain('title="Tom &amp; &quot;Gigie&quot; &lt;3: travel map"');
    expect(code).not.toContain('<3');
  });

  it('builds the frame’s address and the tagged home page', () => {
    expect(embedUrl('http://localhost:5173', 'AB CD')).toBe('http://localhost:5173/embed/AB%20CD');
    expect(madeWithPath('frame')).toBe('/?utm_source=embed&utm_medium=frame&utm_campaign=made-with');
    expect(MADE_WITH_TEXT).toBe('Made with My Planet View');
  });
});
