import React, { useEffect, useState } from 'react';
// Api
import client from '@/api/client';
// Auth
import { useAuth } from '@/auth/AuthContext';
import { hasRole, ROLES } from '@/utils/user/permissions';
// Constants
import {
  ADMIN_GET_ALL_USERS_API,
  ADMIN_CHANGE_USER_ROLE_API,
  ADMIN_DEACTIVATE_USER_API,
  ADMIN_REACTIVATE_USER_API,
  ADMIN_DELETE_USER_API,
} from '@/utils/constants/apiRoutes';
// Components
import ConfirmModal from '@/components/modals/ConfirmModal';
import PaperCard from '@/components/common/PaperCard';
import LoadingSpinner from '@/components/utils/LoadingSpinner';
import AdminPagination from './AdminPagination';
import UserAdminItem from './UserAdminItem';
import UserFilters from './UserFilters';
import UserPlanDialog from './UserPlanDialog';

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 350;

const ROLE_FILTER_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: ROLES.USER, label: 'User' },
  { value: ROLES.ADMIN, label: 'Admin' },
  { value: ROLES.DEVELOPER, label: 'Developer' },
];

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Deactivated' },
];

const ROLE_LABELS = { [ROLES.USER]: 'User', [ROLES.ADMIN]: 'Admin', [ROLES.DEVELOPER]: 'Developer' };

const normalizeRole = (role) => String(role || '').toUpperCase();

function AdminUsersMainContainer() {
  const { user: viewer } = useAuth();
  const viewerIsDeveloper = hasRole(viewer, ROLES.DEVELOPER);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [result, setResult] = useState({ type: 'success', text: '' });

  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [modalContent, setModalContent] = useState({ header: '', message: '' });
  // The user whose memberships are open
  const [planUser, setPlanUser] = useState(null);

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
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    if (statusFilter) params.set('status', statusFilter);

    setIsLoading(true);
    setLoadError('');
    client
      .get(`${ADMIN_GET_ALL_USERS_API}?${params.toString()}`, true)
      .then((res) => {
        if (cancelled) return;
        const data = res?.data?.data || {};
        setUsers(data.users || []);
        setTotal(data.total || 0);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err?.friendlyMessage || 'Unable to load users.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, search, roleFilter, statusFilter, reloadKey]);

  // Mirrors the server rules (server still enforces them)
  const lockedReasonFor = (target) => {
    if (target.id === viewer?.id) return 'This is your account — manage it from your account page.';
    if (!viewerIsDeveloper && normalizeRole(target.role) === ROLES.DEVELOPER) {
      return 'Only a developer can manage developer accounts.';
    }
    return null;
  };

  const roleOptionsFor = (target) => {
    const roles = [ROLES.USER, ROLES.ADMIN];
    if (viewerIsDeveloper || normalizeRole(target.role) === ROLES.DEVELOPER) roles.push(ROLES.DEVELOPER);
    return roles.map((role) => ({ value: role, label: ROLE_LABELS[role] }));
  };

  const replaceUser = (updated) => {
    if (!updated) return;
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  };

  // Shared request wrapper: busy row + aria-live result
  const runAction = async (target, request, successText) => {
    setBusyId(target.id);
    setResult({ type: 'success', text: '' });
    try {
      const res = await request();
      setResult({ type: 'success', text: successText });
      return res;
    } catch (err) {
      setResult({ type: 'error', text: err?.friendlyMessage || 'That action failed. Please try again.' });
      return null;
    } finally {
      setBusyId(null);
    }
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

  const handleSaveRole = async (target, newRole) => {
    const label = ROLE_LABELS[newRole] || newRole;
    const res = await runAction(
      target,
      () => client.patch(ADMIN_CHANGE_USER_ROLE_API, { userId: target.id, newRole }, true),
      `${target.name || target.email} is now ${label}.`,
    );
    replaceUser(res?.data?.data?.user);
  };

  const handleDeactivate = (target) => {
    confirmAction({
      header: 'Deactivate User',
      message: `Deactivate ${target.name || target.email}? They will be signed out everywhere and can't sign in until reactivated.`,
      action: async () => {
        const res = await runAction(
          target,
          () => client.patch(`${ADMIN_DEACTIVATE_USER_API}/${target.id}`, {}, true),
          `${target.name || target.email} has been deactivated.`,
        );
        replaceUser(res?.data?.data?.user);
      },
    });
  };

  const handleReactivate = async (target) => {
    const res = await runAction(
      target,
      () => client.patch(`${ADMIN_REACTIVATE_USER_API}/${target.id}`, {}, true),
      `${target.name || target.email} has been reactivated.`,
    );
    replaceUser(res?.data?.data?.user);
  };

  const handleDelete = (target) => {
    confirmAction({
      header: 'Delete User',
      message: `Permanently delete ${target.name || target.email} and their avatar? This cannot be undone.`,
      action: async () => {
        const res = await runAction(
          target,
          () => client.delete(`${ADMIN_DELETE_USER_API}/${target.id}`, true),
          `${target.name || target.email} has been deleted.`,
        );
        if (!res) return;
        // Step back if this emptied the page
        if (users.length === 1 && page > 1) setPage(page - 1);
        else setReloadKey((key) => key + 1);
      },
    });
  };

  const handleRoleFilterChange = (value) => {
    setRoleFilter(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  // A paper card (inside AppPageShell's <main>, under the page's title), its inputs and
  // dropdowns on the paper (paper-fields)
  return (
    <PaperCard title='Users' titleId='admin-users-list-heading' className='paper-fields'>
      <div className='grid w-full gap-y-4'>
        <UserFilters
          search={searchInput}
          role={roleFilter}
          status={statusFilter}
          roleOptions={ROLE_FILTER_OPTIONS}
          statusOptions={STATUS_FILTER_OPTIONS}
          onSearchChange={setSearchInput}
          onRoleChange={handleRoleFilterChange}
          onStatusChange={handleStatusFilterChange}
        />

        {/* Action result */}
        <p
          className={`text-center text-sm min-h-5 ${result.type === 'error' ? 'text-status-critical' : 'text-status-good'}`}
          role='status'
          aria-live='polite'
        >
          {result.text}
        </p>

        <section className='grid w-full h-fit gap-y-4' aria-label='List of users' aria-busy={isLoading ? 'true' : 'false'}>
          {isLoading ? (
            <div className='grid w-full items-center justify-center'>
              <LoadingSpinner lg />
            </div>
          ) : loadError ? (
            <div className='grid items-center justify-center' role='alert'>
              <p className='text-status-critical'>{loadError}</p>
            </div>
          ) : users.length === 0 ? (
            <div className='grid items-center justify-center' role='status' aria-live='polite'>
              <p>No users match these filters.</p>
            </div>
          ) : (
            <ul className='grid gap-3 lg:grid-cols-2'>
              {users.map((u) => (
                <li key={`${u.id}-${u.role}`} className='grid'>
                  <UserAdminItem
                    user={u}
                    roleOptions={roleOptionsFor(u)}
                    lockedReason={lockedReasonFor(u)}
                    busy={busyId === u.id}
                    onSaveRole={handleSaveRole}
                    onDeactivate={handleDeactivate}
                    onReactivate={handleReactivate}
                    onDelete={handleDelete}
                    onPlans={setPlanUser}
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
            label='Users pages'
            disabled={isLoading}
          />
        </section>
      </div>

      {/* Complimentary memberships for one user */}
      {planUser ? <UserPlanDialog user={planUser} onClose={() => setPlanUser(null)} /> : null}

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

export default AdminUsersMainContainer;
