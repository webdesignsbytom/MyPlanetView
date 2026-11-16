import React, { useMemo } from 'react';
// Hooks
import useOffers from '@/hooks/useOffers';
// Api
import { offerClickUrl } from '@/api/offersApi';
// Components
import PaperCard from '@/components/common/PaperCard';
import OfferBrochure from '@/components/offers/OfferBrochure';
import TravelDesk from '@/components/offers/TravelDesk';
// Utils
import { chooseOffers } from '@/utils/offers/chooseOffer';
import { choiceContext, linkForChoice } from '@/utils/offers/offerContext';
import { PARTNER_OFFERS_NOTE } from '@/utils/offers/offerKinds';

const SLOTS = 2;

/**
 * A country guide's travel offers (docs/FEATURE-PLAN.md, "Ads: travel affiliate cards"
 * and "Travel Desk"): the Travel Desk button, and two COUNTRY_PAGE cards (this country's
 * offers, of two kinds where it can, else general ones) for every visitor, whatever their
 * plan: the guides are public travel pages, not anyone's album.
 * The page is pre-rendered, so the words and the button are in the first render and the
 * cards come once the offers arrive (in an effect); nothing here reads storage or the date.
 * `guide` is `{ code, name, slug, months }`; `named` the name as a sentence says it.
 */
function CountryTravelOffers({ guide, named }) {
  const { offers } = useOffers();
  const cards = useMemo(() => {
    const context = { country: guide.code };
    return chooseOffers(offers, choiceContext('COUNTRY_PAGE', context), `country-page:${guide.code}`, SLOTS).map((choice) => ({
      offer: choice.offer,
      href: offerClickUrl(choice.offer, { placement: 'COUNTRY_PAGE', ...linkForChoice(choice, context) }),
    }));
  }, [offers, guide.code]);
  const deskCountries = useMemo(() => [guide.code], [guide.code]);

  return (
    <PaperCard title='Plan your trip' titleId='country-offers-heading' bodyClassName='gap-4'>
      <div className='grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto]'>
        <p className='max-w-prose leading-relaxed'>
          Places to stay, tours, flights and travel insurance for {named}, from our travel partners: open the Travel Desk when
          you’re ready to book.
        </p>
        <TravelDesk countryCodes={deskCountries} guideOnPage={guide} />
      </div>
      {cards.length ? (
        <ul className='grid gap-4 sm:grid-cols-2'>
          {cards.map((card) => (
            <li key={card.offer.id} className='grid'>
              <OfferBrochure offer={card.offer} href={card.href} />
            </li>
          ))}
        </ul>
      ) : null}
      <p className='text-sm text-colour5'>{PARTNER_OFFERS_NOTE}</p>
    </PaperCard>
  );
}

export default CountryTravelOffers;
