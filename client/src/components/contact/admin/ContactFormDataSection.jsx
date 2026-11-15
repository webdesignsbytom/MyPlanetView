import React, { useEffect, useState } from 'react';
// Api
import client from '@/api/client';
// Constants
import {
  GET_ALL_CONTACT_FROMS_API,
  DELETE_CONTACT_FORM_API,
  DELETE_ALL_CONTACT_FORM_API,
} from '@/utils/constants/apiRoutes';
import { CompanyName } from '@/utils/constants/constants';
// Components
import ConfirmModal from '@/components/modals/ConfirmModal';
import PaperCard from '@/components/common/PaperCard';
import ContactFormItem from './ContactFormItem';
import LoadingSpinner from '@/components/utils/LoadingSpinner';

// components/common/Button's `danger` at its `small` size: parchment, deep-red ink
const DANGER_BUTTON =
  'btn-paper [--btn-ink:var(--poster-red-deep)] [--btn-leading:1.25rem] [--btn-pad-x:0.75rem] [--btn-pad-y:0.25rem] [--btn-size:1rem] pointer-coarse:[--btn-pad-y:0.5rem]';

// The contact form submissions (the admin dashboard and its contact forms page), as a
// paper card with "Delete All" on its title strip
function ContactFormDataSection() {
  const [contactForms, setContactForms] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [modalContent, setModalContent] = useState({ header: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchContactForms();
  }, []);

  const fetchContactForms = () => {
    setIsLoading(true);
    client
      .get(GET_ALL_CONTACT_FROMS_API, true)
      .then((res) => {
        if (res?.data?.data?.contactForms) {
          setContactForms(res.data.data.contactForms);
        } else {
          console.error('No contact forms found');
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Unable to retrieve contact form data', err);
        setIsLoading(false);
      });
  };

  const confirmAction = ({ action, header, message }) => {
    setPendingAction(() => action);
    setModalContent({ header, message });
    setModalOpen(true);
  };

  const handleModalConfirm = () => {
    if (pendingAction) pendingAction();
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    confirmAction({
      header: 'Delete Contact Form',
      message: 'Are you sure you want to delete this contact form?',
      action: () => {
        client
          .delete(`${DELETE_CONTACT_FORM_API}/${id}`, true)
          .then(() => {
            setContactForms((prev) => prev.filter((form) => form.id !== id));
          })
          .catch((err) => {
            console.error('Failed to delete contact form', err);
          });
      },
    });
  };

  const handleDeleteAll = () => {
    confirmAction({
      header: 'Delete All Contact Forms',
      message:
        'Are you sure you want to delete all contact forms? This cannot be undone.',
      action: () => {
        client
          .delete(DELETE_ALL_CONTACT_FORM_API, true)
          .then(() => {
            setContactForms([]);
          })
          .catch((err) => {
            console.error('Failed to delete all contact forms', err);
          });
      },
    });
  };

  return (
    <PaperCard
      title='Contact Forms'
      titleId='contact-forms-heading'
      action={
        contactForms.length > 0 ? (
          <div className='grid'>
            <button
              type='button'
              onClick={handleDeleteAll}
              className={DANGER_BUTTON}
              aria-describedby='delete-all-description'
            >
              Delete All
            </button>
            <span id='delete-all-description' className='sr-only'>
              Deletes all stored contact form submissions permanently
            </span>
          </div>
        ) : null
      }
    >
      {/* Contact forms */}
      <section
        className='grid w-full'
        aria-label={`List of submitted contact forms for ${CompanyName}`}
      >
        {isLoading ? (
          <div className='grid w-full place-items-center'>
            <LoadingSpinner lg />
          </div>
        ) : contactForms.length === 0 ? (
          <section
            className='grid w-full place-items-center'
            role='status'
            aria-live='polite'
          >
            <p>No contact forms found.</p>
          </section>
        ) : (
          <ul className='grid gap-3 lg:grid-cols-2'>
            {contactForms.map((form, index) => (
              <li key={form.id} className='grid'>
                <ContactFormItem
                  id={index}
                  form={form}
                  handleDelete={handleDelete}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
      {/* Confirm Modal */}
      {modalOpen && (
        <ConfirmModal
          onClose={() => setModalOpen(false)}
          onConfirm={handleModalConfirm}
          header={modalContent.header}
          message={modalContent.message}
        />
      )}
    </PaperCard>
  );
}

export default ContactFormDataSection;
