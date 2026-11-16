import React from 'react';
// Utils
import { countryPageMeta, nameInSentence } from '@/utils/countries/countryMeta';
import { countryPageSchema } from '@/utils/countries/countrySchema';
import { landmarkGuidePhoto } from '@/utils/countries/guidePhotos';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import PublicPageLayout from '@/components/common/PublicPageLayout';
import PaperCard from '@/components/common/PaperCard';
import CountryPageHeader from '@/components/countries/CountryPageHeader';
import CountryWhenToGo from '@/components/countries/CountryWhenToGo';
import CountryCulture from '@/components/countries/CountryCulture';
import CountryLandmarks from '@/components/countries/CountryLandmarks';
import GuidePhoto from '@/components/countries/GuidePhoto';
import CountryFacts from '@/components/countries/CountryFacts';
import CountryStartMap from '@/components/countries/CountryStartMap';
import CountryTravelOffers from '@/components/countries/CountryTravelOffers';

/**
 * A country guide, /countries/<slug> (public, pre-rendered, indexed once checked): the
 * poster and headline, an overview, when to go, culture and customs, the landmarks, the
 * practical facts, travel offers (the Travel Desk and two partner cards, for every visitor)
 * and a way to start a map. `page` is the content file with the country's
 * name and landmarks (lazyPages.js loads it with this code, so the first render is whole).
 * Drafts exist only on the dev server, and are never indexed. Beside the overview, the
 * country's first landmark with a photo (its well-known ones come first).
 */
function CountryPage({ page }) {
  const meta = countryPageMeta(page, page.name);
  const named = nameInSentence(page.name);
  const isDraft = page.status !== 'checked';
  const featured = page.landmarks.find((landmark) => landmark.photo);
  const featuredPhoto = featured ? landmarkGuidePhoto(featured) : null;

  return (
    <>
      <HelmetItem
        PageName={meta.pageName}
        title={meta.title}
        desc={meta.desc}
        indexing={isDraft ? 'noindex,nofollow' : 'index,follow'}
        structuredData={[countryPageSchema(page, meta)]}
        canonicalPath={meta.path}
      />

      <PublicPageLayout mainProps={{ 'aria-labelledby': 'country-title', 'aria-describedby': 'country-summary' }}>
        <CountryPageHeader page={page} />

        <PaperCard title='Overview' titleId='country-overview-heading'>
          <div className={`grid gap-6 ${featuredPhoto ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start' : ''}`}>
            <div className='grid content-start gap-3'>
              {page.overview.map((paragraph) => (
                <p key={paragraph} className='max-w-prose leading-relaxed'>
                  {paragraph}
                </p>
              ))}
            </div>
            {featuredPhoto ? (
              <div className='grid w-full max-w-sm justify-self-center lg:max-w-none'>
                <GuidePhoto
                  photo={featuredPhoto}
                  alt={`${featured.name}, ${page.name}`}
                  caption={featured.name}
                  frameClass={featuredPhoto.height > featuredPhoto.width ? 'aspect-[3/4]' : 'aspect-[4/3]'}
                  tilt='rotate-1'
                />
              </div>
            ) : null}
          </div>
        </PaperCard>

        <CountryWhenToGo name={page.name} whenToGo={page.whenToGo} />
        <CountryCulture culture={page.culture} />
        <CountryLandmarks named={named} landmarks={page.landmarks} />
        <CountryFacts name={page.name} facts={page.facts} />

        <CountryTravelOffers
          guide={{ code: page.code, name: page.name, slug: page.slug, months: page.whenToGo.months }}
          named={named}
        />

        <CountryStartMap named={named} />
      </PublicPageLayout>
    </>
  );
}

export default CountryPage;
