import React from 'react';
// Components
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import TextAreaInput from '@/components/ui/TextAreaInput';
import CheckboxInput from '@/components/ui/CheckboxInput';
import PlainOptionSelect from '@/components/ui/PlainOptionSelect';
import GroupedOptionSelect from '@/components/ui/GroupedOptionSelect';
import Button from '@/components/common/Button';
// Data
import { COUNTRY_OPTION_GROUPS, countryName } from '@/utils/map/countries';
import { postersFor } from '@/utils/map/posterData';
// Utils
import { OFFER_LIMITS, OFFER_PLACEMENTS } from '@/utils/offers/offerRules';
import { OFFER_KIND_OPTIONS, placementLabel } from '@/utils/offers/offerAdmin';
import { PLACEHOLDER_WORDS } from '@/utils/offers/offerForm';

const COUNTRY_GROUPS = [{ label: 'No country', options: [{ value: '', label: 'Anywhere (a general offer)' }] }, ...COUNTRY_OPTION_GROUPS];
const PLACEMENT_HINTS = {
  GALLERY: 'a card among the photos',
  SLIDESHOW: 'after the last photo',
  COUNTRY_PAGE: 'the public country guides',
  TRAVEL_DESK: 'when someone asks for ideas',
};

// Every field of an offer, shared by the new-offer and change dialogs: the key (only for
// a new one: it never changes), partner, kind, line, blurb, country and picture (what the
// card's sketch shows, so they come first), where it shows, the partner's link and its
// placeholders, weight, on or off and its days.
// `form` holds the inputs' values (utils/offers/offerForm.js); `onChange(field, value)`.
function OfferFields({ idPrefix, form, errors = {}, onChange, existingKey = null }) {
  const set = (field) => (e) => onChange(field, e.target.value);
  const poster = form.countryCode ? postersFor(form.countryCode)[0] : null;
  const posterKey = poster ? `visitCountryPosters/${poster.name}-800.avif` : null;
  const togglePlacement = (placement) =>
    onChange('placements', form.placements.includes(placement) ? form.placements.filter((p) => p !== placement) : [...form.placements, placement]);

  return (
    <>
      {existingKey ? (
        <p className='text-sm'>
          Key: <span className='break-all font-mono'>{existingKey}</span>. It never changes: imports find the offer by it.
        </p>
      ) : (
        <FormField
          id={`${idPrefix}-key`}
          label='Key'
          hint='2 to 64 lower-case letters, digits and dashes, e.g. booking-hotels-jp. It can’t change later: an import finds the offer by it.'
          error={errors.key}
          required
        >
          <TextInput value={form.key} onChange={set('key')} maxLength={64} autoComplete='off' autoCapitalize='none' spellCheck='false' />
        </FormField>
      )}

      <div className='grid gap-3 sm:grid-cols-2'>
        <FormField id={`${idPrefix}-partner`} label='Partner' hint='Who runs the offer, e.g. Booking.com.' error={errors.partner} required>
          <TextInput value={form.partner} onChange={set('partner')} maxLength={OFFER_LIMITS.partner} autoComplete='off' />
        </FormField>
        <FormField id={`${idPrefix}-kind`} label='Kind' hint='Drawn on the card when it has no picture.' error={errors.kind} required>
          <PlainOptionSelect value={form.kind} onChange={set('kind')} options={OFFER_KIND_OPTIONS} />
        </FormField>
      </div>

      <FormField id={`${idPrefix}-title`} label='Title' hint='The card’s line, e.g. Hotels in Kyoto.' error={errors.title} required>
        <TextInput value={form.title} onChange={set('title')} maxLength={OFFER_LIMITS.title} autoComplete='off' />
      </FormField>

      <FormField id={`${idPrefix}-blurb`} label='Blurb (optional)' hint={`A sentence under the line, up to ${OFFER_LIMITS.blurb} characters.`} error={errors.blurb}>
        <TextAreaInput value={form.blurb} onChange={set('blurb')} rows={2} maxLength={OFFER_LIMITS.blurb} />
      </FormField>

      <FormField
        id={`${idPrefix}-country`}
        label='Country'
        hint='The trips, photos and guides it fits. Anywhere: insurance, eSIMs, luggage and other offers for every trip.'
        error={errors.countryCode}
      >
        <GroupedOptionSelect value={form.countryCode} onChange={set('countryCode')} groups={COUNTRY_GROUPS} />
      </FormField>

      <div className='grid gap-2'>
        <FormField
          id={`${idPrefix}-image`}
          label='Picture (optional)'
          hint='A file in the public bucket, e.g. visitCountryPosters/jp-800.avif. Without one, the card draws its kind.'
          error={errors.imageKey}
        >
          <TextInput value={form.imageKey} onChange={set('imageKey')} maxLength={OFFER_LIMITS.imageKey} autoComplete='off' spellCheck='false' />
        </FormField>
        {posterKey && form.imageKey !== posterKey ? (
          <div className='grid justify-center'>
            <Button small quiet onClick={() => onChange('imageKey', posterKey)}>
              Use {countryName(form.countryCode)}’s poster
            </Button>
          </div>
        ) : null}
      </div>

      <fieldset className='grid gap-2' aria-describedby={errors.placements ? `${idPrefix}-placements-error` : undefined}>
        <legend className='text-center text-sm font-medium'>
          Shows on
          <span className='text-status-critical' aria-hidden='true'>
            {' '}
            *
          </span>
        </legend>
        <div className='grid gap-2 sm:grid-cols-2'>
          {OFFER_PLACEMENTS.map((placement) => (
            <CheckboxInput
              key={placement}
              id={`${idPrefix}-placement-${placement}`}
              checked={form.placements.includes(placement)}
              onChange={() => togglePlacement(placement)}
              label={
                <>
                  {placementLabel(placement)} <span className='text-xs opacity-70'>({PLACEMENT_HINTS[placement]})</span>
                </>
              }
              ariaInvalid={Boolean(errors.placements)}
              labelClassName='text-sm'
            />
          ))}
        </div>
        {errors.placements ? (
          <span id={`${idPrefix}-placements-error`} role='alert' className='block text-center text-xs text-status-critical'>
            {errors.placements}
          </span>
        ) : null}
      </fieldset>

      <FormField
        id={`${idPrefix}-url`}
        label='Partner’s link'
        hint={`It must start with https://. When someone clicks, we fill in ${PLACEHOLDER_WORDS}: the place, its two-letter country code, and the trip’s first and last days (YYYY-MM-DD), each left empty when we don’t know it. No other {…} is allowed.`}
        error={errors.url}
        required
      >
        <TextInput type='url' value={form.url} onChange={set('url')} maxLength={OFFER_LIMITS.url} autoComplete='off' spellCheck='false' />
      </FormField>

      <div className='grid gap-3 sm:grid-cols-2'>
        <FormField
          id={`${idPrefix}-weight`}
          label={`Weight (${OFFER_LIMITS.weight.min} to ${OFFER_LIMITS.weight.max})`}
          hint='How often it’s picked among the offers that fit a slot: 3 is three times as often as 1.'
          error={errors.weight}
          required
        >
          <TextInput
            type='number'
            inputMode='numeric'
            min={OFFER_LIMITS.weight.min}
            max={OFFER_LIMITS.weight.max}
            step={1}
            value={form.weight}
            onChange={set('weight')}
          />
        </FormField>
        <div className='grid content-center gap-1'>
          <CheckboxInput
            id={`${idPrefix}-active`}
            checked={form.active}
            onChange={(e) => onChange('active', e.target.checked)}
            label='On: it can show on cards and the Travel Desk'
            labelClassName='text-sm'
          />
          <span className='text-center text-xs opacity-70'>Off keeps its click counts.</span>
        </div>
      </div>

      <div className='grid gap-3 sm:grid-cols-2'>
        <FormField id={`${idPrefix}-first-day`} label='First day (optional)' hint='UTC. Empty: from now.' error={errors.firstDay}>
          <TextInput type='date' value={form.firstDay} onChange={set('firstDay')} />
        </FormField>
        <FormField id={`${idPrefix}-last-day`} label='Last day (optional)' hint='UTC. Empty: no end.' error={errors.lastDay}>
          <TextInput type='date' value={form.lastDay} onChange={set('lastDay')} />
        </FormField>
      </div>
    </>
  );
}

export default OfferFields;
