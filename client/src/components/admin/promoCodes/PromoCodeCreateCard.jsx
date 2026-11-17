import React, { useState } from 'react';
// Api
import { createPromoCode } from '@/api/promoApi';
// Components
import PaperCard from '@/components/common/PaperCard';
import Button from '@/components/common/Button';
import InlineAlert from '@/components/common/InlineAlert';
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import PromoCodeFields from './PromoCodeFields';
// Utils
import { emptyPromoForm, promoBodyFrom } from '@/utils/plans/promoCodeForm';
import { PROMO_OFFER_CHOICES } from '@/utils/plans/promoCodes';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import { planOf } from '@/utils/constants/plans';
import { PROMO_TRIAL_DAYS } from '@/utils/plans/promoCodes';

// A new code for a creator (docs/API.md, "Promo codes"): the code they'll print, a label
// for the admins, and optional limits. Every code gives its followers the same first month
// free. `onCreated` gets the new code (with its counts at 0).
function PromoCodeCreateCard({ onCreated }) {
  const [form, setForm] = useState(emptyPromoForm);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);

  const change = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setDone(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setDone(null);
    const parsed = promoBodyFrom(form);
    setErrors(parsed.ok ? {} : parsed.errors);
    if (!parsed.ok) return;

    setBusy(true);
    try {
      const { promoCode } = await createPromoCode(parsed.body);
      onCreated(promoCode);
      setDone(
        promoCode.freePlan
          ? `${promoCode.code} is ready: whoever signs up with it gets ${planOf(promoCode.freePlan).name} free, for life.`
          : `${promoCode.code} is ready: their followers get their first month free.`,
      );
      setForm(emptyPromoForm());
    } catch (err) {
      setError(err.friendlyMessage || 'The code couldn’t be made.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PaperCard title='New code' titleId='admin-new-promo-heading' className='paper-fields'>
      <p className='text-sm'>
        One code per creator, so you can see who brings sign-ups. Their followers get their first month free on Business
        or First Class: a {PROMO_TRIAL_DAYS}-day trial when they first upgrade, with a card. Give the creator their own
        two years of First Class from the users page (Membership, 24 months). A creator given a free membership for
        promoting the site must label their post as an ad.
      </p>
      <form className='grid gap-3' onSubmit={submit} noValidate aria-labelledby='admin-new-promo-heading'>
        <FormField
          id='new-promo-code'
          label='Code'
          hint='3 to 24 letters and numbers, e.g. SAMTRAVELS. It can’t be changed later: it’ll be in their posts.'
          error={errors.code}
          required
        >
          <TextInput
            value={form.code}
            onChange={(e) => change('code', e.target.value)}
            maxLength={40}
            autoComplete='off'
            autoCapitalize='characters'
            spellCheck='false'
          />
        </FormField>
        <FormField
          id='new-promo-offer'
          label='What it gives'
          hint='Your own codes can give Business or First Class for life, from sign-up. It can’t be changed later.'
        >
          <PlainOptionSelect value={form.freePlan} options={PROMO_OFFER_CHOICES} onChange={(e) => change('freePlan', e.target.value)} />
        </FormField>
        <PromoCodeFields idPrefix='new-promo' form={form} errors={errors} onChange={change} />
        <InlineAlert>{error}</InlineAlert>
        {done ? <InlineAlert tone='good'>{done}</InlineAlert> : null}
        <div className='grid justify-end'>
          <Button type='submit' busy={busy}>
            Make code
          </Button>
        </div>
      </form>
    </PaperCard>
  );
}

export default PromoCodeCreateCard;
