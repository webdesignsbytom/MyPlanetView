// A map on someone's own website (23 Nov 2026, the user's wish: every view advertises the site,
// with a link back): the code a blogger pastes in, an iframe of EmbedPage and, under it, a plain
// "Made with My Planet View" link in their own page, which search engines count as a link to
// us. The map must have link access on (the frame opens it by its share code). Pure.
import { CompanyName } from '@/utils/constants/constants';
import { embedPath } from '@/utils/constants/routes';

export const EMBED_HEIGHT = 480;

// The home page, tagged so the site's analytics counts the visits embeds bring
export const madeWithPath = (medium) => `/?utm_source=embed&utm_medium=${medium}&utm_campaign=made-with`;
export const MADE_WITH_TEXT = `Made with ${CompanyName}`;

const attribute = (text) => String(text).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The frame's address on the site at `origin` ("https://…", no trailing slash). */
export const embedUrl = (origin, code) => `${origin}${embedPath(code)}`;

/** The HTML to paste: the frame, then the link back under it. */
export function embedCode({ origin, code, name }) {
  const frame =
    `<iframe src="${attribute(embedUrl(origin, code))}" title="${attribute(`${name}: travel map`)}" ` +
    `width="100%" height="${EMBED_HEIGHT}" style="border:0;max-width:100%" loading="lazy"></iframe>`;
  const link = `<p style="margin:4px 0 0;font-size:13px"><a href="${attribute(`${origin}${madeWithPath('link')}`)}">${attribute(MADE_WITH_TEXT)}</a></p>`;
  return `${frame}\n${link}`;
}
