// Search result limits (Google/Bing/Yoast, see the SEO playbook)
export const MAX_TITLE = 60;
export const MIN_DESCRIPTION = 120;
export const MAX_DESCRIPTION = 156;

// Cut on a word boundary, never mid-word
const cutToWords = (text, max) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : text.slice(0, max)).trim();
};

// "Page | Brand", or the page alone when the brand doesn't fit
export function metaTitle(pageName, brand) {
  const name = String(pageName || '').trim();
  if (!brand) return cutToWords(name, MAX_TITLE);

  const withBrand = `${name} | ${brand}`;
  if (withBrand.length <= MAX_TITLE) return withBrand;
  return cutToWords(name, MAX_TITLE);
}

// "A, B and C"
const joinNames = (names) =>
  names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0] || '';

// A generated description: the lead sentence, then as many whole names as fit, never cut
export function listDescription(lead, names, { prefix = 'Posts include' } = {}) {
  const base = String(lead || '').trim();
  for (let count = names.length; count > 0; count--) {
    const text = `${base} ${prefix} ${joinNames(names.slice(0, count))}.`;
    if (text.length <= MAX_DESCRIPTION) return text;
  }
  return base;
}

// Problems with a description, empty when it's fine
export function descriptionProblems(text) {
  const value = String(text || '');
  const problems = [];
  if (value.length < MIN_DESCRIPTION) problems.push(`under ${MIN_DESCRIPTION} characters (${value.length})`);
  if (value.length > MAX_DESCRIPTION) problems.push(`over ${MAX_DESCRIPTION} characters (${value.length})`);
  if (/(\.\.\.|…)\s*$/.test(value)) problems.push('ends with an ellipsis');
  return problems;
}
