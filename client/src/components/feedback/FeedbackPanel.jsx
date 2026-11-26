import React, { useEffect, useId, useRef, useState } from 'react';
// Components
import MapPanel from '@/components/map/MapPanel';
import Button from '@/components/common/Button';
import FormField from '@/components/ui/FormField';
import RadioInput from '@/components/ui/RadioInput';
import RadioGroup from '@/components/ui/RadioGroup';
import TextAreaInput from '@/components/ui/TextAreaInput';
// API
import { sendFeedback } from '@/api/feedbackApi';
// Utils
import {
  FEEDBACK_IMPACTS,
  FEEDBACK_KINDS,
  FEEDBACK_LIMITS,
  emptyFeedbackForm,
  feedbackBody,
  feedbackFormProblem,
  feedbackKind,
  pageDetails,
} from '@/utils/feedback/feedbackForm';
import { uploadScreenshot } from '@/utils/feedback/uploadScreenshot';

const SCREENSHOT_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/avif,.jpg,.jpeg,.png,.webp,.gif,.avif';

// One of the four "What's this about?" choices: a card with its name and a line under it
function KindChoice({ kind, chosen, name, onChoose }) {
  return (
    <RadioInput
      id={`${name}-${kind.id}`}
      name={name}
      value={kind.id}
      checked={chosen}
      onChange={() => onChoose(kind.id)}
      wrapperClassName={`relative border-2 px-3 py-2 ${chosen ? 'border-poster-red-deep bg-field' : 'border-poster-brown/50'}`}
      label={
        <span className='grid gap-0.5'>
          <span className='font-semibold'>{kind.label}</span>
          <span className='text-xs opacity-80'>{kind.hint}</span>
        </span>
      }
    />
  );
}

