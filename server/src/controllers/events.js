// Prisma enums
import { AppEventLevel, AppEventStatus } from '@prisma/client';
// Events
import { logEvent } from '../utils/events/logEvent.js';
import {
  createEventsUpdateStatusSuccessEvent,
  createEventsDeleteByIdSuccessEvent,
  createEventsDeleteAllSuccessEvent,
} from '../event/eventUtils.js';
// Domain
import {
  deleteAllEventsFromDB,
  deleteEventId,
  findAllEvents,
  findEventById,
  findEventsPage,
  updateEventStatusById,
} from '../domain/events.js';
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
// Sanitization
import { sanitizeText, clampInt } from '../utils/sanitize.js';

const LEVELS = Object.values(AppEventLevel);
const STATUSES = Object.values(AppEventStatus);

const fail = (res, errorEvent) => {
  logEvent(createGenericErrorEvent(errorEvent));
  return sendMessageResponse(res, errorEvent.code, errorEvent.message);
};

const failServer = (req, res, detail) =>
  fail(res, new ServerErrorEvent(req.user, DOMAINS.events, detail));

const notFound = (req) => new NotFoundEvent(req.user, DOMAINS.events, EVENT_MESSAGES.eventNotFound);

// Known enum value or undefined (unknown filters are ignored)
const pickEnum = (value, allowed) => {
  const upper = String(value || '').trim().toUpperCase();
  return allowed.includes(upper) ? upper : undefined;
};

export const getAllEvents = async (req, res) => {
  try {
    const events = await findAllEvents();
    return sendDataResponse(res, 200, { events });
  } catch (err) {
    return failServer(req, res, `Get all events failed ${err.message}`);
  }
};

// ?page=&pageSize=&level=&domain=&status=&search=
export const getPaginatedEvents = async (req, res) => {
  const query = req.query || {};
  const page = clampInt(query.page, { min: 1, max: 100000, fallback: 1 });
  const pageSize = clampInt(query.pageSize, { min: 1, max: 100, fallback: 20 });

  try {
    const { events, total } = await findEventsPage({
      skip: (page - 1) * pageSize,
      take: pageSize,
      level: pickEnum(query.level, LEVELS),
      status: pickEnum(query.status, STATUSES),
      domain: sanitizeText(query.domain, { maxLength: 40 }) || undefined,
      search: sanitizeText(query.search, { maxLength: 100 }) || undefined,
    });

    return sendDataResponse(res, 200, { events, total, page, pageSize });
  } catch (err) {
    return failServer(req, res, `Get paginated events failed ${err.message}`);
  }
};

export const getEventByIdHandler = async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await findEventById(eventId);
    if (!event) return fail(res, notFound(req));

    return sendDataResponse(res, 200, { event });
  } catch (err) {
    return failServer(req, res, `Get event by ID failed ${err.message}`);
  }
};

// Triage: { status: OPEN|ACKNOWLEDGED|RESOLVED|IGNORED }
export const updateEventStatusHandler = async (req, res) => {
  const { eventId } = req.params;
  const status = pickEnum(req.body?.status, STATUSES);

  if (!status) {
    return fail(res, new BadRequestEvent(req.user, DOMAINS.events, EVENT_MESSAGES.invalidEventStatus));
  }

  try {
    const event = await updateEventStatusById(eventId, status);

    logEvent(createEventsUpdateStatusSuccessEvent({ user: req.user, eventId, status }));
    return sendDataResponse(res, 200, { event });
  } catch (err) {
    if (err?.code === 'P2025') return fail(res, notFound(req));
    return failServer(req, res, `${EVENT_MESSAGES.updateEventFailed} ${err.message}`);
  }
};

export const deleteEventByIdHandler = async (req, res) => {
  const { eventId } = req.params;

  try {
    await deleteEventId(eventId);

    logEvent(createEventsDeleteByIdSuccessEvent({ user: req.user, eventId }));
    return sendDataResponse(res, 200, { message: 'Event deleted.', id: eventId });
  } catch (err) {
    if (err?.code === 'P2025') return fail(res, notFound(req));
    return failServer(req, res, `${EVENT_MESSAGES.deleteEventFailed} ${err.message}`);
  }
};

export const deleteAllEventsHandler = async (req, res) => {
  try {
    const { count } = await deleteAllEventsFromDB();

    logEvent(createEventsDeleteAllSuccessEvent({ user: req.user, count }));
    return sendDataResponse(res, 200, { message: 'All events deleted.', count });
  } catch (err) {
    return failServer(req, res, `${EVENT_MESSAGES.deleteEventFailed} ${err.message}`);
  }
};
