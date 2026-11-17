// Events
import { logEvent } from '../utils/events/logEvent.js';
import {
  createContactCreateRequestedEvent,
  createContactCreateSuccessEvent,
  createContactGetAllRequestedEvent,
  createContactGetAllSuccessEvent,
  createContactDeleteRequestedEvent,
  createContactDeleteSuccessEvent,
  createContactDeleteAllRequestedEvent,
  createContactDeleteAllSuccessEvent,
} from '../event/contactUtils.js';
// Domain
import {
  createContactFormInDB,
  findAllContactForms,
  deleteContactFormById,
  findContactFormImageKeys,
  deleteAllContactFormsFromDB,
} from '../domain/contact.js';
// Responses
import {
  DOMAINS,
  EVENT_MESSAGES,
  sendDataResponse,
  sendMessageResponse,
} from '../utils/responses/responses.js';
// Errors
import {
  BadRequestEvent,
  NotFoundEvent,
  ServerErrorEvent,
  createGenericErrorEvent,
} from '../event/errorUtils.js';
// Email
import { sendContactEmail } from '../services/email/emailHandler.js';
import { runAfterResponse } from '../utils/background.js';
import { BusinessName, BusinessSiteUrl, BusinessUrl } from '../utils/constants/siteConstants.js';
// Media
import { isUsableContactImage, hardDeleteObject } from '../services/s3/mediaService.js';
import { publicMediaUrlFrom } from '../utils/media/publicMediaUrl.js';
// Sanitization
import { sanitizeText, normalizeEmail } from '../utils/sanitize.js';