// The screenshot: a button to choose one, its preview and a way to take it off, with how to take one
function ScreenshotField({ file, onChoose, onRemove, disabled }) {
  const inputRef = useRef(null);
  const uid = useId();
  const [preview, setPreview] = useState(null);
  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => {
      URL.revokeObjectURL(url);
      setPreview(null);
    };
  }, [file]);

  return (
    <div className='grid gap-2' role='group' aria-labelledby={`${uid}-label`} aria-describedby={`${uid}-tip`}>
      <p id={`${uid}-label`} className='text-sm font-medium'>
        A screenshot (if you like)
      </p>
      <p id={`${uid}-tip`} className='text-xs opacity-80'>
        A picture of your screen helps us see what you saw. On a phone, press the power and volume up buttons together. On Windows, press the Windows key, Shift
        and S. On a Mac, press Shift, Command and 4.
      </p>
      {file && preview ? (
        <img src={preview} alt='The screenshot you chose' className='max-h-48 w-full border-2 border-poster-brown bg-field object-contain' data-feedback-preview />
      ) : null}
      <input
        ref={inputRef}
        type='file'
        accept={SCREENSHOT_ACCEPT}
        aria-label='Choose a screenshot'
        tabIndex={-1}
        className='sr-only'
        data-feedback-screenshot-input
        onChange={(e) => {
          const chosen = e.target.files?.[0];
          e.target.value = '';
          if (chosen) onChoose(chosen);
        }}
      />
      <div className='grid gap-2 sm:grid-cols-2'>
        <Button quiet disabled={disabled} onClick={() => inputRef.current?.click()}>
          {file ? 'Choose another picture' : 'Add a screenshot'}
        </Button>
        {file ? (
          <Button quiet disabled={disabled} onClick={onRemove}>
            Take the picture off
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Feedback from the map (25 Nov 2026, the user's wish: "report a bug, request a feature ... simple
 * for a non technical person ... and upload a screenshot if needed"; docs/API.md "Feedback"): what
 * it's about, a few plain questions for that kind, a screenshot if they like, and what the page
 * sends with it. The screenshot goes to the private bucket as the report is sent. After sending,
 * a thank-you with the report's reference. For signed-in people (the toolbar's Feedback stamp).
 */
function FeedbackPanel({ mapId = null, styleId = null, phone = false, onClose }) {
  const uid = useId();
  const [form, setForm] = useState(emptyFeedbackForm);
  const [screenshot, setScreenshot] = useState(null);
  const [problem, setProblem] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sent, setSent] = useState(null);
  const kind = feedbackKind(form.kind);

  const set = (field) => (e) => {
    const value = e.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  async function send(event) {
    event.preventDefault();
    const wrong = feedbackFormProblem(form);
    if (wrong) {
      setProblem(wrong);
      return;
    }
    setProblem(null);
    setBusy(true);
    setProgress(0);
    try {
      const screenshotKey = screenshot ? await uploadScreenshot(screenshot, setProgress) : null;
      const body = feedbackBody(form, {
        page: typeof window !== 'undefined' ? window.location.pathname : null,
        mapId,
        context: pageDetails({ style: styleId, phone }),
        screenshotKey,
      });
      const { feedback } = await sendFeedback(body);
      setSent(feedback);
    } catch (err) {
      setProblem(err?.friendlyMessage || err?.message || 'Your message couldn’t be sent. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  function startAgain() {
    setForm(emptyFeedbackForm());
    setScreenshot(null);
    setSent(null);
    setProblem(null);
  }

  if (sent) {
    return (
      <MapPanel title='Feedback' onClose={onClose}>
        <div className='grid gap-3 text-center' role='status' data-feedback-sent>
          <p className='font-travel text-2xl uppercase tracking-wide text-colour9'>Thank you!</p>
          <p>We’ve got your message and we’ll read it soon.</p>
          {sent.reference ? (
            <p className='text-sm'>
              Its reference is <strong data-feedback-reference>{sent.reference}</strong>, if you need to tell us about it again.
            </p>
          ) : null}
          <div className='grid gap-2 sm:grid-cols-2'>
            <Button quiet onClick={startAgain}>
              Send another
            </Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </MapPanel>
    );
  }

  return (
    <MapPanel title='Feedback' onClose={onClose}>
      <form className='grid gap-4' onSubmit={send} noValidate data-feedback-form>
        <p className='text-sm'>Something not working, an idea, or a question? Tell us in your own words. There are no wrong answers.</p>

        <fieldset className='grid gap-2'>
          <legend className='mb-2 block text-sm font-medium'>What’s this about?</legend>
          {FEEDBACK_KINDS.map((option) => (
            <KindChoice
              key={option.id}
              kind={option}
              name={`${uid}-kind`}
              chosen={form.kind === option.id}
              onChoose={(id) => setForm((current) => ({ ...current, kind: id }))}
            />
          ))}
        </fieldset>

        {kind ? (
          <>
            <FormField id={`${uid}-details`} label={kind.details.label} required align='start'>
              <TextAreaInput value={form.details} onChange={set('details')} placeholder={kind.details.placeholder} rows={4} maxLength={FEEDBACK_LIMITS.details} required />
            </FormField>
            {kind.expected ? (
              <FormField id={`${uid}-expected`} label={kind.expected.label} align='start'>
                <TextAreaInput value={form.expected} onChange={set('expected')} placeholder={kind.expected.placeholder} rows={2} maxLength={FEEDBACK_LIMITS.expected} />
              </FormField>
            ) : null}
            {kind.why ? (
              <FormField id={`${uid}-why`} label={kind.why.label} align='start'>
                <TextAreaInput value={form.why} onChange={set('why')} placeholder={kind.why.placeholder} rows={2} maxLength={FEEDBACK_LIMITS.why} />
              </FormField>
            ) : null}
            {form.kind === 'PROBLEM' ? (
              <RadioGroup
                legend='How much does it get in your way?'
                name={`${uid}-impact`}
                value={form.impact}
                onChange={set('impact')}
                options={FEEDBACK_IMPACTS.map((impact) => ({ value: impact.id, label: impact.label }))}
              />
            ) : null}
            <ScreenshotField file={screenshot} onChoose={setScreenshot} onRemove={() => setScreenshot(null)} disabled={busy} />
            <p className='text-xs opacity-80' data-feedback-also>
              With your message we also send the page you’re on, your browser and the size of your screen, so we can see what you saw. Never your photos or your
              password.
            </p>
          </>
        ) : null}

        {problem ? (
          <p role='alert' className='text-sm text-status-critical'>
            {problem}
          </p>
        ) : null}
        {busy && screenshot ? (
          <p className='text-sm' aria-live='polite'>
            {progress > 0 ? `Sending the screenshot: ${Math.round(progress * 100)}%` : 'Getting the screenshot ready…'}
          </p>
        ) : null}
        <Button type='submit' busy={busy} disabled={!kind}>
          Send
        </Button>
      </form>
    </MapPanel>
  );
}

export default FeedbackPanel;
