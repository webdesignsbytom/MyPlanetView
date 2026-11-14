import React, { useEffect, useRef, useState } from 'react';
// Api
import client from '@/api/client';
// Data
import { emptyContactFormData } from '@/utils/data/formData';
// Constants
import { SUBMIT_CONTACT_FORM_API } from '@/utils/constants/apiRoutes';
import {
  IMAGE_ACCEPT,
  MAX_IMAGE_SIZE_MB,
} from '@/utils/media/mediaConstants';
// Components
import FormField from '@/components/ui/FormField';
import TextInput from '@/components/ui/TextInput';
import TextAreaInput from '@/components/ui/TextAreaInput';
import FormAlert from '@/components/forms/FormAlert';
import UploadFileInput from '@/components/ui/UploadFileInput';
// Upload service
import { presignAndUpload } from '@/utils/media/uploadViaMediaService';

const ACCEPT = IMAGE_ACCEPT;

function ContactForm() {
  const submitStates = ['waiting', 'inprogress', 'failed', 'success'];

  const [formData, setFormData] = useState(emptyContactFormData);
  const [submitState, setSubmitState] = useState(submitStates[0]);
  const [errors, setErrors] = useState({});

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const messageRef = useRef(null);
  const alertRef = useRef(null);

  // attachment state
  const [attachment, setAttachment] = useState({
    file: null,
    previewUrl: '',
  });
  const fileInputRef = useRef(null);

  const isObjectURL = (url) =>
    typeof url === 'string' && url.startsWith('blob:');

  useEffect(() => {
    return () => {
      if (attachment.previewUrl && isObjectURL(attachment.previewUrl)) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    };
  }, [attachment.previewUrl]);

  const validateAttachment = (file) => {
    if (!file) return { ok: false, reason: 'No file selected.' };

    const isImage = file.type?.startsWith('image/');

    if (!isImage) {
      return { ok: false, reason: 'Only images are allowed.' };
    }

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_IMAGE_SIZE_MB) {
      return {
        ok: false,
        reason: `File too large (>${MAX_IMAGE_SIZE_MB}MB).`,
      };
    }

    return { ok: true };
  };

  const handleFileSelect = (file) => {
    setSubmitState(submitStates[0]);

    const ok = validateAttachment(file);
    if (!ok.ok) {
      setErrors((prev) => ({ ...prev, attachment: ok.reason }));
      return;
    }

    const url = URL.createObjectURL(file);

    if (attachment.previewUrl && isObjectURL(attachment.previewUrl)) {
      URL.revokeObjectURL(attachment.previewUrl);
    }

    setErrors((prev) => ({ ...prev, attachment: '' }));
    setAttachment({ file, previewUrl: url });
  };

  const clearAttachment = () => {
    if (attachment.previewUrl && isObjectURL(attachment.previewUrl)) {
      URL.revokeObjectURL(attachment.previewUrl);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setAttachment({ file: null, previewUrl: '' });
    setErrors((prev) => ({ ...prev, attachment: '' }));
  };

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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Please tell us your name';
    if (!formData.email.trim()) newErrors.email = 'Please add an email address so we can reply';
    if (!formData.message.trim()) newErrors.message = 'Please write a message';

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

    setErrors((prev) => ({ ...prev, attachment: '' }));

    try {
      // upload attachment
      let imageKey = null;

      if (attachment.file) {
        const { key } = await presignAndUpload({
          resource: 'contact',
          file: attachment.file,
          filename: attachment.file.name,
        });

        imageKey = key;
      }

      const payload = {
        ...formData,
        imageKey,
      };

      await client.post(SUBMIT_CONTACT_FORM_API, payload, false);

      setSubmitState(submitStates[3]);
      setFormData(emptyContactFormData);
      clearAttachment();
    } catch (err) {
      console.error('Unable to submit contact request', err);
      setSubmitState(submitStates[2]);

      if (alertRef.current) {
        alertRef.current.focus();
      }
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
          required
        />
      </FormField>

      {/* Upload */}
      <UploadFileInput
        fileInputRef={fileInputRef}
        attachment={attachment}
        accept={ACCEPT}
        maxSizeMb={MAX_IMAGE_SIZE_MB}
        onFileSelect={handleFileSelect}
        onRemoveFile={clearAttachment}
        error={errors.attachment}
        label='Screenshot (optional)'
        dropLabel='Click or drop an image'
        helpText={`If something on the site looks wrong, a screenshot helps us find it. Images only, up to ${MAX_IMAGE_SIZE_MB} MB.`}
      />

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
            ? 'Your message could not be sent. Please try again.'
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
