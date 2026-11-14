import {
  Title,
  Meta,
  Link as HeadLink,
} from 'react-head';
// Constants
import {
  CompanyName,
  FULL_BUSINESS_URL,
  PageMediaHelper,
  SITE_LANGUAGE,
} from '../../utils/constants/constants';
import { HOME_PAGE_URL } from '../../utils/constants/routes';
// SEO
import getCanonical from '../../utils/seo/getCanonical';
import { metaTitle } from '../../utils/seo/metaText';

// Default desc for pages without their own
const DEFAULT_DESC = `${CompanyName} provides professional web development, design, and digital solutions.`;

export const HelmetItem = ({
  PageName,
  title: fullTitle,
  desc = DEFAULT_DESC,
  canonicalPath = HOME_PAGE_URL,
  ogImage,
  additionalMeta = [],
  structuredData = null,
  indexing = 'index,follow',
}) => {
  // Full title wins (home); otherwise 'Page | Brand' within 60 characters
  const title = fullTitle || metaTitle(PageName, CompanyName);
  const url = getCanonical(canonicalPath);
  const image =
    ogImage ||
    PageMediaHelper?.('homePreview') ||
    `${FULL_BUSINESS_URL}/brand/og-default.jpg`;

  const schemaArray = [structuredData].flat().filter(Boolean);

  // Skip default og/twitter keys already in additionalMeta
  const suppliedKeys = new Set(
    additionalMeta.map((m) => m.property || m.name)
  );

  const baseSocial = [
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: CompanyName },
    { property: 'og:locale', content: SITE_LANGUAGE.replace('-', '_') },
    { property: 'og:title', content: title },
    { property: 'og:description', content: desc || '' },
    { property: 'og:url', content: url },
    { property: 'og:image', content: image },

    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: desc || '' },
    { name: 'twitter:image', content: image },
  ].filter((m) => !suppliedKeys.has(m.property || m.name));

  return (
    <>
      <Title>{title}</Title>

      <Meta name='robots' content={indexing} />

      {desc && <Meta name='description' content={desc} />}

      <HeadLink rel='canonical' href={url} />

      {[...baseSocial, ...additionalMeta].map((meta, i) => (
        <Meta key={i} {...meta} />
      ))}

      {schemaArray.map((data, i) => (
        <script key={i} type='application/ld+json'>
          {JSON.stringify(data)}
        </script>
      ))}
    </>
  );
};