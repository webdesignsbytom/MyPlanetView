import React, { useId, useState } from 'react';
// Api
import { startGiftCheckout } from '@/api/giftsApi';
// Components
import PaperCard from '@/components/common/PaperCard';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import TextAreaInput from '@/components/ui/TextAreaInput';
// Utils
import { GIFT_MESSAGE_MAX, GIFT_TO_NAME_MAX, giftPrice, giftTitle } from '@/utils/gifts/giftWords';

// Buying a gift (docs/API.md "Gifts"): a year of Business or First Class at its yearly price,
// with who it's for and a few words if you like (they show on the gift's page), paid once in
// Stripe's Checkout. The code comes by email and on this page. Locked until the email is verified.
function GiftBuyCard({ offers, paymentsEnabled, locked }) {
  const uid = useId();
  const [plan, setPlan] = useState('PREMIUM');
  const [toName, setToName] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const chosen = offers.find((offer) => offer.plan === plan) ?? offers[0];

  const buy = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { url } = await startGiftCheckout({ plan: chosen.plan, toName: toName.trim() || null, message: message.trim() || null });
      window.location.assign(url);
    } catch (err) {
      setError(err.friendlyMessage || 'The payment page couldn’t be opened. Please try again.');
      setBusy(false);
    }
  };

  return (
    <PaperCard title='Choose the gift' titleId={`${uid}-title`} kicker='A gift'>
      <p>
        A year of Business or First Class for someone’s whole life of travel on one map: posters, a passport of landmark
        stamps, and room for every photo. Their year starts the day they redeem it.
      </p>
      <form className='grid gap-4' onSubmit={buy}>
        <fieldset className='grid gap-2'>
          <legend className='pb-2 font-medium'>The gift</legend>
          <div className='grid gap-2 sm:grid-cols-2'>
            {offers.map((offer) => (
              <label
                key={offer.plan}
                className={`relative grid cursor-pointer gap-1 border-2 p-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-colour6 ${
                  plan === offer.plan ? 'paper-aged border-poster-red text-poster-ink shadow-paper' : 'border-dashed border-poster-brown/60 bg-paper-cream'
                }`}
              >
                <input type='radio' name={`${uid}-plan`} value={offer.plan} checked={plan === offer.plan} onChange={() => setPlan(offer.plan)} className='sr-only' />
                <span className='font-travel text-lg uppercase tracking-wide'>{giftTitle(offer)}</span>
                <span className='text-sm'>{giftPrice(offer)}, paid once</span>
              </label>
            ))}
          </div>
        </fieldset>
        <FormField id={`${uid}-to`} label='Who it’s for (optional)' align='start'>
          <TextInput value={toName} onChange={(e) => setToName(e.target.value)} maxLength={GIFT_TO_NAME_MAX} autoComplete='off' />
        </FormField>
        <FormField id={`${uid}-message`} label='A few words on the gift (optional)' hint={`Up to ${GIFT_MESSAGE_MAX} characters.`} align='start'>
          <TextAreaInput value={message} onChange={(e) => setMessage(e.target.value)} maxLength={GIFT_MESSAGE_MAX} rows={3} />
        </FormField>
        <InlineAlert>{error}</InlineAlert>
        {locked ? (
          <p className='text-sm'>Verify your email address to buy a gift. The link is in the email we sent you.</p>
        ) : !paymentsEnabled ? (
          <p className='text-sm'>Payments aren’t switched on yet, so gifts can’t be bought just now.</p>
        ) : (
          <Button type='submit' busy={busy}>
            Pay {chosen ? giftPrice(chosen) : ''} for the gift
          </Button>
        )}
      </form>
    </PaperCard>
  );
}

export default GiftBuyCard;
