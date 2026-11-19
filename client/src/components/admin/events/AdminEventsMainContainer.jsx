import React, { useEffect, useState } from 'react';
// Api
import client from '@/api/client';
// Constants
import {
  GET_PAGINATED_EVENTS_API,
  UPDATE_EVENT_STATUS_API,
  DELETE_EVENT_API,
  DELETE_ALL_EVENTS_API,
} from '@/utils/constants/apiRoutes';
// Components
import ConfirmModal from '@/components/modals/ConfirmModal';
import PaperCard from '@/components/common/PaperCard';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import AdminPagination from '@/components/admin/users/AdminPagination';
import EventAdminItem from './EventAdminItem';
import EventFilters from './EventFilters';

// components/common/Button's `danger` at its `small` size: a delete button's red
const DANGER_BUTTON =
  'btn-danger [--btn-leading:1.25rem] [--btn-pad-x:0.75rem] [--btn-pad-y:0.25rem] [--btn-size:1rem] pointer-coarse:[--btn-pad-y:0.5rem]';

const PAGE_SIZE = 25;
const SEARCH_DELAY_MS = 350;

const LEVELS = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];
const STATUSES = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'IGNORED'];

// Server DOMAINS slugs
const DOMAINS = [
  { value: 'users', label: 'Users' },
  { value: 'contact', label: 'Contact' },
  { value: 'events', label: 'Events' },
  { value: 'auth', label: 'Auth' },
  { value: 'system', label: 'System' },
];

const toTitle = (value) => value.charAt(0) + value.slice(1).toLowerCase();

const STATUS_OPTIONS = STATUSES.map((value) => ({ value, label: toTitle(value) }));

const FILTER_OPTIONS = {
  level: [{ value: '', label: 'All levels' }, ...LEVELS.map((value) => ({ value, label: toTitle(value) }))],
  domain: [{ value: '', label: 'All domains' }, ...DOMAINS],
  status: [{ value: '', label: 'All statuses' }, ...STATUS_OPTIONS],
};

const EMPTY_FILTERS = { level: '', domain: '', status: '' };

function AdminEventsMainContainer() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [result, setResult] = useState({ type: 'success', text: '' });

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [modalContent, setModalContent] = useState({ header: '', message: '' });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Debounce search typing
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Fetch the current page (stale responses ignored)
  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    Object.entries(filters).forEach(([key, value]) => value && params.set(key, value));
    if (search) params.set('search', search);

    setIsLoading(true);
    setLoadError('');
    client
      .get(`${GET_PAGINATED_EVENTS_API}?${params.toString()}`, true)
      .then((res) => {
        if (cancelled) return;
        const data = res?.data?.data || {};
        setEvents(data.events || []);
        setTotal(data.total || 0);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err?.friendlyMessage || 'Unable to load events.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, filters, search, reloadKey]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
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

  const handleStatusChange = async (event, status) => {
    if (status === event.status) return;
    setBusyId(event.id);
    try {
      const res = await client.patch(`${UPDATE_EVENT_STATUS_API}/${event.id}`, { status }, true);
      const updated = res?.data?.data?.event;
      if (updated) setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setResult({ type: 'success', text: `Event marked ${toTitle(status)}.` });
    } catch (err) {
      setResult({ type: 'error', text: err?.friendlyMessage || 'Failed to update the event.' });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = (event) => {
    confirmAction({
      header: 'Delete Event',
      message: 'Are you sure you want to delete this event?',
      action: async () => {
        setBusyId(event.id);
        try {
          await client.delete(`${DELETE_EVENT_API}/${event.id}`, true);
          setResult({ type: 'success', text: 'Event deleted.' });
          if (events.length === 1 && page > 1) setPage(page - 1);
          else setReloadKey((key) => key + 1);
        } catch (err) {
          setResult({ type: 'error', text: err?.friendlyMessage || 'Failed to delete the event.' });
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  const handleDeleteAll = () => {
    confirmAction({
      header: 'Delete All Events',
      message: 'Are you sure you want to delete every event in the audit log? This cannot be undone.',
      action: async () => {
        try {
          await client.delete(DELETE_ALL_EVENTS_API, true);
          setResult({ type: 'success', text: 'All events deleted.' });
          setPage(1);
          setReloadKey((key) => key + 1);
        } catch (err) {
          setResult({ type: 'error', text: err?.friendlyMessage || 'Failed to delete events.' });
        }
      },
    });
  };

  // A paper card (inside AppPageShell's <main>, under the page's title) with "Delete All"
  // on its title strip, its inputs and dropdowns on the paper (paper-fields)
  return (
    <PaperCard
      title='Events'
      titleId='admin-events-list-heading'
      className='paper-fields'
      action={
        total > 0 ? (
          <div className='grid'>
            <button
              type='button'
              onClick={handleDeleteAll}
              className={DANGER_BUTTON}
              aria-describedby='delete-all-events-description'
            >
              Delete All
            </button>
            <span id='delete-all-events-description' className='sr-only'>
              Deletes every event in the audit log permanently
            </span>
          </div>
        ) : null
      }
    >
      <div className='grid w-full gap-y-4'>
        <EventFilters
          filters={filters}
          search={searchInput}
          options={FILTER_OPTIONS}
          onFilterChange={handleFilterChange}
          onSearchChange={setSearchInput}
        />

        {/* Action result */}
        <p
          className={`text-center text-sm min-h-5 ${result.type === 'error' ? 'text-status-critical' : 'text-status-good'}`}
          role='status'
          aria-live='polite'
        >
          {result.text}
        </p>

        <section className='grid w-full h-fit gap-y-4' aria-label='List of events' aria-busy={isLoading ? 'true' : 'false'}>
          {isLoading ? (
            <div className='grid w-full items-center justify-center'>
              <LoadingSpinner lg />
            </div>
          ) : loadError ? (
            <div className='grid items-center justify-center' role='alert'>
              <p className='text-status-critical'>{loadError}</p>
            </div>
          ) : events.length === 0 ? (
            <div className='grid items-center justify-center' role='status' aria-live='polite'>
              <p>No events match these filters.</p>
            </div>
          ) : (
            <ul className='grid gap-3'>
              {events.map((event) => (
                <li key={event.id} className='grid'>
                  <EventAdminItem
                    event={event}
                    statusOptions={STATUS_OPTIONS}
                    busy={busyId === event.id}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                  />
                </li>
              ))}
            </ul>
          )}

          <AdminPagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            label='Audit log pages'
            disabled={isLoading}
          />
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
    </PaperCard>
  );
}

export default AdminEventsMainContainer;
