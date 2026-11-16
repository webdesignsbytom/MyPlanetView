import React, { useEffect, useRef, useState } from 'react';
// Api
import client from '@/api/client';
// Data
import { emptyContactFormData } from '@/utils/data/formData';
// Constants
import { SUBMIT_CONTACT_FORM_API } from '@/utils/constants/apiRoutes';
import { EMAIL_MAX_LENGTH, isValidEmail, serverText } from '@/utils/regex/regex';
// Components
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import TextAreaInput from '@/components/ui/TextAreaInput';
import FormAlert from '@/components/forms/FormAlert';

// The server's limits (server/src/controllers/contact.js); longer text would be cut short
const NAME_MAX_LENGTH = 120;
const MESSAGE_MAX_LENGTH = 2000;
const SEND_FAILED = 'Your message could not be sent. Please try again.';

// The contact form: name, email and a message, nothing else
function ContactForm() {
  const submitStates = ['waiting', 'inprogress', 'failed', 'success'];

  const [formData, setFormData] = useState(emptyContactFormData);
  const [submitState, setSubmitState] = useState(submitStates[0]);
  const [failure, setFailure] = useState(SEND_FAILED);
  const [errors, setErrors] = useState({});

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const messageRef = useRef(null);
  const alertRef = useRef(null);

  // After a send, focus the alert saying how it went: the Send button was disabled while
  // sending, which dropped focus, and the alert only exists once it has a message
  useEffect(() => {
    if (submitState === 'failed' || submitState === 'success') alertRef.current?.focus();
  }, [submitState]);

  const handleChange = (e) => {
    setSubmitState(submitStates[0]);

    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  // The checks the server makes, so a form it would refuse is never sent
  const validateForm = () => {
    const newErrors = {};

    if (!serverText(formData.name)) newErrors.name = 'Please tell us your name';
    if (!formData.email.trim()) newErrors.email = 'Please add an email address so we can reply';
    else if (!isValidEmail(formData.email)) newErrors.email = 'Please enter a full email address, like name@example.com';
    if (!serverText(formData.message)) newErrors.message = 'Please write a message';

    return newErrors;
  };

  const focusFirstInvalidField = (validationErrors) => {
    if (validationErrors.name && nameRef.current)
      return nameRef.current.focus();
    if (validationErrors.email && emailRef.current)
      return emailRef.current.focus();
    if (validationErrors.message && messageRef.current)
      return messageRef.current.focus();
    if (alertRef.current) return alertRef.current.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitState(submitStates[1]);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmitState(submitStates[0]);
      focusFirstInvalidField(validationErrors);
      return;
    }

    try {
      await client.post(SUBMIT_CONTACT_FORM_API, formData, false);

      setSubmitState(submitStates[3]);
      setFormData(emptyContactFormData);
    } catch (err) {
      console.error('Unable to submit contact request', err);
      // The server's own reason when it refused the form
      setFailure(err?.response?.status === 400 && err.friendlyMessage ? err.friendlyMessage : SEND_FAILED);
      setSubmitState(submitStates[2]);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='grid gap-y-4 md:gap-y-6'
      noValidate
    >
      {/* Name and email */}
      <section className='grid gap-4 lg:grid-cols-2'>
        <FormField id='name' label='Your name' required error={errors.name}>
          <TextInput
            refProp={nameRef}
            name='name'
            autoComplete='name'
            value={formData.name}
            onChange={handleChange}
            maxLength={NAME_MAX_LENGTH}
            required
          />
        </FormField>

        <FormField id='email' label='Email' required error={errors.email}>
          <TextInput
            refProp={emailRef}
            type='email'
            name='email'
            autoComplete='email'
            value={formData.email}
            onChange={handleChange}
            maxLength={EMAIL_MAX_LENGTH}
            required
          />
        </FormField>
      </section>

      {/* Message */}
      <FormField
        id='message'
        label='Your message'
        required
        error={errors.message}
      >
        <TextAreaInput
          refProp={messageRef}
          name='message'
          value={formData.message}
          onChange={handleChange}
          rows={6}
          maxLength={MESSAGE_MAX_LENGTH}
          required
        />
      </FormField>

      {/* Submit */}
      <div className='grid items-center'>
        <button
          type='submit'
          className='btn-poster'
          disabled={submitState === submitStates[1]}
        >
          {submitState === submitStates[1] ? 'Sending…' : 'Send message'}
        </button>
      </div>

      <FormAlert
        innerRef={alertRef}
        message={
          submitState === submitStates[2]
            ? failure
            : submitState === submitStates[3]
              ? 'Thanks, your message is on its way. We will reply by email.'
              : ''
        }
        variant={submitState === submitStates[3] ? 'success' : 'error'}
      />
    </form>
  );
}

export default ContactForm;
