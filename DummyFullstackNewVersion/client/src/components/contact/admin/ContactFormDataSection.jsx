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
import ContactFormItem from './ContactFormItem';
import LoadingSpinner from '@/components/utils/LoadingSpinner';

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
    <section className='grid w-full gap-y-6'>
      {/* Header */}
      <section
        className='grid w-full bg-colour6 px-4 lg:px-6 py-3 h-fit border-b-4 border-solid border-colour6'
        aria-label='Contact form admin header'
      >
        <div className='grid grid-flow-col items-center justify-between'>
          <div>
            <h2 className='sm:text-lg md:text-xl lg:text-2xl font-semibold text-colour1'>
              Contact Forms
            </h2>
          </div>
          {contactForms.length > 0 && (
            <div>
              <button
                onClick={handleDeleteAll}
                className='solid-danger hover:brightness-110 font-semibold py-1 px-4 rounded'
                aria-describedby='delete-all-description'
              >
                Delete All
              </button>
              <span id='delete-all-description' className='sr-only'>
                Deletes all stored contact form submissions permanently
              </span>
            </div>
          )}
        </div>
      </section>

      <div className='grid w-full mx-auto max-w-6xl px-4'>
        {/* Contact forms */}
        <section
          className='grid w-full h-fit'
          aria-label={`List of submitted contact forms for ${CompanyName}`}
        >
          {isLoading ? (
            <div className='grid w-full items-center justify-center'>
              <LoadingSpinner lg />
            </div>
          ) : contactForms.length === 0 ? (
            <section
              className='grid items-center justify-center h-full w-full'
              role='status'
              aria-live='polite'
            >
              <p>No contact forms found.</p>
            </section>
          ) : (
            <ul className='grid gap-y-2 lg:grid-cols-2 gap-x-2'>
              {contactForms.map((form, index) => (
                <li key={form.id}>
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
      </div>
      {/* Confirm Modal */}
      {modalOpen && (
        <ConfirmModal
          onClose={() => setModalOpen(false)}
          onConfirm={handleModalConfirm}
          header={modalContent.header}
          message={modalContent.message}
        />
      )}
    </section>
  );
}

export default ContactFormDataSection;