export const createNewContactFormHandler = async (req, res) => {
  const { name = '', email = '', message = '', imageKey = '' } = req.body || {};

  try {
    const cleanName = sanitizeText(name, { maxLength: 120 });
    // Becomes the notification email's reply-to: a real address or nothing
    const cleanEmail = normalizeEmail(email);
    const cleanMessage = sanitizeText(message, { maxLength: 2000 });

    // Name and a message are required
    if (!cleanName || !cleanMessage) {
      const badRequest = new BadRequestEvent(
        req.user,
        DOMAINS.contact,
        EVENT_MESSAGES.malformedData
      );
      logEvent(createGenericErrorEvent(badRequest));
      return sendMessageResponse(res, badRequest.code, badRequest.message);
    }

    // So is a valid email address
    if (!cleanEmail) {
      const badRequest = new BadRequestEvent(req.user, DOMAINS.contact, EVENT_MESSAGES.invalidEmail);
      logEvent(createGenericErrorEvent(badRequest));
      return sendMessageResponse(res, badRequest.code, badRequest.message);
    }

    // imageKey: a confirmed contact image, uploaded within the hour, on no other form
    if (imageKey && !(typeof imageKey === 'string' && (await isUsableContactImage(imageKey)))) {
      const badRequest = new BadRequestEvent(
        req.user,
        DOMAINS.contact,
        'The attached image has expired or can’t be used. Please attach it again.'
      );
      logEvent(createGenericErrorEvent(badRequest));
      return sendMessageResponse(res, badRequest.code, badRequest.message);
    }

    logEvent(createContactCreateRequestedEvent({
      user: req.user,
      email: cleanEmail,
    }));

    const created = await createContactFormInDB({
      name: cleanName,
      email: cleanEmail,
      message: cleanMessage,
      imageKey: imageKey || null,
    });

    if (!created) {
      const badRequest = new BadRequestEvent(
        req.user,
        DOMAINS.contact,
        EVENT_MESSAGES.createContactFormFail
      );
      logEvent(createGenericErrorEvent(badRequest));
      return sendMessageResponse(res, badRequest.code, badRequest.message);
    }

    logEvent(createContactCreateSuccessEvent({
      user: req.user,
      id: created.id,
      email: created.email,
    }));

    sendDataResponse(res, 201, { contactForm: created });

    // Notify admin after response (best-effort)
    runAfterResponse(sendContactEmail(
      process.env.CONTACT_ADMIN_RECIEVER_EMAIL,
      'New Contact Form Received',
      'contactFormNotification',
      {
        title: 'New Contact Form Received',
        // Field order here matches the ContactForm Prisma model.
        name: created.name,
        email: created.email,
        message: created.message,
        imageUrl: created.imageKey ? publicMediaUrlFrom(created.imageKey) : null,
        createdAt: created.createdAt.toLocaleString('en-GB', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        businessName: BusinessName,
        businessUrl: BusinessUrl,
        businessSiteUrl: BusinessSiteUrl,
        year: new Date().getFullYear(),
      }
    ).then((emailSent) => {
      if (!emailSent) {
        logEvent(createGenericErrorEvent(
          new ServerErrorEvent(
            req.user,
            DOMAINS.contact,
            EVENT_MESSAGES.contactNotificationEmailFailed
          )
        ));
      }
    }));
  } catch (err) {
    const serverError = new ServerErrorEvent(
      req.user,
      DOMAINS.contact,
      `Create contact form failed ${err.message}`
    );
    logEvent(createGenericErrorEvent(serverError));
    sendMessageResponse(res, serverError.code, serverError.message);
  }
};

export const getAllContactFormsHandler = async (req, res) => {
  try {
    logEvent(createContactGetAllRequestedEvent({ user: req.user }));

    const found = await findAllContactForms();

    if (!found) {
      const notFound = new NotFoundEvent(
        req.user,
        DOMAINS.contact,
        EVENT_MESSAGES.contactFormsNotFound
      );
      logEvent(createGenericErrorEvent(notFound));
      return sendMessageResponse(res, notFound.code, notFound.message);
    }

    logEvent(createContactGetAllSuccessEvent({
      user: req.user,
      count: found.length,
    }));

    return sendDataResponse(res, 200, { contactForms: found });
  } catch (err) {
    const serverError = new ServerErrorEvent(
      req.user,
      DOMAINS.contact,
      `Get all contact forms failed ${err.message}`
    );
    logEvent(createGenericErrorEvent(serverError));
    sendMessageResponse(res, serverError.code, serverError.message);
  }
};

export const deleteContactFormHandler = async (req, res) => {
  const { contactFormId } = req.params;

  try {
    if (!contactFormId) {
      const badRequest = new BadRequestEvent(
        req.user,
        DOMAINS.contact,
        EVENT_MESSAGES.missingUserIdentifier
      );
      logEvent(createGenericErrorEvent(badRequest));
      return sendMessageResponse(res, badRequest.code, badRequest.message);
    }

    logEvent(createContactDeleteRequestedEvent({
      user: req.user,
      id: contactFormId,
    }));

    const deleted = await deleteContactFormById(contactFormId);

    if (!deleted) {
      const badRequest = new BadRequestEvent(
        req.user,
        DOMAINS.contact,
        EVENT_MESSAGES.deleteContactFormFail
      );
      logEvent(createGenericErrorEvent(badRequest));
      return sendMessageResponse(res, badRequest.code, badRequest.message);
    }

    // Best-effort S3 cleanup
    if (deleted.imageKey) {
      try {
        await hardDeleteObject({ key: deleted.imageKey, user: req.user });
      } catch (e) {
        logEvent(createGenericErrorEvent(
          new ServerErrorEvent(req.user, DOMAINS.contact, `Contact form image S3 delete failed: ${String(e)}`)
        ));
      }
    }

    logEvent(createContactDeleteSuccessEvent({
      user: req.user,
      id: contactFormId,
    }));

    return sendDataResponse(res, 200, { message: 'Success: Contact form deleted' });
  } catch (err) {
    // Already gone
    if (err?.code === 'P2025') {
      const notFound = new NotFoundEvent(req.user, DOMAINS.contact, EVENT_MESSAGES.contactFormsNotFound);
      logEvent(createGenericErrorEvent(notFound));
      return sendMessageResponse(res, notFound.code, notFound.message);
    }
    const serverError = new ServerErrorEvent(
      req.user,
      DOMAINS.contact,
      `Delete contact form failed ${err.message}`
    );
    logEvent(createGenericErrorEvent(serverError));
    sendMessageResponse(res, serverError.code, serverError.message);
  }
};

export const deleteAllContactFormsHandler = async (req, res) => {
  try {
    logEvent(createContactDeleteAllRequestedEvent({ user: req.user }));

    // Collect image keys before deleteMany
    const withImages = await findContactFormImageKeys();

    const result = await deleteAllContactFormsFromDB();

    if (!result) {
      const badRequest = new BadRequestEvent(
        req.user,
        DOMAINS.contact,
        EVENT_MESSAGES.deleteContactFormFail
      );
      logEvent(createGenericErrorEvent(badRequest));
      return sendMessageResponse(res, badRequest.code, badRequest.message);
    }

    for (const { imageKey } of withImages) {
      try {
        await hardDeleteObject({ key: imageKey, user: req.user });
      } catch (e) {
        logEvent(createGenericErrorEvent(
          new ServerErrorEvent(req.user, DOMAINS.contact, `Contact form image S3 delete failed: ${String(e)}`)
        ));
      }
    }

    logEvent(createContactDeleteAllSuccessEvent({
      user: req.user,
      count: result.count ?? null,
    }));

    return sendDataResponse(res, 200, { message: 'Success: All contact forms deleted' });
  } catch (err) {
    const serverError = new ServerErrorEvent(
      req.user,
      DOMAINS.contact,
      `Delete all contact forms failed ${err.message}`
    );
    logEvent(createGenericErrorEvent(serverError));
    sendMessageResponse(res, serverError.code, serverError.message);
  }
};

