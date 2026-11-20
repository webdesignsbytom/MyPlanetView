import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
// Constants
import { CompanyName } from '@/utils/constants/constants';
import { LEGAL_AGREEMENTS_PAGE_URL } from '@/utils/constants/routes';
// Data
import { helmetData } from '@/utils/data/helmetData';
import { TermsSectionsArray, PrivacySectionsArray, LEGAL_VERSION } from '@/utils/data/termsData';
import {
  termsAndPoliciesAdditionalMeta,
  termsAndPoliciesStructuredData,
} from '@/utils/data/metaData';
// Components
import { HelmetItem } from '@/components/utils/HelmetItem';
import PublicPageLayout from '@/components/common/PublicPageLayout';
import PageTitleCard from '@/components/common/PageTitleCard';
import PaperCard from '@/components/common/PaperCard';
import BackToTopButton from '@/components/utils/BackToTopButton';
import LegalContents from '@/components/legal/LegalContents';
import LegalArticle from '@/components/legal/LegalArticle';

const GROUP_LABELS = {
  agreements: 'Agreements',
  policies: 'Policies',
  compliance: 'Compliance',
  other: 'Other',
};

const groupBy = (sections) =>
  sections.reduce((groups, section) => {
    (groups[section.group] ||= []).push(section);
    return groups;
  }, {});

// The terms and the privacy policy, on cream paper: a title card, a contents card
// (sticky beside the text on wide screens) and one paper card per document.
function TermAndPoliciesPage() {
  const pageHelmet = helmetData[LEGAL_AGREEMENTS_PAGE_URL];
  const location = useLocation();
  // The section in the address, read after the first render: the pre-rendered page was made
  // without one, so hydration matches, and the contents mark it then (19 Nov 2026, the audit)
  const [activeHash, setActiveHash] = useState('');
  useEffect(() => {
    setActiveHash((location.hash || '').replace('#', ''));
  }, [location.hash]);

  const termsGroups = useMemo(() => groupBy(TermsSectionsArray), []);
  const privacyGroups = useMemo(() => groupBy(PrivacySectionsArray), []);

  const handleJump = useCallback((e, id) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target.setAttribute('tabIndex', '-1');
    target.focus({ preventScroll: true });
    window.history.replaceState(null, '', `#${id}`);
    setActiveHash(id);
  }, []);

  const isCurrent = (id) => activeHash === id;

  return (
    <>
      <HelmetItem
        PageName={pageHelmet.pageName}
        desc={pageHelmet.desc}
        indexing={pageHelmet.indexing}
        additionalMeta={termsAndPoliciesAdditionalMeta}
        structuredData={[termsAndPoliciesStructuredData]}
        canonicalPath={LEGAL_AGREEMENTS_PAGE_URL}
      />

      <PublicPageLayout mainProps={{ 'aria-labelledby': 'legal-title', 'aria-describedby': 'legal-version' }}>
        <div className='grid w-full gap-4 lg:gap-2 xl:grid-cols-[minmax(0,1fr)_18rem]'>
          <div className='xl:col-span-2'>
            <PageTitleCard
              page='Legal'
              title='Terms and privacy'
              headingId='legal-title'
              subtitle={`The terms of using ${CompanyName}, and how we look after your data. Version ${LEGAL_VERSION.version}, last updated ${LEGAL_VERSION.lastUpdated}.`}
              subtitleId='legal-version'
              stamp={['Signed', 'and', 'sealed']}
            />
          </div>

          <LegalContents
            termsGroups={termsGroups}
            privacyGroups={privacyGroups}
            groupLabels={GROUP_LABELS}
            onJump={handleJump}
            isCurrent={isCurrent}
            className='xl:sticky xl:top-2 xl:col-start-2 xl:row-start-2 xl:self-start'
          />

          <div className='grid min-w-0 content-start gap-4 lg:gap-2 xl:col-start-1 xl:row-start-2'>
            <PaperCard
              id='terms-and-conditions'
              title='Terms & Conditions'
              titleId='terms-and-conditions-title'
              className='scroll-mt-4'
              bodyClassName='divide-y-2 divide-dashed divide-poster-brown gap-0'
            >
              {TermsSectionsArray.map((section) => (
                <LegalArticle key={section.id} {...section} />
              ))}
            </PaperCard>

            <PaperCard
              id='privacy-policy'
              title='Privacy & Data'
              titleId='privacy-title'
              className='scroll-mt-4'
              bodyClassName='divide-y-2 divide-dashed divide-poster-brown gap-0'
            >
              {PrivacySectionsArray.map((section) => (
                <LegalArticle key={section.id} {...section} />
              ))}
            </PaperCard>
          </div>
        </div>

        <BackToTopButton />
      </PublicPageLayout>
    </>
  );
}

export default TermAndPoliciesPage;
